// MIKU FX — เอฟเฟกต์คอนเสิร์ต: สปอตไลต์เวทีส่าย, ไฟเวทีวาบ, โน้ตเพลงลอย, ประกายดาวตามเมาส์, คลื่นเสียง + โน้ตกระจายตอนคลิก,
// ฉาก "MODULE CHANGE" ตอนสลับโหมด และฉากเปิดตัว · เปิด/ปิดได้ที่ปุ่ม ✦ FX บนแถบนำทาง (จำค่าไว้ในเบราว์เซอร์)
// สี: มิ้นต์ #39C5BB + ชมพู #E12885 (กลางคืนสว่าง/เรืองแสงกว่า)
// ไม่แตะตรรกะของระบบ: วาดบน canvas ที่ pointer-events:none และ overlay ชั่วคราวเท่านั้น
(function () {
  'use strict';

  var KEY = 'mk_fx_v1';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  var enabled = !reduce;
  try { var saved = localStorage.getItem(KEY); if (saved !== null) enabled = saved === '1'; } catch (e) { /* ข้าม */ }

  var root = document.documentElement;
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function palette() {
    return isDay()
      ? { a: [57, 197, 187], b: [225, 40, 133], flash: [255, 255, 255] }
      : { a: [63, 224, 212], b: [255, 79, 168], flash: [170, 255, 248] };
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function setClass() { root.classList.toggle('mk-fx-on', enabled); }
  setClass();

  /* ---------------- แสงเวที + โน้ตลอย (canvas) ---------------- */
  var canvas = document.createElement('canvas');
  canvas.id = 'mkSky';
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  var notes = [];       // โน้ตเพลงลอย
  var flashAlpha = 0;   // แสงไฟเวทีวาบ
  var nextFlash = 0;
  var trail = [];       // ประกายตามเมาส์
  var rings = [];       // วงคลื่นเสียงตอนคลิก
  var burst = [];       // โน้ตกระจายตอนคลิก
  var mouse = { x: -999, y: -999, t: 0 };
  var lastT = 0, slowFrames = 0, heavy = true;
  var GLYPH = ['♪', '♫', '♩', '♬'];

  function spawnNote(initial) {
    notes.push({
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 30,
      vy: -(0.18 + Math.random() * 0.4),
      sz: 12 + Math.random() * 16,
      ph: Math.random() * 6.28,
      rot: (Math.random() - 0.5) * 0.6,
      g: GLYPH[Math.floor(Math.random() * GLYPH.length)],
      pink: Math.random() < 0.35,
      life: 0, max: 700 + Math.random() * 600
    });
  }
  // สปอตไลต์เวที: กรวยแสงจากเพดาน ส่ายช้าๆ
  function spot(x0, ang, len, wid, col, alpha) {
    var x1 = x0 + Math.sin(ang) * len, y1 = Math.cos(ang) * len;
    var g = ctx.createLinearGradient(x0, 0, x1, y1);
    g.addColorStop(0, rgba(col, alpha));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    var nx = Math.cos(ang) * wid, ny = -Math.sin(ang) * wid;
    ctx.beginPath();
    ctx.moveTo(x0 - 6, -4); ctx.lineTo(x0 + 6, -4);
    ctx.lineTo(x1 + nx, y1 + ny); ctx.lineTo(x1 - nx, y1 - ny);
    ctx.closePath(); ctx.fill();
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!enabled || document.hidden) { if (canvas.style.display !== 'none') { ctx.clearRect(0, 0, W, H); canvas.style.display = 'none'; } return; }
    if (canvas.style.display === 'none') canvas.style.display = '';
    var dt = lastT ? ts - lastT : 16;
    lastT = ts;
    // เครื่องช้า: ปิดสปอตไลต์อัตโนมัติ
    if (dt > 45) slowFrames++; else if (slowFrames > 0) slowFrames--;
    if (slowFrames > 90) heavy = false;

    var t = ts / 1000;
    var pal = palette();
    var day = isDay();
    ctx.clearRect(0, 0, W, H);

    // สปอตไลต์ 3 ดวง (มิ้นต์ · ชมพู · มิ้นต์)
    if (heavy) {
      ctx.globalCompositeOperation = 'lighter';
      var boost = 1 + flashAlpha * 8;
      var base = (day ? 0.05 : 0.09) * boost;
      spot(W * 0.18, Math.sin(t * 0.35) * 0.35 + 0.25, H * 1.15, W * 0.12, pal.a, base);
      spot(W * 0.5, Math.sin(t * 0.28 + 2) * 0.4, H * 1.2, W * 0.1, pal.b, base * 0.9);
      spot(W * 0.82, Math.sin(t * 0.32 + 4) * 0.35 - 0.25, H * 1.15, W * 0.12, pal.a, base);
      ctx.globalCompositeOperation = 'source-over';
    }
    // ไฟเวทีวาบเป็นระยะ
    if (heavy && ts > nextFlash) {
      flashAlpha = day ? 0.06 : 0.1;
      if (window.MKFX && window.MKFX.onBolt) window.MKFX.onBolt(Math.random());
      nextFlash = ts + 12000 + Math.random() * 12000;
    }
    if (flashAlpha > 0.002) {
      var gf = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H);
      gf.addColorStop(0, rgba(pal.flash, flashAlpha));
      gf.addColorStop(1, rgba(pal.flash, 0));
      ctx.fillStyle = gf;
      ctx.fillRect(0, 0, W, H);
      flashAlpha *= 0.93;
    }

    // โน้ตเพลงลอยขึ้นช้าๆ
    var target = day ? 18 : 26;
    while (notes.length < target) spawnNote(notes.length < target * 0.7);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var p = notes.length - 1; p >= 0; p--) {
      var n = notes[p];
      n.life++; n.ph += 0.02;
      n.y += n.vy; n.x += Math.sin(n.ph) * 0.3;
      var al = Math.sin(Math.min(1, n.life / n.max) * Math.PI) * (day ? 0.22 : 0.3);
      ctx.save();
      ctx.translate(n.x, n.y); ctx.rotate(n.rot + Math.sin(n.ph) * 0.15);
      ctx.fillStyle = rgba(n.pink ? pal.b : pal.a, al);
      ctx.font = '700 ' + n.sz + 'px "M PLUS Rounded 1c", sans-serif';
      ctx.fillText(n.g, 0, 0);
      ctx.restore();
      if (n.life > n.max || n.y < -40) notes.splice(p, 1);
    }

    // ประกายดาวตามเมาส์
    var now = ts;
    while (trail.length && now - trail[0].t > 600) trail.shift();
    ctx.globalCompositeOperation = 'lighter';
    for (var q = 0; q < trail.length; q++) {
      var tp = trail[q], age = (now - tp.t) / 600;
      var r0 = 3.2 * (1 - age) + 0.6;
      ctx.fillStyle = rgba(q % 2 ? pal.a : pal.b, 0.75 * (1 - age));
      ctx.beginPath(); ctx.arc(tp.x + Math.sin(q) * 2, tp.y + age * 10, r0, 0, 6.283); ctx.fill();
    }

    // วงคลื่นเสียงตอนคลิก
    for (var r = rings.length - 1; r >= 0; r--) {
      var rg = rings[r];
      rg.r += 4.5; rg.a *= 0.92;
      ctx.lineWidth = 2;
      for (var k = 0; k < 3; k++) {
        ctx.strokeStyle = rgba(k % 2 ? pal.b : pal.a, rg.a * (1 - k * 0.25));
        ctx.beginPath(); ctx.arc(rg.x, rg.y, Math.max(1, rg.r - k * 9), -0.6, 0.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(rg.x, rg.y, Math.max(1, rg.r - k * 9), Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
      }
      if (rg.a < 0.03) rings.splice(r, 1);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (var u = burst.length - 1; u >= 0; u--) {
      var bu = burst[u];
      bu.x += bu.vx; bu.y += bu.vy; bu.vx *= 0.95; bu.vy = bu.vy * 0.95 - 0.03; bu.a *= 0.95;
      ctx.fillStyle = rgba(bu.hot ? pal.a : pal.b, bu.a);
      ctx.font = '700 ' + bu.s + 'px "M PLUS Rounded 1c", sans-serif';
      ctx.fillText(bu.g, bu.x, bu.y);
      if (bu.a < 0.04) burst.splice(u, 1);
    }
  }

  function onMove(e) {
    if (!enabled) return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    var last = trail[trail.length - 1];
    if (!last || Math.abs(last.x - mouse.x) + Math.abs(last.y - mouse.y) > 10) {
      trail.push({ x: mouse.x, y: mouse.y, t: performance.now() });
      if (trail.length > 22) trail.shift();
    }
  }
  function onDown(e) {
    if (!enabled) return;
    rings.push({ x: e.clientX, y: e.clientY, r: 10, a: 0.9 });
    for (var i = 0; i < 7; i++) {
      var ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 1.5 + Math.random() * 3;
      burst.push({ x: e.clientX, y: e.clientY, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, s: 12 + Math.random() * 10, a: 0.95, hot: i % 2 === 0, g: GLYPH[i % GLYPH.length] });
    }
  }

  /* ---------------- ฉาก MODULE CHANGE / เปิดตัว (DOM overlay) ---------------- */
  function overlay(kind, title, sub, toDay) {
    if (!enabled) return;
    var old = document.getElementById('mkModule');
    if (old) old.remove();
    var el = document.createElement('div');
    el.id = 'mkModule';
    var day = (typeof toDay === 'boolean') ? toDay : isDay();
    el.className = 'mk-module mk-module-' + kind + (day ? ' is-day' : ' is-night');
    el.innerHTML =
      '<div class="mk-module-flash"></div>' +
      '<div class="mk-module-ring r1"></div><div class="mk-module-ring r2"></div><div class="mk-module-ring r3"></div>' +
      '<div class="mk-module-beam"></div>' +
      '<div class="mk-module-title"><small>' + sub + '</small><b>' + title + '</b></div>';
    document.body.appendChild(el);
    var done = function () { if (el.parentNode) el.remove(); };
    el.addEventListener('click', done);
    setTimeout(done, kind === 'intro' ? 1900 : 1500);
  }

  function hookThemeSwitch() {
    document.addEventListener('click', function (e) {
      var opt = e.target.closest && e.target.closest('[data-theme-choice]');
      if (!opt) return;
      var want = opt.getAttribute('data-theme-choice');
      var isNow = isDay() ? 'light' : 'dark';
      if (want === isNow) return;
      if (window.MKEPIC && window.MKEPIC.moduleChange(want)) return; // ฉาก MODULE CHANGE แบบเต็ม (mk-epic.js)
      overlay('moduleChange', want === 'light' ? 'HATSUNE MIKU' : 'MIKU NIGHT LIVE', 'MODULE CHANGE', want === 'light');
    }, true);
  }

  /* ---------------- ปุ่มเปิด/ปิด FX ---------------- */
  function addToggle() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.getElementById('mkFxToggle')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'mkFxToggle';
    b.className = 'mk-fx-toggle';
    b.title = 'เปิด/ปิดเอฟเฟกต์ MIKU';
    var paint = function () { b.textContent = enabled ? '✦ FX' : '✧ FX'; b.setAttribute('aria-pressed', String(enabled)); };
    b.addEventListener('click', function () {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) { /* ข้าม */ }
      setClass(); paint();
      if (enabled) overlay('moduleChange', 'MIKU', 'MIKU MIKU BEAM');
    });
    paint();
    var sw = bar.querySelector('.theme-switch');
    bar.insertBefore(b, sw || null);
  }

  function init() {
    document.body.insertBefore(canvas, document.body.firstChild);
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true, capture: true });
    addToggle();
    hookThemeSwitch();
    requestAnimationFrame(frame);
    // ฉากเปิดตัว: ครั้งแรกของแท็บ/เซสชัน
    var seen = false;
    try { seen = sessionStorage.getItem('mk_intro') === '1'; sessionStorage.setItem('mk_intro', '1'); } catch (e) { /* ข้าม */ }
    // mk-stage.js มีฉากเปิดแอป MIKU DISC ของตัวเอง
    if (!seen && !window.MK_CUSTOM_INTRO) setTimeout(function () { overlay('intro', 'MIKU', 'VIRTUAL DIVA'); }, 150);
  }

  // ให้ mk-fx2.js (มิกุ/HUD/ชาร์จพลัง/ปุ่มลับ) เรียกใช้ฉากและไฟเวทีวาบได้
  window.MKFX = {
    overlay: overlay,
    strike: function () { nextFlash = 0; },
    burst: function (x, y) { onDown({ clientX: x, clientY: y }); },
    isOn: function () { return enabled; },
    isDay: isDay
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
