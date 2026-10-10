// MIKU LIVE — ตรวจ ORDER กับ Stock เสร็จ = ฉากดวลเพลงบนเวที (คู่กับ css/mk-buddy.css) · คลิกเพื่อข้าม · ปิดได้ในเมนู ✦
//  คู่ดวล "ORDER Challenge" LIFE = จำนวน SKU ทั้งหมด · MIKU ใช้ Miku Miku Beam ลด LIFE เท่ากับ SKU ที่สต็อกพอ
//  พอครบทุก SKU = เคลียร์เพลง (ชนะ + ฉากภารกิจสำเร็จ) · มี SKU ขาด/ไม่มีสต็อก = "ยังเป็น MISS!" พร้อมบอกจำนวน
//  แค่แสดงผลจากตัวเลขสรุปเดิม ไม่แตะการตรวจของระบบ
(function () {
  'use strict';

  var KEY = 'mk_battle_v1';
  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  var enabled = true;
  try { enabled = localStorage.getItem(KEY) !== '0'; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('mk-fx-on'); }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function sfx(n) { if (window.MKSTAGE) window.MKSTAGE.sfx(n); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function active() { return enabled && fxOn() && !reduce; }

  // คู่ดวล: กล่องพัสดุ ORDER ตัวร้าย (วาดเองด้วย SVG)
  var ENEMY = '<svg viewBox="0 0 160 150" aria-hidden="true">' +
    '<ellipse cx="80" cy="140" rx="58" ry="8" fill="rgba(0,0,0,.25)"/>' +
    '<path d="M22 50 80 26l58 24v66l-58 26-58-26z" fill="#60c2bc" stroke="#192e35" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M22 50l58 24 58-24M80 74v68" fill="none" stroke="#192e35" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M22 50 8 34l56-22 16 14zM138 50l14-16-56-22-16 14z" fill="#71d4cd" stroke="#192e35" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M51 38l58 24" stroke="#80e2dc" stroke-width="9" opacity=".85"/>' +
    '<path d="M34 76l14 8M66 88l-14-4" stroke="#192e35" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="44" cy="92" r="7" fill="#fff" stroke="#192e35" stroke-width="3"/><circle cx="46" cy="93" r="3.5" fill="#c01a65"/>' +
    '<circle cx="64" cy="100" r="7" fill="#fff" stroke="#192e35" stroke-width="3"/><circle cx="66" cy="101" r="3.5" fill="#c01a65"/>' +
    '<path d="M38 116q14-8 30 4" fill="none" stroke="#192e35" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M42 113l3 5 4-4 4 5 4-4 4 5" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<text x="110" y="104" text-anchor="middle" font-family="M PLUS Rounded 1c,sans-serif" font-weight="700" font-size="15" fill="#192e35" transform="translate(110 104) skewY(-22) translate(-110 -104)">ORDER</text>' +
    '</svg>';

  var running = null;
  function battle(d) {
    if (running || !active()) return;
    var total = d.total, ok = d.ok, sh = d.short, none = d.none;
    var all = ok === total;
    var T = window.MKPRODUCER ? window.MKPRODUCER.state() : null;
    var lvP = 1;
    try { var e0 = T.exp, lv = 1; while (lv < 100 && e0 >= 40 + lv * 20) { e0 -= 40 + lv * 20; lv++; } lvP = lv; } catch (e) { /* ข้าม */ }
    var lvE = Math.max(2, Math.min(100, Math.ceil(total / 10)));
    var exp = 15 + Math.min(35, Math.round(total / 40)) + (all ? 10 : 0);
    var spr = isDay() ? ['img/miku-day.png?v=miku3', -1] : ['img/miku-night.png?v=miku3', 1];

    var ov = document.createElement('div');
    ov.className = 'mk-battle' + (isDay() ? ' is-day' : '');
    ov.innerHTML =
      '<div class="mk-bt-bars"></div>' +
      '<div class="mk-bt-field">' +
      '<div class="mk-bt-foe"><div class="mk-bt-foe-art">' + ENEMY + '</div></div>' +
      '<div class="mk-bt-me"><img class="mk-bt-me-art" alt="" draggable="false"></div>' +
      '<div class="mk-bt-info mk-bt-info-foe"><b>ORDER Challenge <small>×' + fmt(total) + ' SKU</small></b><span class="mk-bt-lv">Lv.' + lvE + '</span>' +
      '<div class="mk-bt-life"><span>LIFE</span><div class="mk-bt-track"><i class="mk-bt-fill foe"></i></div></div></div>' +
      '<div class="mk-bt-info mk-bt-info-me"><b>MIKU</b><span class="mk-bt-lv">Lv.' + lvP + '</span>' +
      '<div class="mk-bt-life"><span>LIFE</span><div class="mk-bt-track"><i class="mk-bt-fill" style="width:100%"></i></div></div>' +
      '<div class="mk-bt-num">' + fmt(total) + ' / ' + fmt(total) + '</div><div class="mk-bt-exp"><i></i></div></div>' +
      '<div class="mk-bt-beam"></div><div class="mk-bt-flash"></div>' +
      '</div>' +
      '<div class="mk-bt-dlg"><span class="mk-bt-text"></span><span class="mk-dlg-next">▼</span></div>' +
      '<div class="mk-bt-skip">คลิกเพื่อข้าม</div>';
    var me = ov.querySelector('.mk-bt-me-art');
    me.src = spr[0];
    if (spr[1] < 0) me.classList.add('is-flip'); // ให้หันขวาเข้าหาคู่ดวล
    document.body.appendChild(ov);
    running = ov;

    var text = ov.querySelector('.mk-bt-text');
    var foeFill = ov.querySelector('.mk-bt-fill.foe');
    foeFill.style.width = '100%';
    var timers = [];
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function line(s) {
      text.textContent = '';
      var i = 0;
      var id = setInterval(function () { i = Math.min(s.length, i + 2); text.textContent = s.slice(0, i); if (i % 4 === 0) sfx('tick'); if (i >= s.length) clearInterval(id); }, 24);
      timers.push(id);
    }
    function hpColor(el, pct) { el.classList.toggle('mid', pct <= 50 && pct > 20); el.classList.toggle('low', pct <= 20); }
    var left = total - ok, leftPct = total ? left / total * 100 : 0;

    at(150, function () { ov.classList.add('is-in'); line('ORDER Challenge ×' + fmt(total) + ' SKU ขึ้นเวทีแล้ว!'); sfx('cheer'); });
    at(1500, function () { line('MIKU พร้อมร้อง! READY?'); ov.classList.add('is-go'); });
    at(2300, function () { line('♪ MIKU ร้อง Miku Miku Beam! ♪'); });
    at(2900, function () {
      ov.classList.add('is-beam'); sfx('thunder');
      var A = window.MKFX; if (A && A.strike) A.strike();
    });
    at(3250, function () {
      ov.classList.add('is-hit');
      foeFill.style.width = leftPct.toFixed(1) + '%';
      hpColor(foeFill, leftPct);
    });
    at(4300, function () {
      ov.classList.remove('is-beam');
      var r = total ? ok / total : 0;
      line(r >= 0.999 ? 'PERFECT!! ตรวจครบทุก SKU!' : r >= 0.7 ? 'GREAT! สต็อกพอ ' + fmt(ok) + ' SKU' : r >= 0.3 ? 'GOOD! สต็อกพอ ' + fmt(ok) + ' SKU' : 'SAFE… สต็อกพอแค่ ' + fmt(ok) + ' SKU');
    });
    at(5400, function () {
      if (all) { ov.classList.add('is-clear'); line('ORDER Challenge เคลียร์แล้ว! สต็อกพอครบทุก SKU!'); sfx('ok'); }
      else {
        ov.classList.add('is-flee');
        line('SKU ' + [sh ? 'ขาด ' + fmt(sh) : '', none ? 'ไม่มีสต็อก ' + fmt(none) : ''].filter(Boolean).join(' · ') + ' ยังเป็น MISS!');
        sfx('err');
      }
    });
    at(6800, function () { line('MIKU ได้รับ ' + exp + ' EXP!'); ov.classList.add('is-exp'); sfx('ok'); });
    at(8200, finish);

    function finish() {
      if (!running) return;
      timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
      running = null;
      ov.classList.add('is-out');
      setTimeout(function () { ov.remove(); }, 450);
      if (all && window.MKSTAGE) setTimeout(function () { window.MKSTAGE.celebrate('ภารกิจสำเร็จ!', 'สต็อกพอครบทั้ง ' + fmt(total) + ' SKU'); }, 350);
    }
    ov.addEventListener('click', finish);
  }

  window.addEventListener('mk:compare', function (e) { if (e.detail && e.detail.total) battle(e.detail); });

  /* ---------- ปุ่มเปิด/ปิดในเมนู ✦ ---------- */
  function addToggle() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.getElementById('mkBattleToggle')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'mkBattleToggle'; b.className = 'mk-fx-toggle mk-sound-toggle';
    var paint = function () { b.textContent = '⚔️'; b.setAttribute('aria-pressed', String(enabled)); b.classList.toggle('is-off', !enabled); };
    b.addEventListener('click', function () { enabled = !enabled; try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) { /* ข้าม */ } paint(); });
    paint();
    bar.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addToggle); else addToggle();
  window.MKBATTLE = { enabled: active, run: battle };
})();
