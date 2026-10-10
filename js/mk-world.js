// MIKU WORLD — สภาพอากาศ · MIKU RADIO (เพลงมิกุจากช่อง YouTube ทางการ) · เอฟเฟกต์ตาราง (คู่กับ css/mk-producer.css)
//  - สภาพอากาศสุ่มวันละแบบ (ทุกเครื่องได้แบบเดียวกันในวันเดียวกัน): แจ่มใส / ฝน / แดดแรง / Melody Storm พายุโน้ต / หิมะ / หมอก
//    ฉากฝน/หิมะ/ลม วาดบน canvas ที่กดทะลุได้ และปรับท้องฟ้า 3D (mk-3d.js) ให้เข้ากัน · กดปุ่มสภาพอากาศ หรือปุ่ม W เพื่อเปลี่ยน
//  - MIKU RADIO: เพลงมิกุ 12 เพลงจากช่อง YouTube ทางการของศิลปิน เล่นในหน้าแอป (ปุ่ม 🎵 ในเมนู ✦ / ปุ่ม M) ไม่มีเสียงเอฟเฟกต์
//  - ตาราง: แถวที่ชี้เมาส์มีแสงมิ้นต์ · ระหว่าง "กำลังโหลด" แสดงแถบแสงวิ่งแทนช่องว่าง
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('mk-fx-on'); }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* ข้าม */ } return null; }
  function toast(m, t) { if (window.fxToast) window.fxToast(m, t || ''); }
  function dayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* ================= สภาพอากาศ ================= */
  var WEATHERS = {
    clear: { ico: '🌤️', name: 'ท้องฟ้าแจ่มใส', sky: { dens: 1, speed: 1, tint: null, tintAmt: 0 } },
    rain: { ico: '🌧️', name: 'ฝนตก', sky: { dens: 1.2, speed: 1.2, tint: [0.25, 0.3, 0.38], tintAmt: 0.3 } },
    sun: { ico: '☀️', name: 'แดดแรง', sky: { dens: 0.55, speed: 0.8, tint: [1, 0.75, 0.3], tintAmt: 0.4 } },
    melody: { ico: '🎶', name: 'Melody Shower ฝนโน้ตเพลง', sky: { dens: 1.15, speed: 2.2, tint: [0.9, 0.35, 0.65], tintAmt: 0.25 } },
    snow: { ico: '❄️', name: 'หิมะตก', sky: { dens: 1.2, speed: 0.6, tint: [0.85, 0.92, 1], tintAmt: 0.45 } },
    fog: { ico: '🌫️', name: 'หมอกลง', sky: { dens: 1.6, speed: 0.45, tint: [0.7, 0.7, 0.72], tintAmt: 0.5 } }
  };
  var ORDER = ['clear', 'rain', 'sun', 'melody', 'snow', 'fog'];
  var WEIGHT = { clear: 35, rain: 20, sun: 15, melody: 15, snow: 7, fog: 8 };
  // สุ่มจากวันที่ (เครื่องไหนก็ได้แบบเดียวกันในวันเดียวกัน)
  function dailyWeather() {
    var k = dayKey(), h = 2166136261;
    for (var i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); }
    var r = ((h >>> 0) % 100), acc = 0;
    for (var j = 0; j < ORDER.length; j++) { acc += WEIGHT[ORDER[j]]; if (r < acc) return ORDER[j]; }
    return 'clear';
  }
  var WKEY = 'mk_weather_v1';
  var cur = dailyWeather();
  try { var sv = JSON.parse(ls(WKEY) || 'null'); if (sv && sv.day === dayKey() && WEATHERS[sv.w]) cur = sv.w; } catch (e) { /* ข้าม */ }

  var wcv = document.createElement('canvas');
  wcv.id = 'mkWeather';
  wcv.setAttribute('aria-hidden', 'true');
  var wx = wcv.getContext('2d');
  var W = 0, H = 0, parts = [], wBtn = null, nextBolt = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    W = window.innerWidth; H = window.innerHeight;
    wcv.width = Math.round(W * dpr); wcv.height = Math.round(H * dpr);
    wcv.style.width = W + 'px'; wcv.style.height = H + 'px';
    wx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function applySky() {
    var s = WEATHERS[cur].sky;
    if (window.MK3D) window.MK3D.weather = { dens: s.dens, speed: s.speed, tint: s.tint, tintAmt: s.tintAmt };
    root.setAttribute('data-mk-weather', cur);
    parts.length = 0;
    if (wBtn) { wBtn.textContent = WEATHERS[cur].ico; wBtn.title = 'สภาพอากาศวันนี้: ' + WEATHERS[cur].name + ' (กดเพื่อเปลี่ยน · W)'; }
  }
  function setWeather(w, announce) {
    cur = w;
    ls(WKEY, JSON.stringify({ day: dayKey(), w: w }));
    applySky();
    if (announce) toast('สภาพอากาศ: ' + WEATHERS[w].ico + ' ' + WEATHERS[w].name + (w === 'melody' ? ' — วันนี้มีแต่เสียงเพลง!' : ''), '');
  }
  function cycle() { setWeather(ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length], true); }

  function spawn() {
    if (cur === 'rain') return { x: Math.random() * (W + 200) - 100, y: -20, v: 14 + Math.random() * 8, l: 12 + Math.random() * 14, a: 0.25 + Math.random() * 0.35 };
    if (cur === 'snow') return { x: Math.random() * W, y: -10, v: 0.6 + Math.random() * 1.2, r: 1.2 + Math.random() * 2.6, ph: Math.random() * 6.28, a: 0.5 + Math.random() * 0.45 };
    if (cur === 'melody') return { x: Math.random() * W, y: -30, v: 0.8 + Math.random() * 1.4, sz: 14 + Math.random() * 18, ph: Math.random() * 6.28, a: 0.35 + Math.random() * 0.4, g: ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)], pink: Math.random() < 0.5 };
    if (cur === 'sun') return { x: Math.random() * W, y: H + 10, v: 0.2 + Math.random() * 0.5, r: 1 + Math.random() * 2, ph: Math.random() * 6.28, a: 0.25 + Math.random() * 0.35 };
    return null;
  }
  var TARGET = { rain: 140, snow: 90, melody: 40, sun: 30 };
  function frame(ts) {
    requestAnimationFrame(frame);
    var show = fxOn() && !reduce && !document.hidden && TARGET[cur];
    if (!show) { if (wcv.style.display !== 'none') { wx.clearRect(0, 0, W, H); wcv.style.display = 'none'; } return; }
    if (wcv.style.display === 'none') wcv.style.display = '';
    wx.clearRect(0, 0, W, H);
    while (parts.length < TARGET[cur]) { var p0 = spawn(); if (!p0) break; if (parts.length < TARGET[cur] * 0.6 ) p0.y = Math.random() * H; parts.push(p0); }
    var t = ts / 1000, i, p;
    if (cur === 'rain') {
      wx.strokeStyle = isDay() ? 'rgba(40,70,90,1)' : 'rgba(190,210,230,1)';
      wx.lineWidth = 1.1;
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i]; p.y += p.v; p.x -= p.v * 0.18;
        wx.globalAlpha = p.a;
        wx.beginPath(); wx.moveTo(p.x, p.y); wx.lineTo(p.x + p.l * 0.18, p.y - p.l); wx.stroke();
        if (p.y > H) parts.splice(i, 1);
      }
    } else if (cur === 'snow') {
      wx.fillStyle = '#ffffff';
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i]; p.ph += 0.02; p.y += p.v; p.x += Math.sin(p.ph) * 0.6;
        wx.globalAlpha = p.a;
        wx.beginPath(); wx.arc(p.x, p.y, p.r, 0, 6.283); wx.fill();
        if (p.y > H + 5) parts.splice(i, 1);
      }
    } else if (cur === 'melody') {
      // ฝนโน้ตเพลง: โน้ตมิ้นต์/ชมพูร่วงลงช้าๆ แกว่งไปมา
      wx.textAlign = 'center'; wx.textBaseline = 'middle';
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i]; p.ph += 0.025; p.y += p.v; p.x += Math.sin(p.ph) * 0.8;
        wx.globalAlpha = p.a;
        wx.fillStyle = p.pink ? (isDay() ? '#e12885' : '#ff4fa8') : (isDay() ? '#1fb0a6' : '#3fe0d4');
        wx.font = '700 ' + p.sz + 'px "M PLUS Rounded 1c", sans-serif';
        wx.save(); wx.translate(p.x, p.y); wx.rotate(Math.sin(p.ph) * 0.3); wx.fillText(p.g, 0, 0); wx.restore();
        if (p.y > H + 30) parts.splice(i, 1);
      }
    } else if (cur === 'sun') {
      // แสงจ้ามุมขวาบน + ละอองแสงลอยขึ้น
      var rg = wx.createRadialGradient(W * 0.92, H * 0.02, 10, W * 0.92, H * 0.02, Math.max(W, H) * 0.55);
      rg.addColorStop(0, 'rgba(255,255,255,' + (0.22 + Math.sin(t * 0.8) * 0.04) + ')');
      rg.addColorStop(0.4, 'rgba(98,247,237,0.06)');
      rg.addColorStop(1, 'rgba(98,247,237,0)');
      wx.globalAlpha = 1; wx.fillStyle = rg; wx.fillRect(0, 0, W, H);
      wx.fillStyle = '#c8f7f4';
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i]; p.ph += 0.03; p.y -= p.v; p.x += Math.sin(p.ph) * 0.3;
        wx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.ph * 2));
        wx.beginPath(); wx.arc(p.x, p.y, p.r, 0, 6.283); wx.fill();
        if (p.y < -5) parts.splice(i, 1);
      }
    }
    wx.globalAlpha = 1;
    // ฝน/ลมกรด: ฟ้าผ่าถี่ขึ้น
    var bolt = WEATHERS[cur].bolt;
    if (bolt && ts > nextBolt) {
      if (nextBolt && window.MKFX && window.MKFX.strike) window.MKFX.strike();
      nextBolt = ts + bolt * (0.7 + Math.random() * 0.6);
    }
  }

  /* ================= MIKU RADIO — เพลงมิกุจากช่อง YouTube ทางการของศิลปิน =================
     เล่นผ่านเครื่องเล่น YouTube แบบฝัง (ไม่มีไฟล์เพลงในโปรเจกต์ · ต่อเน็ตเฉพาะตอนกดเล่น)
     แก้/เพิ่มเพลงได้ที่ PLAYLIST ด้านล่าง: [รหัสวิดีโอ YouTube, ชื่อเพลง, ศิลปิน]
     เปิดแอปจากไฟล์ในเครื่อง (file://) YouTube ไม่ยอมเล่นในหน้า จึงเปิดเพลงในแท็บ YouTube ให้แทน */
  var PLAYLIST = [
    ['shs0rAiwsGQ', '千本桜 (Senbonzakura)', 'WhiteFlame feat. 初音ミク'],
    ['jhl5afLEKdo', 'World is Mine', 'ryo (supercell) feat. 初音ミク'],
    ['PqJNc9KVIZE', 'Tell Your World', 'livetune feat. 初音ミク'],
    ['hxSg2Ioz3LM', 'ヒバナ (Hibana)', 'DECO*27 feat. 初音ミク'],
    ['eSW2LVbPThw', 'ラビットホール (Rabbit Hole)', 'DECO*27 feat. 初音ミク'],
    ['EHBFKhLUVig', '神っぽいな (God-ish)', 'PinocchioP feat. 初音ミク'],
    ['vnw8zURAxkU', 'ローリンガール (Rolling Girl)', 'wowaka feat. 初音ミク'],
    ['AS4q9yaWJkI', '砂の惑星 (DUNE)', 'ハチ feat. 初音ミク'],
    ['XSLhsjepelI', 'グリーンライツ・セレナーデ', 'Omoi feat. 初音ミク'],
    ['m8PbMlflLPM', '空に免じて', '傘村トータ feat. 初音ミク'],
    ['238bgxS9QJE', 'Like a Shooting Star', 'Crusher feat. 初音ミク'],
    ['NocXEwsJGOQ', 'Miku', 'Anamanaguchi feat. 初音ミク']
  ];
  var RADIO_KEY = 'mk_radio_v1';
  var R = { i: 0, shuffle: false };
  try { var rs = JSON.parse(ls(RADIO_KEY) || 'null'); if (rs) { R.i = Math.min(PLAYLIST.length - 1, Math.max(0, rs.i | 0)); R.shuffle = !!rs.shuffle; } } catch (e) { /* ข้าม */ }
  function saveR() { ls(RADIO_KEY, JSON.stringify({ i: R.i, shuffle: R.shuffle })); }
  var radio = null, yt = null, ytReady = false, playing = false, mBtn = null, apiLoading = false, waitPlay = false;
  var localFile = location.protocol === 'file:';
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function buildRadio() {
    if (radio) return radio;
    radio = document.createElement('section');
    radio.className = 'mk-radio';
    radio.setAttribute('aria-label', 'MIKU RADIO');
    radio.innerHTML =
      '<header class="mk-radio-head"><b>♪ MIKU RADIO</b><button type="button" class="mk-radio-x" title="ปิดวิทยุ (หยุดเพลง)" aria-label="ปิด">×</button></header>' +
      '<div class="mk-radio-screen"><div id="mkRadioYT"></div>' +
      '<button type="button" class="mk-radio-cover" title="เล่นเพลง"><img alt="" src="img/miku-logo.png?v=miku14"><span>▶ กดเพื่อเล่นเพลงมิกุ</span></button></div>' +
      '<div class="mk-radio-now"><b></b><small></small></div>' +
      '<div class="mk-radio-ctl">' +
      '<button type="button" data-a="prev" title="เพลงก่อนหน้า" aria-label="เพลงก่อนหน้า">⏮</button>' +
      '<button type="button" data-a="play" class="mk-radio-play" title="เล่น/หยุด" aria-label="เล่นหรือหยุด">▶</button>' +
      '<button type="button" data-a="next" title="เพลงถัดไป" aria-label="เพลงถัดไป">⏭</button>' +
      '<button type="button" data-a="shuffle" class="mk-radio-shuf" title="สุ่มเพลง" aria-label="สุ่มเพลง">🔀</button>' +
      '<button type="button" data-a="list" title="รายการเพลง" aria-label="รายการเพลง">☰</button>' +
      '</div>' +
      '<ol class="mk-radio-list">' + PLAYLIST.map(function (t, k) { return '<li><button type="button" data-k="' + k + '"><b>' + esc(t[1]) + '</b><small>' + esc(t[2]) + '</small></button></li>'; }).join('') + '</ol>' +
      '<p class="mk-radio-note">' + (localFile
        ? 'เปิดแอปจากไฟล์ในเครื่อง: เพลงจะเปิดในแท็บ YouTube แทน · อยากฟังในหน้านี้ให้เปิดแอปด้วย "เปิด MIKU.bat"'
        : 'เพลงจากช่อง YouTube ทางการของศิลปิน · เชื่อมต่อ YouTube เมื่อกดเล่นเท่านั้น') + '</p>';
    document.body.appendChild(radio);
    radio.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('mk-radio-x')) { closeRadio(); return; }
      if (b.classList.contains('mk-radio-cover')) { play(R.i); return; }
      if (b.dataset.k != null) { play(+b.dataset.k); return; }
      var a = b.dataset.a;
      if (a === 'play') { if (playing) pause(); else play(R.i); }
      else if (a === 'next') play(nextIdx(1));
      else if (a === 'prev') play(nextIdx(-1));
      else if (a === 'shuffle') { R.shuffle = !R.shuffle; saveR(); paintRadio(); }
      else if (a === 'list') radio.classList.toggle('show-list');
    });
    paintRadio();
    return radio;
  }
  function nextIdx(dir) {
    if (R.shuffle && PLAYLIST.length > 1) { var k; do { k = Math.floor(Math.random() * PLAYLIST.length); } while (k === R.i); return k; }
    return (R.i + dir + PLAYLIST.length) % PLAYLIST.length;
  }
  function paintRadio() {
    if (radio) {
      var t = PLAYLIST[R.i];
      radio.querySelector('.mk-radio-now b').textContent = t[1];
      radio.querySelector('.mk-radio-now small').textContent = t[2];
      radio.querySelector('.mk-radio-play').textContent = playing ? '⏸' : '▶';
      radio.querySelector('.mk-radio-shuf').classList.toggle('is-on', R.shuffle);
      radio.classList.toggle('is-playing', playing);
      radio.querySelectorAll('.mk-radio-list button').forEach(function (b) { b.classList.toggle('is-on', +b.dataset.k === R.i); });
    }
    if (mBtn) {
      mBtn.textContent = '🎵';
      mBtn.classList.toggle('is-off', !playing);
      mBtn.setAttribute('aria-pressed', String(playing));
      mBtn.title = 'MIKU RADIO — เพลงมิกุ (M)';
    }
  }
  function loadApi(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prev) prev(); cb(); };
    if (apiLoading) return;
    apiLoading = true;
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = function () { apiLoading = false; toast('ต่อ YouTube ไม่ได้ — ตรวจการเชื่อมต่ออินเทอร์เน็ต', 'error'); };
    document.head.appendChild(s);
  }
  function play(k) {
    buildRadio();
    openRadio();
    R.i = k; saveR();
    var id = PLAYLIST[k][0];
    if (localFile) {
      window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener');
      paintRadio();
      return;
    }
    radio.classList.add('has-player');
    if (yt && ytReady) { yt.loadVideoById(id); playing = true; paintRadio(); return; }
    waitPlay = true;
    loadApi(function () {
      if (yt) return;
      yt = new window.YT.Player('mkRadioYT', {
        host: 'https://www.youtube-nocookie.com',
        width: '100%', height: '100%', videoId: PLAYLIST[R.i][0],
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: location.origin },
        events: {
          onReady: function () { ytReady = true; if (waitPlay) { yt.playVideo(); waitPlay = false; } },
          onStateChange: function (e) {
            if (e.data === 1) playing = true;
            else if (e.data === 2) playing = false;
            else if (e.data === 0) { play(nextIdx(1)); return; }
            paintRadio();
          },
          onError: function () { toast('เพลงนี้เล่นในแอปไม่ได้ — ข้ามไปเพลงถัดไป', ''); play(nextIdx(1)); }
        }
      });
    });
    playing = true;
    paintRadio();
  }
  function pause() { if (yt && ytReady) yt.pauseVideo(); playing = false; paintRadio(); }
  function openRadio() { buildRadio(); radio.classList.add('is-open'); }
  function closeRadio() { if (yt && ytReady) yt.stopVideo(); playing = false; if (radio) radio.classList.remove('is-open'); paintRadio(); }
  function toggleRadio() { if (radio && radio.classList.contains('is-open')) closeRadio(); else { openRadio(); paintRadio(); } }

  /* ================= ปุ่มในเมนู ✦ ================= */
  function addButtons() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar) return;
    var after = document.getElementById('mk3dToggle');
    if (!document.getElementById('mkBgmToggle')) {
      mBtn = document.createElement('button');
      mBtn.type = 'button'; mBtn.id = 'mkBgmToggle'; mBtn.className = 'mk-fx-toggle mk-sound-toggle mk-bgm-toggle';
      mBtn.addEventListener('click', function () { var d = document.querySelector('.mk-dock'); if (d) d.classList.remove('is-open'); toggleRadio(); });
      bar.insertBefore(mBtn, after ? after.nextSibling : null);
      paintRadio();
    }
    if (!document.getElementById('mkWeatherBtn')) {
      wBtn = document.createElement('button');
      wBtn.type = 'button'; wBtn.id = 'mkWeatherBtn'; wBtn.className = 'mk-fx-toggle mk-sound-toggle mk-weather-btn';
      wBtn.addEventListener('click', cycle);
      bar.insertBefore(wBtn, mBtn ? mBtn.nextSibling : null);
    }
  }

  /* ---------- รวมปุ่มเปิด/ปิดทั้งหมดไว้ในเมนู ✦ เดียว (แถบนำทางจะได้ไม่แน่นจนแท็บถูกตัด) ---------- */
  var DOCK = [
    ['mkSettingsBtn', 'ตั้งค่าทั้งหมด'],
    ['mkFocusBtn', 'โหมดโฟกัส (F)'],
    ['mkFxToggle', 'เอฟเฟกต์ FX'],
    ['mk3dToggle', 'ฉาก 3D'],
    ['mkBgmToggle', 'MIKU RADIO เพลงมิกุ (M)'],
    ['mkWeatherBtn', 'สภาพอากาศ (W)'],
    ['mkBuddyToggle', 'คู่หู MIKU'],
    ['mkBattleToggle', 'โหมดต่อสู้ (ตรวจ ORDER)'],
    ['mkOnlineBtn', 'ออนไลน์ (อากาศจริง · อันดับ · เสียง)'],
  ];
  function buildDock() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.querySelector('.mk-dock')) return;
    var first = document.getElementById(DOCK[0][0]);
    var dock = document.createElement('div');
    dock.className = 'mk-dock';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mk-fx-toggle mk-dock-btn';
    btn.textContent = '✦';
    btn.title = 'เอฟเฟกต์ · 3D · MIKU RADIO · สภาพอากาศ';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    var panel = document.createElement('div');
    panel.className = 'mk-dock-panel';
    panel.setAttribute('role', 'menu');
    DOCK.forEach(function (d) {
      var b = document.getElementById(d[0]);
      if (!b) return;
      b.setAttribute('data-label', d[1]);
      panel.appendChild(b);
    });
    dock.appendChild(btn);
    dock.appendChild(panel);
    bar.insertBefore(dock, bar.querySelector('.theme-switch') || (first && first.nextSibling) || null);
    var open = function (v) { dock.classList.toggle('is-open', v); btn.setAttribute('aria-expanded', String(v)); };
    btn.addEventListener('click', function (e) { e.stopPropagation(); open(!dock.classList.contains('is-open')); });
    document.addEventListener('pointerdown', function (e) { if (!dock.contains(e.target)) open(false); }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
  }

  /* ================= ตาราง: แถบแสงวิ่งระหว่างโหลด ================= */
  var LOAD_RE = /^\s*(⏳\s*)?กำลังโหลด/;
  function markLoading(scope) {
    var ps = (scope || document).querySelectorAll('.sun-hint, .beta-table');
    for (var i = 0; i < ps.length; i++) ps[i].classList.toggle('mk-loading', LOAD_RE.test(ps[i].textContent || ''));
  }
  var lt = 0;
  new MutationObserver(function () { if (!lt) lt = setTimeout(function () { lt = 0; markLoading(); }, 60); })
    .observe(document.documentElement, { subtree: true, childList: true, characterData: true });

  /* ---------- คีย์ลัด W / M ---------- */
  function typing(e) { var t = e.target; return t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)); }
  document.addEventListener('keydown', function (e) {
    if ((window.MK_MIDWORD && window.MK_MIDWORD()) || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'w' || e.key === 'W') cycle();
    else if (e.key === 'm' || e.key === 'M') toggleRadio();
  });

  function init() {
    document.body.appendChild(wcv);
    resize();
    window.addEventListener('resize', resize, { passive: true });
    addButtons();
    buildDock();
    applySky();
    // ประกาศสภาพอากาศครั้งแรกของวัน
    var seen = ls('mk_weather_seen');
    if (seen !== dayKey() && cur !== 'clear') setTimeout(function () { setWeather(cur, true); }, 7000);
    ls('mk_weather_seen', dayKey());
    markLoading();
    requestAnimationFrame(frame);
    window.MKWORLD = { weather: setWeather, cycle: cycle, current: function () { return cur; }, bgm: function () { if (playing) closeRadio(); else play(R.i); }, bgmOn: function () { return playing; }, song: function () { return PLAYLIST[R.i][1]; }, radio: toggleRadio };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
