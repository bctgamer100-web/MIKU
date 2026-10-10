// MIKU EPIC — ฉากเวอร์ๆ (คู่กับ css/mk-epic.css) · ทำงานเมื่อเปิด ✦ FX · ปิดเองถ้าตั้ง "ลดการเคลื่อนไหว"
//  1) MODULE CHANGE: สลับ กลางวัน/กลางคืน = ม่านเวทีปิด-เปิด · คอนเฟตติ · มิกุชุดใหม่เด้งขึ้นกลางสปอตไลต์
//  3) COMBO / OVERDRIVE: ทำงานสำเร็จติดๆ กัน (ห่างไม่เกิน 45 วิ) = คอมโบ x2 x3… ครบ 5 = OVERDRIVE ขอบจอเป็นไฟนีออนอีควอไลเซอร์ ครบ 10 = HYPER OVERDRIVE
//  4) เปลี่ยนหน้า: MIKU ไถลผ่านจอพร้อมบรรทัดโน้ตเพลง (ปิดได้ในเมนู ✦)
//  5) การ์ดโฮโลแกรม: บัตรโปรดิวเซอร์ / MIKU CARD / การ์ดเลเวลอัป มีแสงรุ้งฟอยล์ตามเมาส์
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function on() { return !reduce && root.classList.contains('mk-fx-on') && !document.hidden; }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function sfx(n) { if (window.MKSTAGE) window.MKSTAGE.sfx(n); }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* ข้าม */ } return null; }
  var SPR = { light: 'img/miku-day.png?v=miku3', dark: 'img/miku-night.png?v=miku3' };
  function busy() { return !!document.querySelector('.mk-battle, .mk-disc-intro, .mk-epic-mod'); }

  /* ================= 1) MODULE CHANGE ================= */
  function moduleChange(want) {
    if (!on() || document.querySelector('.mk-epic-mod')) return false;
    var from = want === 'light' ? 'dark' : 'light';
    var ov = el('div', 'mk-epic-mod is-' + want,
      '<div class="mk-mod-bg"></div>' +
      '<div class="mk-mod-ring"></div><div class="mk-mod-ring d2"></div>' +
      '<img class="mk-mod-stone" alt="" src="img/note-crystal.png?v=miku3">' +
      '<img class="mk-mod-old" alt="" src="' + SPR[from] + '">' +
      '<img class="mk-mod-new" alt="" src="' + SPR[want] + '">' +
      '<div class="mk-mod-shards"></div>' +
      '<div class="mk-mod-flash"></div>' +
      '<div class="mk-mod-title"><small>MODULE CHANGE</small><b>' + (want === 'light' ? 'HATSUNE MIKU' : 'MIKU NIGHT LIVE') + '</b></div>');
    var sh = ov.querySelector('.mk-mod-shards');
    for (var i = 0; i < 18; i++) {
      var s = el('i');
      var a = i / 18 * 6.283;
      s.style.setProperty('--dx', (Math.cos(a) * (180 + Math.random() * 220)).toFixed(0) + 'px');
      s.style.setProperty('--dy', (Math.sin(a) * (140 + Math.random() * 200)).toFixed(0) + 'px');
      s.style.setProperty('--r', ((Math.random() - 0.5) * 720).toFixed(0) + 'deg');
      sh.appendChild(s);
    }
    document.body.appendChild(ov);
    sfx('shake');
    setTimeout(function () { sfx('shake'); }, 450);
    setTimeout(function () { sfx('open'); if (window.MKFX) window.MKFX.strike(); }, 1150);
    setTimeout(function () { sfx('cheer'); }, 1500);
    var done = function () { if (!ov.parentNode) return; ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, 500); };
    ov.addEventListener('click', done);
    setTimeout(done, 3300);
    return true;
  }

  /* ================= 3) COMBO / OVERDRIVE ================= */
  var combo = 0, comboT = 0, comboEl = null, WINDOW = 45000, lastHit = 0;
  function comboHud() {
    if (comboEl) return comboEl;
    comboEl = el('div', 'mk-combo', '<small>COMBO</small><b>×<span>0</span></b><i><em></em></i><strong></strong>');
    document.body.appendChild(comboEl);
    return comboEl;
  }
  function hit(kind) {
    if (!on() || ls('mk_combo_v1') === '0' || root.classList.contains('mk-focus')) return;
    var now = Date.now();
    if (now - lastHit < 1500) return; // กันนับซ้ำจากเหตุการณ์เดียวกันที่ส่งมาหลายทาง
    lastHit = now;
    combo++;
    clearTimeout(comboT);
    comboT = setTimeout(endCombo, WINDOW);
    if (combo < 2) return;
    var h = comboHud();
    h.querySelector('span').textContent = combo;
    var bar = h.querySelector('em');
    bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth;
    bar.style.transition = 'width ' + WINDOW + 'ms linear'; bar.style.width = '0%';
    h.classList.remove('is-pop'); void h.offsetWidth; h.classList.add('is-on', 'is-pop');
    h.classList.toggle('is-hot', combo >= 5);
    h.classList.toggle('is-hyper', combo >= 10);
    var label = combo >= 10 ? 'HYPER OVERDRIVE!' : combo >= 5 ? 'OVERDRIVE!' : combo >= 3 ? 'GREAT!' : 'NICE!';
    h.querySelector('strong').textContent = label;
    root.classList.toggle('mk-overdrive', combo >= 5);
    root.classList.toggle('mk-laser', combo >= 10);
    sfx('ok');
    if (combo >= 3 && window.MKPRODUCER) window.MKPRODUCER.gain(Math.min(30, combo * 2), 'combo' + combo);
    if (combo === 5) { if (window.MKBUDDY) window.MKBUDDY.say('OVERDRIVE!! พลังเสียงเพลงล้นแล้ว 🔥'); if (window.MKFX) window.MKFX.strike(); }
    if (combo === 10 || (combo > 10 && combo % 5 === 0)) { if (window.MKFX2) window.MKFX2.fly('cross'); if (window.MKBUDDY) window.MKBUDDY.say('HYPER OVERDRIVE!!! หยุดไม่อยู่แล้ว!'); }
    void kind;
  }
  function endCombo() {
    if (combo >= 5 && window.fxToast) window.fxToast('คอมโบจบที่ ×' + combo + '! เก่งมาก 🔥', 'success');
    combo = 0;
    root.classList.remove('mk-overdrive', 'mk-laser');
    if (comboEl) comboEl.classList.remove('is-on', 'is-hot', 'is-hyper');
  }
  window.addEventListener('mk:toast', function (e) {
    var d = e.detail || {};
    if (d.type === 'success' && !/^เปิด |^ได้รับเหรียญ|^คอมโบจบ|^สภาพอากาศ|^โหมด|^เปิดเพลง|^ยินดีต้อนรับ|^ความสนิท|^ตั้งรหัส|^ปิดการล็อก|^🎙/.test(d.message || '')) hit('toast');
  });
  window.addEventListener('mk:compare', function (e) { if (e.detail && e.detail.total) hit('compare'); });
  window.addEventListener('mk:charged', function (e) { if (e.detail && e.detail.ms > 1500) hit('job'); });

  /* ================= 4) MIKU ไถลผ่านจอพร้อมบรรทัดโน้ตตอนเปลี่ยนหน้า ================= */
  var SW_KEY = 'mk_swoop_v1';
  var swoopOn = ls(SW_KEY) !== '0';
  var lastSwoop = 0;
  function swoop() {
    return; // ปิดถาวร: ไม่มีมิกุไถลผ่านจอตอนเปลี่ยนหน้าแล้ว
    if (!swoopOn || !on() || busy() || root.classList.contains('mk-focus') || Date.now() - lastSwoop < 700) return;
    lastSwoop = Date.now();
    var dir = Math.random() < 0.5 ? 1 : -1;
    var ov = el('div', 'mk-swoop ' + (dir > 0 ? 'to-r' : 'to-l'), '<i class="mk-sw-band"></i><i class="mk-sw-band b2"></i><img alt="" src="' + (isDay() ? SPR.light : SPR.dark) + '">');
    var img = ov.querySelector('img');
    var face = isDay() ? -1 : 1;
    if (face !== dir) img.classList.add('is-flip');
    document.body.appendChild(ov);
    setTimeout(function () { ov.remove(); }, 750);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.tab[data-tool]');
    if (t && e.isTrusted && !t.classList.contains('active')) swoop();
  }, true);

  /* ================= 5) การ์ดโฮโลแกรม ================= */
  var HOLO = '.mk-tc, .mk-skucard, .mk-lvup-card, .mk-win-card, .mk-badge.is-on i';
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest(HOLO);
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--hx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    c.style.setProperty('--hy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }, { passive: true });


  window.MKEPIC = { moduleChange: moduleChange, combo: function () { return combo; }, hit: hit, swoop: swoop };
})();
