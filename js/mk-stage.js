// MIKU STAGE — ตกแต่งธีมเกมจังหวะ (คู่กับ css/mk-stage.css)
//  1) กล่องข้อความแบบเกม: แทน fxToast และ alert() — ตัวหนังสือพิมพ์ทีละตัว + ▼ กะพริบ
//  2) LIFE gauge: สรุปผลหน้า ตรวจ ORDER กับ Stock (LIFE = สัดส่วน SKU ที่สต็อกพอ)
//  3) ฉากเปิดแอปด้วย MIKU DISC (ครั้งแรกของแท็บ/เซสชัน แทนฉากเปิดตัวเดิม)
//  4) หน้าว่างมีเงา MIKU หลับ (CSS)
//  5) ป้ายจังหวะ: VOCALOID/DIVA ข้างโลโก้ + ช่องสถานะในตารางผลตรวจ (พอ/ขาด/ไม่มี)
//  6) แถบเลื่อน/สีไฮไลต์/เมาส์ MIKU DISC (CSS)
//  7) ฉลองภารกิจสำเร็จ: ตรวจแล้วสต็อกพอทุกรายการ / ปริ้นเสร็จ
//  8) สลับ กลางวัน/กลางคืน ตามเวลาจริง (ปุ่ม ⏱ อัตโนมัติ: 06:00–17:59 = กลางวัน)
//  9) (เอาออกแล้ว) เสียงเอฟเฟกต์ — เพลงมิกุอยู่ที่ MIKU RADIO ใน js/mk-world.js
// ไม่แตะตรรกะของระบบ: ข้อความที่แสดงยังเป็นข้อความเดิมของระบบ (เพิ่มแค่คำพูดประกอบ)
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('mk-fx-on'); }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function ls(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* ข้าม */ }
    return null;
  }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }

  // ฉากเปิดตัวเดิมของ mk-fx.js ถูกแทนด้วยฉาก MIKU DISC (อ่านค่าก่อน mk-fx.js จะบันทึกว่าเห็นแล้ว)
  var introSeen = false;
  try { introSeen = sessionStorage.getItem('mk_intro') === '1'; } catch (e) { /* ข้าม */ }
  window.MK_CUSTOM_INTRO = true;

  /* ================= 9) เสียงเอฟเฟกต์: เอาออกแล้ว (ใช้เพลงมิกุจาก MIKU RADIO แทน · js/mk-world.js) ================= */
  function sfx() { /* ไม่มีเสียงเอฟเฟกต์ */ }

  /* ================= 1) กล่องข้อความแบบเกม ================= */
  var dlgWrap = null;
  var FLAVOR = ['PERFECT!', 'MIKU ดีใจมาก!', 'พลังเสียงเพลงเต็มเปี่ยม!', 'สำเร็จอย่างสวยงาม!', 'ยอดเยี่ยมไปเลย!'];
  function typeInto(node, text, done) {
    var i = 0, step = Math.max(1, Math.ceil(text.length / 40));
    if (reduce || !fxOn()) { node.textContent = text; if (done) done(); return function () {}; }
    var id = setInterval(function () {
      i = Math.min(text.length, i + step);
      node.textContent = text.slice(0, i);
      if (i % 3 === 0) sfx('tick');
      if (i >= text.length) { clearInterval(id); if (done) done(); }
    }, 22);
    return function () { clearInterval(id); node.textContent = text; if (done) done(); };
  }
  function stageToast(message, type) {
    message = String(message == null ? '' : message);
    try { window.dispatchEvent(new CustomEvent('mk:toast', { detail: { message: message, type: type || '' } })); } catch (e) { /* ข้าม */ }
    if (!dlgWrap) { dlgWrap = el('div', 'mk-dlg-wrap'); document.body.appendChild(dlgWrap); }
    while (dlgWrap.children.length >= 3) dlgWrap.firstChild.remove();
    var quick = /^เปิด /.test(message);
    var box = el('div', 'mk-dlg' + (type === 'success' ? ' is-ok' : '') + (quick ? ' is-quick' : ''));
    var txt = el('div', 'mk-dlg-text');
    box.appendChild(el('span', 'mk-dlg-disc'));
    box.appendChild(txt);
    var sub = null;
    if (type === 'success' && !quick && Math.random() < 0.6) {
      sub = el('div', 'mk-dlg-sub');
      box.appendChild(sub);
    }
    box.appendChild(el('span', 'mk-dlg-next', '▼'));
    dlgWrap.appendChild(box);
    var shown = quick ? 'MIKU พาไปที่ ' + message.slice(5) + '!' : message;
    if (type === 'success' && !quick) sfx('ok'); else if (!quick) sfx('click');
    var finish = typeInto(txt, shown, function () {
      if (sub) sub.textContent = FLAVOR[Math.floor(Math.random() * FLAVOR.length)];
      box.classList.add('is-done');
    });
    var close = function () { finish(); box.classList.add('is-out'); setTimeout(function () { box.remove(); }, 260); };
    box.addEventListener('click', close);
    setTimeout(close, (quick ? 1500 : 2800) + Math.min(1000, shown.length * 22));
    if (type === 'success' && /ปริ้น|พิมพ์/.test(message)) celebrate('ปริ้นเสร็จแล้ว!', 'ส่งงานถึงมือทีมเรียบร้อย');
  }

  // alert(): กล่องข้อความใหญ่กลางล่าง ต้องกดรับทราบ (คลิก / Enter / Space / Esc)
  var alertQ = [], alertOpen = false;
  function stageAlert(msg) {
    alertQ.push(String(msg == null ? '' : msg));
    if (!alertOpen) nextAlert();
  }
  function nextAlert() {
    var msg = alertQ.shift();
    if (msg === undefined) { alertOpen = false; return; }
    alertOpen = true;
    var ov = el('div', 'mk-alert');
    var box = el('div', 'mk-dlg mk-dlg-big');
    var txt = el('div', 'mk-dlg-text');
    box.appendChild(el('span', 'mk-dlg-disc'));
    box.appendChild(txt);
    box.appendChild(el('span', 'mk-dlg-next', '▼'));
    box.appendChild(el('span', 'mk-dlg-hint', 'กดเพื่อรับทราบ'));
    ov.appendChild(box);
    document.body.appendChild(ov);
    sfx('err');
    var typing = true;
    var finish = typeInto(txt, msg, function () { typing = false; box.classList.add('is-done'); });
    var closed = false;
    function close() {
      if (typing) { finish(); return; } // กดครั้งแรกระหว่างพิมพ์ = แสดงข้อความเต็ม
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      ov.classList.add('is-out');
      setTimeout(function () { ov.remove(); nextAlert(); }, 200);
    }
    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    }
    ov.addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
  }

  /* ================= 2) LIFE gauge ================= */
  var life = null, lifeSig = '';
  function num(id) {
    var x = document.getElementById(id);
    if (!x) return 0;
    var v = x._mkV !== undefined && x._mkV !== null ? x._mkV : parseInt(String(x.textContent).replace(/,/g, ''), 10);
    return isNaN(v) ? 0 : v;
  }
  function buildHp() {
    var qs = document.getElementById('compareQuickStatus');
    if (!qs || life) return;
    life = el('div', 'mk-life',
      '<div class="mk-life-head"><b>STOCK</b><span class="mk-life-types"><i class="mk-type t-cool">พอ</i><i class="mk-type t-safe">ขาด</i><i class="mk-type t-miss">ไม่มี</i></span><span class="mk-life-lv">Lv.<b>0</b></span></div>' +
      '<div class="mk-life-row"><span class="mk-life-tag">LIFE</span><div class="mk-life-track"><i class="mk-life-fill"></i></div></div>' +
      '<div class="mk-life-foot"><span class="mk-life-mix"><i class="m-ok"></i><i class="m-short"></i><i class="m-none"></i></span><span class="mk-life-num">0 / 0</span></div>');
    qs.parentNode.insertBefore(life, qs);
    // แสดง/ซ่อนตามแถบสรุปเดิมของระบบ (ซ่อนอยู่จนกว่าจะตรวจเสร็จ)
    new MutationObserver(scheduleHp).observe(qs, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  }
  function updateHp() {
    buildHp();
    if (!life) return;
    var total = num('compareQuickTotal'), ok = num('compareQuickOk'), sh = num('compareQuickShort'), none = num('compareQuickNone');
    var qs = document.getElementById('compareQuickStatus');
    life.style.display = total > 0 && qs && getComputedStyle(qs).display !== 'none' ? '' : 'none';
    if (!total) { lifeSig = ''; return; }
    var pct = ok / total * 100;
    var fill = life.querySelector('.mk-life-fill');
    fill.style.width = pct.toFixed(1) + '%';
    life.classList.toggle('life-mid', pct <= 50 && pct > 20);
    life.classList.toggle('life-low', pct <= 20);
    life.querySelector('.mk-life-lv b').textContent = total.toLocaleString('en-US');
    life.querySelector('.mk-life-num').textContent = ok.toLocaleString('en-US') + ' / ' + total.toLocaleString('en-US');
    life.querySelector('.m-ok').style.flexGrow = ok;
    life.querySelector('.m-short').style.flexGrow = sh;
    life.querySelector('.m-none').style.flexGrow = none;
    // ฉลองเมื่อผลตรวจชุดใหม่ สต็อกพอทุกรายการ
    var sig = total + '/' + ok + '/' + sh + '/' + none;
    if (sig !== lifeSig) {
      lifeSig = sig;
      try { window.dispatchEvent(new CustomEvent('mk:compare', { detail: { total: total, ok: ok, short: sh, none: none } })); } catch (e) { /* ข้าม */ }
      if (ok === total && sh === 0 && none === 0 && !(window.MKBATTLE && window.MKBATTLE.enabled())) celebrate('ภารกิจสำเร็จ!', 'สต็อกพอครบทั้ง ' + total.toLocaleString('en-US') + ' SKU');
    }
  }
  var hpTimer = 0;
  function scheduleHp() { clearTimeout(hpTimer); hpTimer = setTimeout(updateHp, 950); }
   // รอตัวเลข HUD นับเสร็จ

  /* ================= 5) ป้ายจังหวะ ================= */
  function addBrandTypes() {
    var h1 = document.querySelector('.shell > .top:not(.side-right) h1');
    if (!h1 || h1.querySelector('.mk-brand-types')) return;
    h1.appendChild(el('span', 'mk-brand-types', '<i class="mk-type t-vocaloid">VOCALOID</i><i class="mk-type t-diva">DIVA</i>'));
  }
  var STATUS_TYPE = [['✅', 'COOL', 't-cool'], ['⚠️', 'SAFE', 't-safe'], ['❌', 'MISS', 't-miss']];
  var typeTimer = 0;
  function tagStatusCells() {
    typeTimer = 0;
    var scope = document.getElementById('compareTool');
    if (!scope) return;
    var tds = scope.querySelectorAll('td:not([data-mk-type])');
    for (var i = 0; i < tds.length; i++) {
      var t = tds[i].textContent;
      for (var k = 0; k < STATUS_TYPE.length; k++) {
        if (t.indexOf(STATUS_TYPE[k][0]) === 0) {
          tds[i].setAttribute('data-mk-type', STATUS_TYPE[k][1]);
          tds[i].classList.add('mk-st', STATUS_TYPE[k][2]);
          break;
        }
      }
    }
  }

  /* ================= 7) ฉลองภารกิจสำเร็จ ================= */
  var lastCelebrate = 0;
  function celebrate(title, sub) {
    var now = Date.now();
    if (now - lastCelebrate < 4000 || reduce || !fxOn()) return;
    lastCelebrate = now;
    var ov = el('div', 'mk-win', '<div class="mk-win-rays"></div><div class="mk-win-card"><small>MISSION COMPLETE</small><b></b><span></span></div>');
    ov.querySelector('b').textContent = title;
    ov.querySelector('span').textContent = sub || '';
    var colors = ['var(--mk-ribbon-a)', 'var(--mk-ribbon-b)', 'var(--mk-trim)', '#ec5fa6', '#44ada6', '#ffffff'];
    for (var i = 0; i < 70; i++) {
      var c = el('i', 'mk-confetti');
      c.style.left = (Math.random() * 100) + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.6) + 's';
      c.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
      c.style.setProperty('--mk-drift', ((Math.random() - 0.5) * 220) + 'px');
      c.style.setProperty('--mk-spin', ((Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720)) + 'deg');
      ov.appendChild(c);
    }
    document.body.appendChild(ov);
    try { window.dispatchEvent(new CustomEvent('mk:celebrate')); } catch (e) { /* ข้าม */ }
    var A = window.MKFX;
    if (A && A.burst) [0, 250, 500].forEach(function (ms, j) {
      setTimeout(function () { A.burst(window.innerWidth * (0.3 + j * 0.2), window.innerHeight * 0.45); }, ms);
    });
    setTimeout(function () { ov.classList.add('is-out'); }, 2600);
    setTimeout(function () { ov.remove(); }, 3100);
  }

  /* ================= 3) ฉากเปิดแอป MIKU DISC ================= */
  function discIntro() {
    var spr = isDay() ? 'img/miku-day.png?v=miku3' : 'img/miku-night.png?v=miku3';
    var ov = el('div', 'mk-disc-intro' + (isDay() ? ' is-day' : ' is-night'),
      '<div class="mk-disc-flash"></div>' +
      '<div class="mk-disc-art"><img alt="" draggable="false"></div>' +
      '<div class="mk-disc"><div class="mk-disc-in"><div class="mk-disc-top"></div><div class="mk-disc-bot"></div><div class="mk-disc-glow"></div></div></div>' +
      '<div class="mk-disc-title"><small>ไปเลย!</small><b>MIKU</b></div>' +
      '<div class="mk-disc-skip">คลิกเพื่อข้าม</div>');
    ov.querySelector('.mk-disc-art img').src = spr;
    document.body.appendChild(ov);
    var timers = [];
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    // จังหวะ: ตก+เด้ง → เขย่า 3 ครั้ง → ปุ่มกะพริบ → เปิด + แสงวาบ → มิกุออกมา → หายไป
    at(650, function () { sfx('shake'); });
    at(1050, function () { sfx('shake'); });
    at(1450, function () { sfx('shake'); });
    at(1850, function () { ov.classList.add('is-open'); sfx('open'); });
    at(2150, function () { sfx('cheer'); var A = window.MKFX; if (A && A.strike) A.strike(); });
    at(3500, function () { ov.classList.add('is-out'); });
    at(3900, function () { ov.remove(); });
    ov.addEventListener('click', function () {
      timers.forEach(clearTimeout);
      ov.classList.add('is-out');
      setTimeout(function () { ov.remove(); }, 300);
    });
  }

  /* ================= 8) กลางวัน/กลางคืน ตามเวลา ================= */
  var AUTO_KEY = 'mk_auto_theme_v1';
  var autoOn = ls(AUTO_KEY) === '1';
  var autoBtn = null;
  function wantTheme() {
    // เปิดสภาพอากาศจริง (mk-online.js) = ใช้เวลาพระอาทิตย์ขึ้น/ตกจริง
    var S = window.MK_SUN, now = Date.now();
    if (S && S.rise && S.set && Math.abs(now - S.rise) < 864e5) return now >= S.rise && now < S.set ? 'light' : 'dark';
    var h = new Date().getHours(); return h >= 6 && h < 18 ? 'light' : 'dark';
  }
  function paintAuto() {
    if (!autoBtn) return;
    autoBtn.setAttribute('aria-pressed', String(autoOn));
    autoBtn.title = autoOn ? 'อัตโนมัติ: 06:00–17:59 กลางวัน · 18:00–05:59 กลางคืน (กดเพื่อปิด)' : 'สลับโหมดตามเวลาจริงอัตโนมัติ';
  }
  function applyAuto() {
    if (!autoOn) return;
    var want = wantTheme();
    if ((want === 'light') === isDay()) return;
    var b = document.querySelector('[data-theme-choice="' + want + '"]');
    if (b) b.click(); // คลิกแบบโปรแกรม: ใช้ตัวสลับเดิมของระบบ (บันทึกค่า + ฉาก MODULE CHANGE)
  }
  function addAutoBtn() {
    var sw = document.querySelector('.theme-switch');
    if (!sw || sw.querySelector('.mk-auto-opt')) return;
    autoBtn = el('button', 'theme-opt mk-auto-opt', '<span class="mk-auto-ico">⏱</span>');
    autoBtn.setAttribute('aria-label', 'สลับโหมดตามเวลาอัตโนมัติ');
    autoBtn.type = 'button';
    autoBtn.addEventListener('click', function () {
      autoOn = !autoOn;
      ls(AUTO_KEY, autoOn ? '1' : '0');
      paintAuto();
      if (autoOn) { stageToast('โหมดอัตโนมัติ: กลางวัน 06:00–17:59 · กลางคืน 18:00–05:59', 'success'); applyAuto(); }
    });
    sw.appendChild(autoBtn);
    paintAuto();
    // เลือกโหมดเองด้วยมือ = ปิดอัตโนมัติ
    sw.addEventListener('click', function (e) {
      if (e.isTrusted && e.target.closest('[data-theme-choice]') && autoOn) { autoOn = false; ls(AUTO_KEY, '0'); paintAuto(); }
    }, true);
    setInterval(applyAuto, 30000);
  }

  /* ================= 9) ปุ่มเสียง ================= */
  /* ---------- เชื่อมเข้ากับระบบ ---------- */
  function watch() {
    var mo = new MutationObserver(function (list) {
      var hpHit = false, tableHit = false;
      for (var i = 0; i < list.length; i++) {
        var t = list[i].target;
        var e = t.nodeType === 3 ? t.parentNode : t;
        if (!e || !e.closest) continue;
        if (e.closest('#compareQuickStatus')) hpHit = true;
        else if (!tableHit && e.closest('#compareTool')) tableHit = true;
      }
      if (hpHit) scheduleHp();
      if (tableHit && !typeTimer) typeTimer = setTimeout(tagStatusCells, 120);
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  // แทนที่ทันที (ก่อน DOMContentLoaded) — app.js ตั้ง fxToast ไว้แล้วตอนนี้
  window.fxToast = stageToast;
  window.alert = stageAlert;
  window.MKSTAGE = { toast: stageToast, alert: stageAlert, celebrate: celebrate, sfx: sfx, intro: discIntro };

  function init() {
    window.fxToast = stageToast; // เผื่อสคริปต์อื่นตั้งทับระหว่างโหลด
    addBrandTypes();
    addAutoBtn();
    watch();
    updateHp();
    tagStatusCells();
    applyAuto();
    if (!introSeen && fxOn() && !reduce) setTimeout(discIntro, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
