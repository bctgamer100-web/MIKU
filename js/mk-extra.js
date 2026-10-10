// MIKU EXTRA — นักร้องลึกลับมาท้าดวล · เทศกาล · รหัสลับเพิ่ม · ตู้เสื้อผ้าคู่หู · ป้ายสต็อกใกล้หมด (คู่กับ css/mk-extra.css)
//  1) นักร้องลึกลับมาเยือน: วันแดดแรง/ฝนตก มีโอกาสวันละครั้งที่เงานักร้องคู่แข่ง (LUKA/KAITO) โผล่ขึ้นมาท้าดวล → MIKU ชนะ + ฝนโน้ตเพลง (+40 EXP)
//  2) เทศกาล (ดูจากวันที่): สงกรานต์ 💦 · ลอยกระทง 🏮 · ฮาโลวีน 🦇 · คริสต์มาส 🎄 · ปีใหม่ 🎆 · ตรุษจีน 🧧  (ลองดูได้: window.MKEXTRA.fest('songkran'))
//  3) รหัสลับ (พิมพ์ตอนไม่ได้อยู่ในช่อง): laser = เลเซอร์โชว์กวาดจอ · sparkle = สลับสีชั่วคราว · album = คลัง SKU ที่เคยเปิดดู
//  4) ตู้เสื้อผ้าคู่หู: ปลดล็อกของแต่งตามเลเวล (โบว์ หมวก ผ้าพันคอ แว่น มงกุฎ วงแหวนแสง) เลือกใส่ในบัตรโปรดิวเซอร์
//  5) ป้ายสต็อกใกล้หมด: ตารางหน้า MK Plan ช่องคงเหลือ ≤ 5 = ⚠ ใกล้หมด · ≤ 0 = 🔇 หมดสต็อก
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function on() { return !reduce && root.classList.contains('mk-fx-on') && !document.hidden; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* ข้าม */ } return null; }
  function flag(k) { return ls(k) !== '0'; }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m, t) { if (window.fxToast) window.fxToast(m, t || ''); }
  function sfx(n) { if (window.MKSTAGE) window.MKSTAGE.sfx(n); }
  function lvl() { var S = window.MKPRODUCER ? window.MKPRODUCER.state() : null, e = S ? S.exp : 0, l = 1; while (l < 100 && e >= 40 + l * 20) { e -= 40 + l * 20; l++; } return l; }
  function busy() { return !!document.querySelector('.mk-battle, .mk-epic-mod, .mk-disc-intro, .mk-visit'); }

  /* ================= 1) นักร้องลึกลับมาท้าดวล ================= */
  // เงานักร้องคู่แข่งวาดเองด้วย SVG: KAITO (ผ้าพันคอปลิว) / LUKA (ผมยาวสลวย) ถือไมค์โผล่ขึ้นมาจากขอบจอ
  var KAITO = '<svg viewBox="0 0 400 300" aria-hidden="true"><path d="M150 300 C150 240 160 215 200 205 C240 215 250 240 250 300 Z M200 205 C160 200 140 170 140 130 C140 85 165 55 200 55 C235 55 260 85 260 130 C260 170 240 200 200 205 Z M145 120 C150 70 175 45 205 48 C240 50 262 80 258 125 C245 95 225 85 200 88 C175 85 155 100 145 120 Z M168 215 C200 232 232 232 262 214 C300 225 345 230 390 205 C350 245 300 255 255 238 C230 250 175 250 168 215 Z M262 160 L300 130 L310 140 L272 170 Z" /><circle cx="306" cy="128" r="14"/><circle class="eye" cx="180" cy="140" r="7"/><circle class="eye" cx="220" cy="140" r="7"/></svg>';
  var LUKA = '<svg viewBox="0 0 400 300" aria-hidden="true"><path d="M150 300 C150 240 160 215 200 205 C240 215 250 240 250 300 Z M200 205 C160 200 140 170 140 130 C140 85 165 55 200 55 C235 55 260 85 260 130 C260 170 240 200 200 205 Z M135 140 C125 60 175 40 205 42 C255 44 280 80 270 150 C285 210 300 250 330 300 L262 300 C250 240 248 190 250 140 C235 100 170 100 150 140 C152 190 150 240 138 300 L70 300 C100 250 120 210 135 140 Z M128 170 L95 140 L85 150 L118 180 Z" /><circle cx="90" cy="138" r="14"/><circle class="eye" cx="182" cy="142" r="7"/><circle class="eye" cx="222" cy="142" r="7"/></svg>';
  function visit(kind) {
    if (!on() || busy()) return false;
    kind = kind || (window.MKWORLD && window.MKWORLD.current() === 'rain' ? 'luka' : 'kaito');
    var ov = el('div', 'mk-visit is-' + kind, '<div class="mk-visit-shade"></div><div class="mk-visit-art">' + (kind === 'luka' ? LUKA : KAITO) + '</div>');
    document.body.appendChild(ov);
    toast(kind === 'luka' ? '🎵 เงาของนักร้องคู่แข่ง LUKA โผล่ขึ้นมา… ท้าดวลเพลงกับ MIKU ท่ามกลางสายฝน!' : '🎵 เงาของนักร้องคู่แข่ง KAITO โผล่ขึ้นมา… ท้าดวลเพลงกับ MIKU กลางแดดจ้า!', '');
    sfx('cheer');
    setTimeout(function () { document.body.classList.add('mk-rumble'); }, 600);
    setTimeout(function () {
      document.body.classList.remove('mk-rumble');
      if (window.MKFX2) { window.MKFX2.fly.force = true; window.MKFX2.fly('cross'); window.MKFX2.fly.force = false; }
      if (window.MKFX) window.MKFX.strike();
      sfx('thunder');
      ov.classList.add('is-flee');
    }, 3600);
    setTimeout(function () {
      ov.remove();
      if (window.MKWORLD) window.MKWORLD.weather('melody', false);
      toast('🎶 MIKU ชนะดวลเพลงแล้ว! ฉลองด้วยฝนโน้ตเพลง Melody Shower (+40 EXP)', 'success');
      if (window.MKPRODUCER) window.MKPRODUCER.gain(40, 'visit');
      if (window.MKBUDDY) window.MKBUDDY.say('เวทีนี้เป็นของเรานะ!');
    }, 5600);
    return true;
  }
  (function scheduleVisit() {
    var today = new Date().toDateString();
    if (ls('mk_visit_day') === today) return;
    setTimeout(function tryV() {
      if (!flag('mk_visit_v1') || root.classList.contains('mk-focus')) return;
      var w = window.MKWORLD ? window.MKWORLD.current() : '';
      if (w !== 'sun' && w !== 'rain') { ls('mk_visit_day', today); return; }
      if (Math.random() > 0.4) { ls('mk_visit_day', today); return; }
      if (document.querySelector('.mk-charge.is-on:not(.is-done), .mk-tc-ov, .mk-alert') || !visit()) { setTimeout(tryV, 60000); return; }
      ls('mk_visit_day', today);
    }, (5 + Math.random() * 25) * 60000);
  })();

  /* ================= 2) เทศกาล ================= */
  // วันลอยกระทง (เพ็ญเดือน 12) ไม่ตรงกันทุกปี — ใส่วันที่ไว้ล่วงหน้า (ประมาณการ ตรวจสอบกับปฏิทินจริงอีกครั้ง)
  var LOY = ['2025-11-5', '2026-11-24', '2027-11-13', '2028-11-2'];
  var CNY = ['2026-2-17', '2027-2-6', '2028-1-26', '2029-2-13'];
  function festToday(d) {
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate(), k = d.getFullYear() + '-' + m + '-' + day;
    if (m === 4 && day >= 13 && day <= 15) return 'songkran';
    if (LOY.indexOf(k) >= 0) return 'loy';
    if (CNY.some(function (c) { var x = new Date(c); return Math.abs(d - x) < 2 * 864e5 && d >= x - 864e5; })) return 'cny';
    if (m === 10 && day === 31) return 'halloween';
    if (m === 12 && (day === 24 || day === 25)) return 'xmas';
    if ((m === 12 && day === 31) || (m === 1 && day === 1)) return 'newyear';
    return '';
  }
  var FEST = {
    songkran: ['💦', 'สุขสันต์วันสงกรานต์!'], loy: ['🏮', 'สุขสันต์วันลอยกระทง!'], cny: ['🧧', 'ซินเจียยู่อี่ ซินนี้ฮวดไช้!'],
    halloween: ['🦇', 'Happy Halloween! ระวังผีสต็อกหาย 👻'], xmas: ['🎄', 'Merry Christmas!'], newyear: ['🎆', 'สวัสดีปีใหม่!']
  };
  var fcv = null, fx = null, fParts = [], fKind = '', fT = 0;
  function startFest(kind) {
    stopFest();
    if (!kind || !FEST[kind]) return;
    fKind = kind;
    root.setAttribute('data-mk-fest', kind);
    fcv = el('canvas'); fcv.id = 'mkFest'; fcv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fcv);
    fx = fcv.getContext('2d');
    var resize = function () { fcv.width = innerWidth; fcv.height = innerHeight; };
    resize(); window.addEventListener('resize', resize);
    // ป้ายเทศกาลบนแถบนำทาง
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (bar && !bar.querySelector('.mk-fest-tag')) {
      var tag = el('span', 'mk-fest-tag', FEST[kind][0] + ' <b>' + FEST[kind][1] + '</b>');
      var h1 = bar.querySelector('h1'); bar.insertBefore(tag, h1 ? h1.nextSibling : bar.firstChild);
    }
    if (kind === 'cny' || kind === 'xmas') {
      var g = el('div', 'mk-fest-garland is-' + kind);
      for (var i = 0; i < 14; i++) g.appendChild(el('i'));
      document.body.appendChild(g);
    }
    loopFest();
  }
  function stopFest() {
    cancelAnimationFrame(fT);
    if (fcv) fcv.remove();
    document.querySelectorAll('.mk-fest-tag, .mk-fest-garland').forEach(function (x) { x.remove(); });
    root.removeAttribute('data-mk-fest');
    fcv = null; fParts = []; fKind = '';
  }
  function spawnFest() {
    var W = fcv.width, H = fcv.height, r = Math.random;
    switch (fKind) {
      case 'songkran': return { x: r() * W, y: -10, vx: (r() - 0.5) * 2, vy: 6 + r() * 6, s: 2 + r() * 3, c: 'rgba(120,200,255,', a: 0.7 };
      case 'loy': return { x: r() * W, y: H + 20, vx: (r() - 0.5) * 0.4, vy: -(0.4 + r() * 0.8), s: 6 + r() * 8, c: 'lantern', a: 0.9, ph: r() * 6 };
      case 'halloween': return { x: -30, y: r() * H * 0.6, vx: 2 + r() * 3, vy: 0, s: 10 + r() * 10, c: 'bat', a: 0.85, ph: r() * 6 };
      case 'xmas': return { x: r() * W, y: -10, vx: (r() - 0.5) * 0.6, vy: 0.6 + r() * 1.2, s: 1.5 + r() * 3, c: 'rgba(255,255,255,', a: 0.85, ph: r() * 6 };
      case 'cny': return { x: r() * W, y: -10, vx: (r() - 0.5) * 0.5, vy: 0.5 + r(), s: 2 + r() * 2.5, c: 'rgba(89,246,236,', a: 0.9, ph: r() * 6 };
      case 'newyear': return null;
    }
    return null;
  }
  var nextFw = 0;
  function loopFest(t) {
    fT = requestAnimationFrame(loopFest);
    if (!fcv) return;
    var show = on() && !root.classList.contains('mk-focus');
    fcv.style.display = show ? '' : 'none';
    if (!show) return;
    var W = fcv.width, H = fcv.height;
    fx.clearRect(0, 0, W, H);
    var target = { songkran: 90, loy: 26, halloween: 7, xmas: 80, cny: 40, newyear: 0 }[fKind];
    while (fParts.length < target) { var p0 = spawnFest(); if (!p0) break; if (fKind !== 'loy' && fKind !== 'halloween' && fParts.length < target / 2) p0.y = Math.random() * H; fParts.push(p0); }
    // ปีใหม่: พลุ
    if (fKind === 'newyear' && (t || 0) > nextFw) {
      nextFw = (t || 0) + 700 + Math.random() * 1400;
      var cx = W * (0.15 + Math.random() * 0.7), cy = H * (0.15 + Math.random() * 0.35), hue = Math.floor(Math.random() * 360);
      for (var k = 0; k < 46; k++) { var a = k / 46 * 6.283, v = 2 + Math.random() * 3; fParts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 2, c: 'hsla(' + hue + ',100%,65%,', a: 1, fw: true }); }
    }
    for (var i = fParts.length - 1; i >= 0; i--) {
      var p = fParts[i];
      p.ph = (p.ph || 0) + 0.05;
      p.x += p.vx + (p.c === 'lantern' ? Math.sin(p.ph) * 0.3 : 0);
      p.y += p.vy + (p.c === 'bat' ? Math.sin(p.ph * 2) * 1.5 : 0);
      if (p.fw) { p.vy += 0.04; p.vx *= 0.985; p.vy *= 0.985; p.a *= 0.975; }
      if (p.c === 'lantern') {
        var gl = fx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 3);
        gl.addColorStop(0, 'rgba(98,247,237,.55)'); gl.addColorStop(1, 'rgba(41,244,230,0)');
        fx.fillStyle = gl; fx.beginPath(); fx.arc(p.x, p.y, p.s * 3, 0, 6.283); fx.fill();
        fx.fillStyle = '#50f6eb'; fx.fillRect(p.x - p.s * 0.6, p.y - p.s, p.s * 1.2, p.s * 1.6);
      } else if (p.c === 'bat') {
        var wv = Math.sin(p.ph * 6) * p.s * 0.5;
        fx.fillStyle = 'rgba(20,10,20,' + p.a + ')';
        fx.beginPath(); fx.moveTo(p.x, p.y); fx.quadraticCurveTo(p.x - p.s, p.y - wv - p.s * 0.4, p.x - p.s * 1.6, p.y + wv * 0.3);
        fx.quadraticCurveTo(p.x - p.s * 0.6, p.y + 2, p.x, p.y + 3); fx.quadraticCurveTo(p.x + p.s * 0.6, p.y + 2, p.x + p.s * 1.6, p.y + wv * 0.3);
        fx.quadraticCurveTo(p.x + p.s, p.y - wv - p.s * 0.4, p.x, p.y); fx.fill();
      } else {
        fx.fillStyle = p.c + p.a + ')';
        if (fKind === 'songkran' && !p.fw) { fx.fillRect(p.x, p.y, p.s * 0.6, p.s * 4); }
        else { fx.beginPath(); fx.arc(p.x, p.y, p.s, 0, 6.283); fx.fill(); }
      }
      if (p.y > H + 30 || p.y < -60 || p.x > W + 60 || p.a < 0.03) fParts.splice(i, 1);
    }
  }
  function fest(kind) { if (kind) startFest(kind); else stopFest(); }
  function syncFest() {
    var k = flag('mk_fest_v1') ? festToday() : '';
    if (k !== fKind) {
      startFest(k);
      if (k && ls('mk_fest_seen') !== new Date().toDateString()) { ls('mk_fest_seen', new Date().toDateString()); setTimeout(function () { toast(FEST[k][0] + ' ' + FEST[k][1], 'success'); }, 5000); }
    }
  }
  window.addEventListener('mk:setting', function (e) { if (e.detail && e.detail.key === 'mk_fest_v1') syncFest(); if (e.detail && e.detail.key === 'mk_lowstock_v1') tagStock(); });

  /* ================= 3) รหัสลับ ================= */
  function laserShow() {
    if (!on() || busy()) return;
    var ov = el('div', 'mk-laser', '<i class="mk-laser-beam"></i><i class="mk-laser-core"></i><b>LASER SHOW!!</b>');
    document.body.appendChild(ov);
    sfx('thunder'); sfx('cheer');
    document.body.classList.remove('mk-quake'); void document.body.offsetWidth; document.body.classList.add('mk-quake');
    var A = window.MKFX;
    if (A && A.burst) [0, 150, 300, 450].forEach(function (d, i) { setTimeout(function () { A.burst(innerWidth * (0.2 + i * 0.2), innerHeight / 2); }, d); });
    setTimeout(function () { document.body.classList.remove('mk-quake'); ov.remove(); }, 1600);
    if (window.MKPRODUCER) window.MKPRODUCER.gain(5, 'secret-laser');
  }
  function altColor() {
    var v = !root.classList.contains('mk-alt-color');
    root.classList.toggle('mk-alt-color', v);
    toast(v ? '✨ สลับสีพิเศษชั่วคราว! (พิมพ์ sparkle อีกครั้งเพื่อกลับ)' : 'กลับสีปกติแล้ว', 'success');
    if (window.MKBUDDY) window.MKBUDDY.say(v ? 'สีใหม่เป็นไงบ้าง? ✨' : 'กลับมาสีเดิมแล้ว!');
  }
  function cardAlbum() {
    if (document.querySelector('.mk-album-ov')) return;
    var seen = {};
    try { seen = JSON.parse(ls('mk_cards_seen_v1') || '{}'); } catch (e) { /* ข้าม */ }
    var keys = Object.keys(seen).sort();
    var ov = el('div', 'mk-tc-ov mk-album-ov', '<div class="mk-skucard mk-album" role="dialog" aria-label="คลัง MIKU CARD"><div class="mk-skucard-top"><span class="mk-skucard-eq"><i></i><i></i><i></i><i></i><i></i></span><b>MIKU CARD</b><span class="mk-skucard-seen">สะสมแล้ว ' + keys.length + ' SKU</span><button type="button" class="mk-skucard-x" aria-label="ปิด">×</button></div>' +
      '<input type="search" class="mk-album-q" placeholder="ค้นหา SKU ในคลัง…">' +
      '<div class="mk-album-list">' + (keys.length ? keys.map(function (k, i) { return '<button type="button" data-sku="' + esc(k) + '"><small>TRACK ' + ('00' + (i + 1)).slice(-3) + '</small>' + esc(k) + '</button>'; }).join('') : '<p>ยังไม่เคยเปิดดู SKU ไหนเลย — ดับเบิลคลิก SKU ในตารางเพื่อเริ่มบันทึก</p>') + '</div></div>');
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.mk-skucard-x')) { close(); return; }
      var b = e.target.closest('[data-sku]');
      if (b) { close(); if (window.MKSKUCARD) window.MKSKUCARD.open(b.getAttribute('data-sku')); }
    });
    ov.querySelector('.mk-album-q').addEventListener('input', function (e) {
      var q = e.target.value.trim().toUpperCase();
      ov.querySelectorAll('[data-sku]').forEach(function (b) { b.style.display = !q || b.getAttribute('data-sku').toUpperCase().indexOf(q) >= 0 ? '' : 'none'; });
    });
    setTimeout(function () { ov.querySelector('.mk-album-q').focus(); }, 50);
  }
  var typed = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1 || (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)))) return;
    typed = (typed + e.key.toLowerCase()).slice(-7);
    if (/laser$/.test(typed)) { typed = ''; laserShow(); }
    else if (/sparkle$/.test(typed)) { typed = ''; altColor(); }
    else if (/album$/.test(typed)) { typed = ''; cardAlbum(); }
  });

  /* ================= 4) ตู้เสื้อผ้าคู่หู ================= */
  var ACC = [
    ['none', '—', 'ไม่ใส่', 1], ['bow', '🎀', 'โบว์', 3], ['hat', '🎩', 'หมวก', 5], ['scarf', '🧣', 'ผ้าพันคอ', 10],
    ['shades', '🕶️', 'แว่นกันแดด', 15], ['crown', '👑', 'มงกุฎ', 25], ['halo', '😇', 'วงแหวนแสง', 40]
  ];
  function wearing() { return ls('mk_buddy_acc') || 'none'; }
  // ของแต่งที่ได้จากกล่อง Fan Gift (mk-adventure.js) ใส่ได้ก่อนถึงเลเวล
  function gifted(id) { try { return (JSON.parse(ls('mk_acc_gift') || '[]')).indexOf(id) >= 0; } catch (e) { return false; } }
  function paintAcc() {
    var body = document.querySelector('.mk-buddy-body');
    if (!body) return;
    var a = body.querySelector('.mk-buddy-acc');
    if (!a) { a = el('span', 'mk-buddy-acc'); body.appendChild(a); }
    var cur = ACC.filter(function (x) { return x[0] === wearing(); })[0] || ACC[0];
    if (cur[3] > lvl() && !gifted(cur[0])) cur = ACC[0];
    a.textContent = cur[0] === 'none' ? '' : cur[1];
    a.className = 'mk-buddy-acc is-' + cur[0];
  }
  // วางของแต่งไว้ที่หัว: หัวอยู่ฝั่งที่มิกุหันไป (ทิศในภาพ × การพลิก)
  setInterval(function () {
    var b = document.querySelector('.mk-buddy'), a = b && b.querySelector('.mk-buddy-acc');
    if (!a || !a.textContent) return;
    var face = +(b.dataset.face || 1), flip = +(getComputedStyle(b).getPropertyValue('--mk-bflip') || 1);
    b.classList.toggle('acc-left', face * flip < 0);
  }, 400);
  window.addEventListener('mk:card', function (e) {
    var card = e.detail && e.detail.el;
    if (!card) return;
    var L = lvl(), cur = wearing();
    var sec = el('section', 'mk-tc-wardrobe', '<h5>👗 ตู้เสื้อผ้าคู่หู <small>ปลดล็อกตามเลเวล</small></h5><div class="mk-wd">' + ACC.map(function (x) {
      var lock = x[3] > L && !gifted(x[0]);
      return '<button type="button" data-acc="' + x[0] + '"' + (lock ? ' disabled' : '') + ' class="' + (cur === x[0] ? 'is-on' : '') + '"><i>' + (lock ? '🔒' : x[1]) + '</i><span>' + (lock ? 'Lv.' + x[3] : x[2]) + '</span></button>';
    }).join('') + '</div>');
    var heat = card.querySelector('.mk-tc-heat') || card.querySelector('.mk-tc-badges');
    if (heat) heat.parentNode.insertBefore(sec, heat.nextSibling);
    sec.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-acc]');
      if (!b || b.disabled) return;
      ls('mk_buddy_acc', b.getAttribute('data-acc'));
      sec.querySelectorAll('[data-acc]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      paintAcc();
      if (window.MKBUDDY && b.getAttribute('data-acc') !== 'none') window.MKBUDDY.say('ชุดใหม่! เท่ไหม? ✨');
    });
  });
  window.addEventListener('mk:levelup', function (e) {
    var lv = e.detail && e.detail.lv;
    ACC.forEach(function (x) { if (x[3] === lv) setTimeout(function () { toast('👗 ปลดล็อกของแต่งคู่หู: ' + x[1] + ' ' + x[2] + '! (เลือกใส่ในบัตรโปรดิวเซอร์)', 'success'); }, 3500); });
  });

  /* ================= 5) ป้ายสต็อกใกล้หมด (หน้า MK Plan) ================= */
  var STOCK_COL = /คงเหลือ|สต็อก|สต๊อก|^stock$|^qty$/i, NOT_COL = /ขาย|สั่ง|order|เป้า|ย้าย|เข้า|ออก/i;
  var tagT = 0;
  function tagStock() {
    tagT = 0;
    var out = document.getElementById('sunOutput');
    if (!out) return;
    var en = flag('mk_lowstock_v1');
    out.querySelectorAll('table').forEach(function (tb) {
      var head = (tb.tHead && tb.tHead.rows[0]) || tb.querySelector('tr');
      if (!head) return;
      var cols = [];
      Array.prototype.forEach.call(head.cells, function (c, i) { var h = (c.textContent || '').trim(); if (STOCK_COL.test(h) && !NOT_COL.test(h)) cols.push(i); });
      if (!cols.length) return;
      var rows = (tb.tBodies[0] || tb).rows;
      for (var r = 0; r < rows.length && r < 3000; r++) {
        cols.forEach(function (i) {
          var td = rows[r].cells[i];
          if (!td || td.tagName !== 'TD') return;
          var v = parseFloat((td.textContent || '').replace(/,/g, ''));
          var cls = !en || isNaN(v) ? '' : v <= 0 ? 'mk-low0' : v <= 5 ? 'mk-low1' : '';
          td.classList.toggle('mk-low0', cls === 'mk-low0');
          td.classList.toggle('mk-low1', cls === 'mk-low1');
        });
      }
    });
  }
  function watchStock() {
    var out = document.getElementById('sunOutput');
    if (!out) return;
    new MutationObserver(function () { if (!tagT) tagT = setTimeout(tagStock, 200); }).observe(out, { childList: true, subtree: true });
  }

  function init() {
    syncFest();
    setInterval(syncFest, 10 * 60000);
    paintAcc();
    new MutationObserver(paintAcc).observe(document.body, { childList: true });
    watchStock();
    tagStock();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.MKEXTRA = { visit: visit, fest: fest, laser: laserShow, sparkle: altColor, album: cardAlbum, festToday: festToday };
})();
