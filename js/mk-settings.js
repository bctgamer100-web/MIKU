// MIKU SETTINGS — ศูนย์ตั้งค่ารวม + โหมดโฟกัส + วัดความลื่นของเครื่อง (คู่กับ css/mk-extra.css)
//  - เมนู ✦ > ⚙ ตั้งค่าทั้งหมด: หน้าเดียวสไตล์เมนูเกม แบ่งหมวด ภาพ / เสียง / เกม / ออนไลน์ / ความปลอดภัย
//    สวิตช์แต่ละอันกดปุ่มเดิมของโมดูลนั้นให้ (ค่าเก็บที่เดิม) · มีปุ่ม "คืนค่าเริ่มต้น" (ไม่ลบเลเวล/สถิติ/รหัสผ่าน)
//  - โหมดโฟกัส (ปุ่ม F): ปิดของหนัก/ดึงความสนใจ (3D, มิกุลอยผ่าน, ฉากเปลี่ยนหน้า, คอมโบ, เสียงรบกวน, ฝน/หิมะ, ริบบิ้นบนฟ้า) ปิดแล้วคืนค่าเดิม
//    เครื่องกระตุก (ต่ำกว่า ~24 เฟรม/วินาที นานต่อเนื่อง) = เปิดโหมดโฟกัสให้เอง (ปิดได้ในศูนย์ตั้งค่า)
//  - วัดความลื่น: แสดงเฟรมต่อวินาที + เอฟเฟกต์ที่เปิดอยู่ + คำแนะนำว่าควรปิดอะไร
(function () {
  'use strict';

  var root = document.documentElement;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ข้าม */ } return null; }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function toast(m, t) { if (window.fxToast) window.fxToast(m, t || ''); }
  function btnOn(id) { var b = document.getElementById(id); return b ? b.getAttribute('aria-pressed') === 'true' : false; }
  function press(id) { var b = document.getElementById(id); if (b) b.click(); }

  /* ================= วัดความลื่น ================= */
  var fps = 60, frames = 0, last = performance.now(), slowSince = 0;
  (function loop(t) {
    requestAnimationFrame(loop);
    frames++;
    if (t - last >= 1000) {
      fps = Math.round(frames * 1000 / (t - last));
      frames = 0; last = t;
      if (document.hidden) { slowSince = 0; return; }
      // เครื่องกระตุกนานต่อเนื่อง 20 วินาที → เปิดโหมดโฟกัสให้เอง
      if (fps < 24 && root.classList.contains('mk-fx-on') && !root.classList.contains('mk-focus') && ls('mk_autofocus_v1') !== '0') {
        if (!slowSince) slowSince = t;
        else if (t - slowSince > 20000) { slowSince = 0; setFocus(true, 'auto'); }
      } else slowSince = 0;
      if (panel) paintPerf();
    }
  })(performance.now());

  /* ================= โหมดโฟกัส ================= */
  var FKEY = 'mk_focus_v1';
  // สิ่งที่ปิดตอนโฟกัส: [id ปุ่มเดิม] — จำสถานะก่อนเปิดไว้ คืนค่าเมื่อปิดโฟกัส
  var FOCUS_OFF = ['mk3dToggle', 'mkSwoopToggle'];
  function setFocus(v, why) {
    var st = {};
    try { st = JSON.parse(ls(FKEY) || '{}'); } catch (e) { /* ข้าม */ }
    if (v) {
      var snap = {};
      FOCUS_OFF.forEach(function (id) { snap[id] = btnOn(id); if (snap[id]) press(id); });
      ls(FKEY, JSON.stringify({ on: true, snap: snap }));
      root.classList.add('mk-focus');
      toast(why === 'auto' ? '🎯 เครื่องเริ่มหน่วง — เปิดโหมดโฟกัสให้แล้ว (ปิดเอฟเฟกต์หนัก) กด F เพื่อปิด' : '🎯 โหมดโฟกัส: ปิดเอฟเฟกต์หนักและฉากที่ดึงความสนใจแล้ว (กด F อีกครั้งเพื่อปิด)', '');
    } else {
      var s = st.snap || {};
      FOCUS_OFF.forEach(function (id) { if (s[id] && !btnOn(id)) press(id); });
      ls(FKEY, JSON.stringify({ on: false }));
      root.classList.remove('mk-focus');
      toast('✨ ปิดโหมดโฟกัส — เอฟเฟกต์กลับมาตามเดิม', '');
    }
    paintFocusBtn();
    if (panel) paint();
  }
  function focusOn() { return root.classList.contains('mk-focus'); }
  try { if (JSON.parse(ls(FKEY) || '{}').on) root.classList.add('mk-focus'); } catch (e) { /* ข้าม */ }

  /* ================= ศูนย์ตั้งค่า ================= */
  // [หมวด, ไอคอน, รายการ] · รายการ: [ชื่อ, คำอธิบาย, ชนิด, ค่า] · ชนิด: btn = ปุ่มเดิม (id) · flag = ค่า localStorage (ค่าเริ่ม=เปิด) · fn = ฟังก์ชัน
  var SECTIONS = [
    ['ภาพ', '🎨', [
      ['เอฟเฟกต์ MIKU (FX)', 'สปอตไลต์ โน้ตลอย ประกายดาว และฉากทั้งหมด — ปิดแล้วเหลือแค่ธีมสี', 'btn', 'mkFxToggle'],
      ['ฉาก 3D', 'ฮอลล์คอนเสิร์ต 3 มิติ การ์ดกระจก การ์ดเอียงตามเมาส์ (กินเครื่องที่สุด)', 'btn', 'mk3dToggle'],
      ['MIKU ไถลผ่านตอนเปลี่ยนหน้า', 'มิกุลากบรรทัดโน้ตผ่านจอตอนกดแท็บ', 'btn', 'mkSwoopToggle'],
      ['เทศกาล', 'ตกแต่งตามวันสำคัญ (สงกรานต์ ลอยกระทง ตรุษจีน คริสต์มาส ปีใหม่)', 'flag', 'mk_fest_v1']
    ]],
    ['เพลง', '🎵', [
      ['MIKU RADIO', 'เพลงมิกุจากช่อง YouTube ทางการ 12 เพลง (ปุ่ม M) — กดเปิดเครื่องเล่น', 'btn', 'mkBgmToggle']
    ]],
    ['เกม', '🎮', [
      ['คู่หู MIKU', 'มิกุตัวเล็กมุมจอ', 'btn', 'mkBuddyToggle'],
      ['โหมดต่อสู้', 'ฉากต่อสู้หลังตรวจ ORDER กับ Stock', 'btn', 'mkBattleToggle'],
      ['คอมโบ / OVERDRIVE', 'นับงานสำเร็จติดกัน ขอบจอลุกไฟเมื่อครบ 5', 'flag', 'mk_combo_v1'],
      ['นักร้องลึกลับมาท้าดวล', 'เงาปริศนาโผล่ขอบฟ้าวันแดดแรง/ฝนตก แล้ว MIKU ไล่กลับ', 'flag', 'mk_visit_v1'],
      ['แจ้งเตือนสต็อกใกล้หมด', 'ตารางหน้า MK Plan: SKU สต็อกน้อยขึ้นป้าย ⚠ ใกล้หมด / 🔇 หมดสต็อก', 'flag', 'mk_lowstock_v1']
    ]],
    ['ออนไลน์', '🌐', [
      ['สภาพอากาศจริง · อันดับทีม · สั่งด้วยเสียง', 'เปิดแผงตั้งค่าออนไลน์ (ทุกข้อปิดไว้ก่อน)', 'fn', function () { close(); if (window.MKONLINE) window.MKONLINE.open(); }]
    ]],
    ['ความปลอดภัย', '🔒', [
    ]]
  ];
  var panel = null;
  function itemOn(it) {
    if (it[2] === 'btn') return btnOn(it[3]);
    if (it[2] === 'flag') return ls(it[3]) !== '0';
    return null;
  }
  function paint() {
    if (!panel) return;
    var html = '';
    SECTIONS.forEach(function (sec, si) {
      html += '<section class="mk-set-sec"><h4><i>' + sec[1] + '</i>' + sec[0] + '</h4>';
      sec[2].forEach(function (it, ii) {
        var on = itemOn(it);
        var exists = it[2] !== 'btn' || document.getElementById(it[3]);
        if (!exists) return;
        html += '<button type="button" class="mk-set-row" data-s="' + si + '" data-i="' + ii + '">' +
          '<span class="mk-set-txt"><b>' + it[0] + '</b><small>' + it[1] + '</small></span>' +
          (on === null ? '<span class="mk-set-go">เปิด ›</span>' : '<span class="mk-set-sw' + (on ? ' is-on' : '') + '"><i></i></span>') + '</button>';
      });
      html += '</section>';
    });
    panel.querySelector('.mk-set-list').innerHTML = html;
    paintPerf();
    var f = panel.querySelector('.mk-set-focus');
    f.classList.toggle('is-on', focusOn());
    f.querySelector('b').textContent = focusOn() ? '🎯 โหมดโฟกัส: เปิดอยู่' : '🎯 โหมดโฟกัส';
    panel.querySelector('.mk-set-auto input').checked = ls('mk_autofocus_v1') !== '0';
  }
  function paintPerf() {
    if (!panel) return;
    var on = [];
    if (root.classList.contains('mk-fx-on')) on.push('FX');
    if (btnOn('mk3dToggle')) on.push('3D');
    if (btnOn('mkBgmToggle')) on.push('เพลง');
    if (btnOn('mkSwoopToggle')) on.push('ฉากเปลี่ยนหน้า');
    if (btnOn('mkBuddyToggle')) on.push('คู่หู');
    var tips = [];
    if (fps < 40) {
      if (btnOn('mk3dToggle')) tips.push('ปิด "ฉาก 3D" (ช่วยมากที่สุด)');
      if (!focusOn()) tips.push('เปิด "โหมดโฟกัส"');
      if (root.classList.contains('mk-fx-on') && !btnOn('mk3dToggle')) tips.push('ปิด "เอฟเฟกต์ FX" ถ้ายังหน่วง');
    }
    var grade = fps >= 50 ? ['ลื่นมาก', 'g'] : fps >= 35 ? ['พอใช้', 'y'] : ['หน่วง', 'r'];
    panel.querySelector('.mk-set-perf').innerHTML =
      '<div class="mk-perf-fps is-' + grade[1] + '"><b>' + fps + '</b><small>FPS · ' + grade[0] + '</small></div>' +
      '<div class="mk-perf-info"><span>เปิดอยู่: ' + (on.join(' · ') || 'ไม่มี') + '</span>' +
      '<span>' + (tips.length ? '💡 แนะนำ: ' + tips.join(' · ') : '✅ เครื่องรับไหว ไม่ต้องปิดอะไร') + '</span></div>';
  }
  function open() {
    if (panel) return;
    var dock = document.querySelector('.mk-dock'); if (dock) dock.classList.remove('is-open');
    panel = el('div', 'mk-tc-ov mk-set-ov',
      '<div class="mk-tc mk-set" role="dialog" aria-label="ตั้งค่า"><div class="mk-tc-head"><b>⚙ SETTINGS</b><span>ศูนย์ตั้งค่า MIKU</span><button type="button" class="mk-tc-x" aria-label="ปิด">×</button></div>' +
      '<div class="mk-set-top"><button type="button" class="mk-set-focus"><b></b><small>ปิดเอฟเฟกต์หนักและฉากที่ดึงความสนใจ เหมาะกับช่วงงานยุ่ง (ปุ่ม F)</small></button>' +
      '<div class="mk-set-perf"></div></div>' +
      '<label class="mk-set-auto"><input type="checkbox"> เปิดโหมดโฟกัสให้เองเมื่อเครื่องเริ่มหน่วง</label>' +
      '<div class="mk-set-list"></div>' +
      '<div class="mk-tc-foot"><button type="button" class="mk-set-reset">↺ คืนค่าเริ่มต้น</button><button type="button" class="mk-tc-close">ปิด</button></div></div>');
    document.body.appendChild(panel);
    paint();
    panel.addEventListener('click', function (e) {
      if (e.target === panel || e.target.closest('.mk-tc-x, .mk-tc-close')) { close(); return; }
      if (e.target.closest('.mk-set-focus')) { setFocus(!focusOn()); return; }
      if (e.target.closest('.mk-set-reset')) { reset(); return; }
      var row = e.target.closest('.mk-set-row');
      if (!row) return;
      var it = SECTIONS[+row.dataset.s][2][+row.dataset.i];
      if (it[2] === 'btn') press(it[3]);
      else if (it[2] === 'flag') { ls(it[3], ls(it[3]) === '0' ? '1' : '0'); try { window.dispatchEvent(new CustomEvent('mk:setting', { detail: { key: it[3] } })); } catch (er) { /* ข้าม */ } }
      else if (it[2] === 'fn') { it[3](); return; }
      setTimeout(paint, 60);
    });
    panel.querySelector('.mk-set-auto input').addEventListener('change', function (e) { ls('mk_autofocus_v1', e.target.checked ? '1' : '0'); });
    document.addEventListener('keydown', onEsc, true);
  }
  function onEsc(e) { if (e.key === 'Escape' && panel && !document.querySelector('.mk-ask')) { e.stopPropagation(); close(); } }
  function close() {
    if (!panel) return;
    var p = panel; panel = null;
    document.removeEventListener('keydown', onEsc, true);
    p.classList.add('is-out'); setTimeout(function () { p.remove(); }, 250);
  }
  function reset() {
    var ask = window.mkConfirm ? window.mkConfirm('คืนค่าการตั้งค่าทั้งหมดเป็นค่าเริ่มต้น?\n\n(เลเวล สถิติ เหรียญตรา ข้อมูลงาน และรหัสผ่านยังอยู่ครบ)') : Promise.resolve(window.confirm('คืนค่าเริ่มต้น?'));
    ask.then(function (yes) {
      if (!yes) return;
      ['mk_fx_v1', 'mk_3d_v1', 'mk_battle_v1', 'mk_swoop_v1', 'mk_combo_v1', 'mk_visit_v1', 'mk_lowstock_v1',
        'mk_fest_v1', 'mk_focus_v1', 'mk_autofocus_v1', 'mk_auto_theme_v1', 'mk_weather_v1'].forEach(function (k) { ls(k, null); });
      try { var b = JSON.parse(ls('mk_buddy_v1') || '{}'); b.on = true; b.x = null; b.y = null; ls('mk_buddy_v1', JSON.stringify(b)); } catch (e) { /* ข้าม */ }
      toast('คืนค่าเริ่มต้นแล้ว — กำลังโหลดหน้าใหม่…', 'success');
      setTimeout(function () { location.reload(); }, 900);
    });
  }

  /* ---------- ปุ่ม ---------- */
  var fBtn = null;
  function paintFocusBtn() { if (fBtn) { fBtn.setAttribute('aria-pressed', String(focusOn())); fBtn.classList.toggle('is-off', !focusOn()); } }
  function addButtons() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar) return;
    if (!document.getElementById('mkSettingsBtn')) {
      var b = el('button', 'mk-fx-toggle mk-sound-toggle'); b.type = 'button'; b.id = 'mkSettingsBtn'; b.textContent = '⚙';
      b.addEventListener('click', open); bar.appendChild(b);
    }
    if (!document.getElementById('mkFocusBtn')) {
      fBtn = el('button', 'mk-fx-toggle mk-sound-toggle'); fBtn.type = 'button'; fBtn.id = 'mkFocusBtn'; fBtn.textContent = '🎯';
      fBtn.addEventListener('click', function () { setFocus(!focusOn()); }); bar.appendChild(fBtn);
      paintFocusBtn();
    }
  }
  // ปุ่มลัดตัวอักษรเดียว (T W M V F) ต้องไม่ทำงานตอนกำลังพิมพ์คำลับ (miku, comet, laser, sparkle, album)
  // = ถ้ามีการกดตัวอักษรอื่นก่อนหน้าไม่เกิน 0.7 วินาที ถือว่ากำลังพิมพ์คำ
  var prevKey = 0, lastKey = 0;
  window.addEventListener('keydown', function (e) {
    if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) { prevKey = lastKey; lastKey = Date.now(); }
  }, true);
  window.MK_MIDWORD = function () { return lastKey - prevKey < 700; };
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if ((window.MK_MIDWORD && window.MK_MIDWORD()) || e.ctrlKey || e.metaKey || e.altKey || (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)))) return;
    if (e.key === 'f' || e.key === 'F') setFocus(!focusOn());
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButtons); else addButtons();
  window.MKSETTINGS = { open: open, focus: setFocus, fps: function () { return fps; } };
})();
