// MIKU 3D — ฮอลล์คอนเสิร์ต 3 มิติ (WebGL เขียนเอง ไม่ใช้ไลบรารี ใช้ออฟไลน์ได้) + การ์ดเอียงตามเมาส์
//  - พื้นเวทีจอ LED เรืองแสง (ช่องไฟกะพริบตามจังหวะ) + สปอตไลต์ 3 ดวงส่ายจากเพดาน + แสงโบเก้ลอย
//  - กล้องขยับตามเมาส์ (พารัลแลกซ์) · ไฟเวทีวาบจาก mk-fx.js ทำให้ฮอลล์สว่างวาบ
//  - การ์ดเล็ก (สถิติ/การ์ดนำเข้า) เอียงตามเมาส์พร้อมแสงสะท้อน
// ทำงานเมื่อเปิดทั้ง ✦ FX และปุ่ม ◈ 3D (จำค่าไว้ในเบราว์เซอร์) · เครื่องช้าจะลดความละเอียดเอง ช้ามากจะปิดฉาก 3D เอง
(function () {
  'use strict';

  var KEY = 'mk_3d_v1';
  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  var enabled = !reduce;
  try { var saved = localStorage.getItem(KEY); if (saved !== null) enabled = saved === '1'; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('mk-fx-on'); }
  function active() { return enabled && !reduce && fxOn() && !document.hidden; }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function setClass() { root.classList.toggle('mk-3d-on', enabled && !reduce); }
  setClass();

  /* ================= ฮอลล์คอนเสิร์ต (WebGL) ================= */
  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uT;uniform vec2 uM;uniform float uScroll;',
    'uniform vec3 uCloud;uniform vec3 uLit;uniform vec3 uGlow;uniform vec3 uFlashC;',
    'uniform float uFlash;uniform float uFlashX;uniform float uDens;',
    'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    // ลำแสงสปอตไลต์จากเพดาน (o = จุดกำเนิด, ang = มุมส่าย, w = ความกว้าง)
    'float beam(vec2 p,vec2 o,float ang,float w){vec2 d=p-o;float an=atan(d.x,-d.y);return exp(-pow((an-ang)/w,2.))*smoothstep(0.,.7,-d.y);}',
    'void main(){',
    ' vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' p+=uM*vec2(.04,.03);',
    ' float hor=-.2+uM.y*.03+uScroll*.1;',
    ' vec3 col=vec3(0.);float a=0.;',
    // พื้นเวทีจอ LED: ตารางเรืองแสง + ช่องไฟกะพริบตามจังหวะ วิ่งเข้าหากล้องช้าๆ
    ' if(p.y<hor){float z=.35/(hor-p.y);vec2 g=vec2(p.x*z*1.2,z+uT*.55);',
    '  vec2 f=abs(fract(g)-.5);float line=smoothstep(.46,.5,max(f.x,f.y));',
    '  float fog=exp(-z*.12);float tl=h(floor(g));float pulse=step(.86,fract(tl*7.+uT*.6));',
    '  col+=(uLit*line+uGlow*pulse*.4+uCloud*.5)*fog;a+=(line*.75+pulse*.3+.3)*fog;}',
    // สปอตไลต์ 3 ดวง (มิ้นต์ ชมพู มิ้นต์)
    ' float b1=beam(p,vec2(-.7,.62),sin(uT*.4)*.45+.25,.08);',
    ' float b2=beam(p,vec2(0.,.64),sin(uT*.33+2.)*.4,.07);',
    ' float b3=beam(p,vec2(.7,.62),sin(uT*.37+4.)*.45-.25,.08);',
    ' col+=uLit*(b1+b3)*.4+uGlow*b2*.4;a+=(b1+b2+b3)*.28;',
    // แสงโบเก้ลอย (แท่งไฟเชียร์/ไฟเวทีไกลๆ)
    ' for(int i=0;i<16;i++){float fi=float(i);',
    '  vec2 c=vec2(fract(sin(fi*12.9898)*43758.5)*2.-1.,fract(sin(fi*78.233)*12345.6)*.9-.15);',
    '  c.x*=uRes.x/uRes.y*.55;c+=vec2(sin(uT*.2+fi*2.),sin(uT*.3+fi))*.035;',
    '  float r=.012+fract(fi*.37)*.03;float k=smoothstep(r,r*.25,length(p-c));',
    '  col+=(mod(fi,2.)<1.?uLit:uGlow)*k*.55;a+=k*.35;}',
    ' float band=exp(-abs(p.y-hor)*10.);col+=uGlow*band*.45;a+=band*.3;',
    ' col+=uFlashC*uFlash*.25*exp(-abs(p.x-uFlashX)*1.5);a+=uFlash*.12;',
    ' gl_FragColor=vec4(col*uDens,min(a*uDens,.88));}'
  ].join('\n');

  var cv, gl, prog, U = {}, scale = 0.5, broken = false;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 }, flash = 0, flashX = 0;
  var slow = 0, fast = 0, last = 0, acc = 0, skyT = 0, lastDraw = 0;
  // บรรยากาศ (ตั้งจาก mk-world.js): dens = ความเข้มแสง, speed = ความเร็วจังหวะ, tint = สีที่ผสมเข้าไฟเวที
  window.MK3D = { weather: { dens: 1, speed: 1, tint: null, tintAmt: 0 } };

  function palette() {
    return isDay()
      // กลางวัน: เวทีสว่าง · เส้นมิ้นต์ · ไฟชมพู
      ? { cloud: [0.80, 0.95, 0.94], lit: [0.22, 0.77, 0.73], glow: [0.88, 0.16, 0.52], flash: [1.0, 1.0, 1.0], dens: 0.5 }
      // กลางคืน: ฮอลล์มืด · มิ้นต์เรืองแสง · ชมพูนีออน
      : { cloud: [0.02, 0.07, 0.09], lit: [0.25, 0.88, 0.83], glow: [1.0, 0.31, 0.66], flash: [0.7, 1.0, 0.97], dens: 1.0 };
  }

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function setup() {
    cv = document.createElement('canvas');
    cv.id = 'mk3d';
    cv.setAttribute('aria-hidden', 'true');
    gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) { broken = true; return; }
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { broken = true; return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uT', 'uM', 'uScroll', 'uCloud', 'uLit', 'uGlow', 'uFlashC', 'uFlash', 'uFlashX', 'uDens'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); broken = true; cv.style.display = 'none'; });
    document.body.insertBefore(cv, document.body.firstChild);
    resize();
  }
  function resize() {
    if (!cv) return;
    cv.width = Math.max(2, Math.round(window.innerWidth * scale));
    cv.height = Math.max(2, Math.round(window.innerHeight * scale));
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (broken) return;
    if (!active()) { if (cv.style.display !== 'none') cv.style.display = 'none'; last = 0; return; }
    if (cv.style.display === 'none') cv.style.display = '';
    var dt = last ? ts - last : 16;
    last = ts;
    // จำกัด ~30 เฟรม/วินาที พอสำหรับฉากนี้ และประหยัดเครื่อง
    acc += dt;
    if (acc < 30) return;
    // ปรับความละเอียดตามความเร็วเครื่อง
    if (acc > 60) { slow++; fast = 0; } else if (acc < 40) { fast++; if (slow > 0) slow--; }
    acc = 0;
    if (slow > 45) {
      slow = 0;
      if (scale > 0.26) { scale = Math.max(0.25, scale * 0.7); resize(); }
      else { broken = true; cv.style.display = 'none'; return; } // ช้ามาก: ปิดฉาก 3D
    }

    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    flash *= 0.9;
    var pal = palette();
    var wx = window.MK3D.weather;
    skyT += Math.min(0.2, (ts - (lastDraw || ts)) / 1000) * (wx.speed || 1);
    lastDraw = ts;
    if (wx.tint && wx.tintAmt) {
      var mix = function (c) { return c.map(function (v, i) { return v + (wx.tint[i] - v) * wx.tintAmt; }); };
      pal = { cloud: mix(pal.cloud), lit: mix(pal.lit), glow: mix(pal.glow), flash: pal.flash, dens: pal.dens };
    }
    var sc = Math.min(1, (window.scrollY || 0) / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));

    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(U.uRes, cv.width, cv.height);
    gl.uniform1f(U.uT, skyT);
    gl.uniform2f(U.uM, mouse.x, mouse.y);
    gl.uniform1f(U.uScroll, sc);
    gl.uniform3fv(U.uCloud, pal.cloud);
    gl.uniform3fv(U.uLit, pal.lit);
    gl.uniform3fv(U.uGlow, pal.glow);
    gl.uniform3fv(U.uFlashC, pal.flash);
    gl.uniform1f(U.uFlash, flash);
    gl.uniform1f(U.uFlashX, flashX);
    gl.uniform1f(U.uDens, Math.min(1.6, pal.dens * (wx.dens || 1)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function onMove(e) {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }

  /* ================= การ์ดเอียงตามเมาส์ ================= */
  var TILT_SEL = '.beta-stat, .sun-imp-card, .quick-status-item, .stat, .summary-stats > *, .before-order-stats > *, .scan-stats > *';
  var tiltEl = null;
  function tiltOn() { return enabled && !reduce && fxOn(); }
  function glare(el) {
    var g = el.querySelector(':scope > .mk-glare');
    if (!g) { g = document.createElement('span'); g.className = 'mk-glare'; g.setAttribute('aria-hidden', 'true'); el.appendChild(g); }
    return g;
  }
  function untilt(el) {
    el.classList.remove('mk-tilt');
    el.style.removeProperty('--mk-rx'); el.style.removeProperty('--mk-ry');
  }
  function onTiltMove(e) {
    if (!tiltOn()) { if (tiltEl) { untilt(tiltEl); tiltEl = null; } return; }
    var el = e.target.closest ? e.target.closest(TILT_SEL) : null;
    if (el !== tiltEl) { if (tiltEl) untilt(tiltEl); tiltEl = el; }
    if (!el) return;
    var r = el.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    // การ์ดใหญ่เอียงน้อยลง จะได้ไม่เวียนหัว
    var max = r.width > 360 ? 4 : 9;
    glare(el);
    el.classList.add('mk-tilt');
    el.style.setProperty('--mk-rx', ((0.5 - py) * max).toFixed(2) + 'deg');
    el.style.setProperty('--mk-ry', ((px - 0.5) * max).toFixed(2) + 'deg');
    el.style.setProperty('--mk-gx', (px * 100).toFixed(1) + '%');
    el.style.setProperty('--mk-gy', (py * 100).toFixed(1) + '%');
  }

  /* ================= ปุ่ม ◈ 3D ================= */
  function addToggle() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.getElementById('mk3dToggle')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'mk3dToggle';
    b.className = 'mk-fx-toggle mk-3d-toggle';
    b.title = 'เปิด/ปิดฉาก 3 มิติ (ฮอลล์คอนเสิร์ต 3D + การ์ดเอียง) — ทำงานเมื่อเปิด FX';
    var paint = function () { b.textContent = enabled ? '◈ 3D' : '◇ 3D'; b.setAttribute('aria-pressed', String(enabled)); };
    b.addEventListener('click', function () {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) { /* ข้าม */ }
      if (enabled && broken && gl && !gl.isContextLost()) { broken = false; scale = 0.5; resize(); }
      setClass(); paint();
      if (!enabled && tiltEl) { untilt(tiltEl); tiltEl = null; }
    });
    paint();
    var fx = document.getElementById('mkFxToggle');
    bar.insertBefore(b, fx ? fx.nextSibling : bar.querySelector('.theme-switch'));
  }

  function init() {
    if (reduce) return;
    setup();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointermove', onTiltMove, { passive: true });
    document.addEventListener('pointerleave', function () { if (tiltEl) { untilt(tiltEl); tiltEl = null; } });
    addToggle();
    if (window.MKFX) window.MKFX.onBolt = function (x) { flash = 1; flashX = (x - 0.5) * (window.innerWidth / window.innerHeight); };
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
