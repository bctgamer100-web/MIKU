// MIKU STUDIO — เค้าโครงหน้าแบบสตูดิโอเพลง (คู่กับ css/mk-studio.css)
//  หัวหน้า = การ์ด "NOW PLAYING" (ปกเพลง · TRACK · ชื่อหน้า · คำอธิบาย · คลื่นเสียง · ปุ่มหลัก · มิกุโผล่มุมขวา)
//            ใต้การ์ด = แถวชิปตัวเลขสรุป (.ms-hud)
//  เนื้อหา = SETLIST: ขั้นตอนเรียงเป็นแถวการ์ดด้านบน (เลข 1 2 3 ในโน้ตเพลง)
//            ON STAGE: ผลลัพธ์/ตารางกว้างเต็มด้านล่าง
// วิธีทำ: ย้ายบล็อกเดิมไปไว้ในกรอบใหม่ (element เดิม · id เดิม · ตัวจัดการเหตุการณ์เดิม) — ระบบทำงานเหมือนเดิม
// ต้องโหลดหลัง app.js/sunshine.js ฯลฯ และก่อน mk-stage.js (mk-stage วาง LIFE gauge ต่อจากแถบสรุปที่ย้ายแล้ว)
(function () {
  'use strict';

  // [selector ในหน้า, ชื่อขั้น, ไอคอน] · selector ขึ้นต้นด้วย ^ = หาในทั้งเอกสาร
  var PAGES = {
    mergeTool: {
      code: '01', en: 'DATA IMPORT', icon: '⬆',
      title: 'นำเข้าข้อมูล', subSel: '.sun-imp-head p',
      host: '#sunImportTool', // CSS ของการ์ดอัปโหลดผูกกับ #sunImportTool จึงต้องวางเค้าโครงไว้ข้างใน
      actions: ['.sun-imp-bar', 'label:has(#sunAutoStartup)'],
      gone: ['.sun-imp-head'],
      full: [['#sunImportGrid', 'อัปโหลดไฟล์ทีละชนิด · ลากไฟล์มาวางในการ์ดได้เลย', '🗂']]
    },
    compareTool: {
      code: '02', en: 'ORDER × STOCK', icon: '⇄',
      title: 'ตรวจ ORDER กับ Stock', sub: 'ใส่ไฟล์ ORDER กับ Stock (หรือดึงจากฐานข้อมูล) แล้วระบบเทียบให้อัตโนมัติ — เห็นทันทีว่าพอ ขาด หรือไม่มีสต็อก พร้อมสร้างใบย้ายสินค้า',
      hud: ['#compareQuickStatus'],
      side: [
        ['.grid > .card:nth-child(1)', 'ไฟล์ ORDER', '📥'],
        ['.grid > .card:nth-child(2)', 'Stock + ประวัติเคลื่อนไหว (SI)', '📦'],
        ['.app .panel', 'สถานะการตรวจ', '⚙'],
        ['#confirmRef', 'รายการที่ยืนยันไว้', '📂']
      ],
      main: [
        ['#progress', '', ''],
        ['#compareStatus', '', ''],
        ['#downloadBox', 'ดาวน์โหลดผลตรวจ', '⬇'],
        ['#compareWebPreview', 'ผลตรวจ + ใบย้ายสินค้า', '📋'],
        ['#compareExtra', 'ค้นหาในผลตรวจ', '🔍'],
        ['#resultBox', 'ตารางผลตรวจ', '📊'],
        ['.app .stats', '', '']
      ],
      gone: ['.app > header', '.grid']
    },
    orderTool: {
      code: '03', en: 'ORDER INTAKE', icon: '📥',
      title: 'รับORDER', subSel: '.beta-card > div:first-child p',
      actions: ['#orderAuto'],
      hud: ['.beta-stats', '#orderSummaryExtra'],
      side: [
        ['#orderDrop', 'เลือกไฟล์ ORDER', '📁'],
        ['#savedFiles', 'ไฟล์ที่เคยใช้', '🕘'],
        ['.beta-progress', '', ''],
        ['#orderStatus', '', ''],
        ['.beta-actions', 'ส่งออก / ดาวน์โหลด', '⬇']
      ],
      main: [
        ['#orderFilterPanel', 'กรองข้อมูลตามหัวข้อ', '🔎'],
        ['#orderPivotWrap', 'ตาราง Pivot', '📊'],
        ['.order-preview-head', '', ''],
        ['.beta-preview', 'ตัวอย่างข้อมูล', '🧾']
      ],
      gone: ['.beta-card > div:first-child']
    },
    beforeOrderTool: {
      code: '04', en: 'PRE-ORDER', icon: '🛒',
      title: 'ก่อนสั่ง', subSel: '.before-order-head p',
      actions: ['.before-order-actions'],
      hud: ['.before-order-stats'],
      side: [
        ['#beforeOrderRef', 'ใบปริ้นที่เคยปริ้น', '🕘'],
        ['#beforeOrderStatus', 'สถานะ', 'ℹ']
      ],
      main: [['.before-order-table-wrap', 'รายการจาก Pivot · ติ๊กเลือกแล้วกดยืนยัน', '☑']],
      gone: ['.before-order-head', '.before-order-card']
    },
    scanTool: {
      code: '05', en: 'PRINT CHECK', icon: '🧾',
      title: 'ตรวจใบปริ้น', subSel: '.scan-card > p',
      side: [
        ['#scanNeed', '', ''],
        ['#scanDrop', 'ถ่ายรูป / เลือกรูปใบปริ้น', '📷'],
        ['#scanRef', 'ใบปริ้นที่บันทึกไว้', '🕘'],
        ['#scanStatus', '', '']
      ],
      main: [['#scanResult', 'ผลการอ่านกากบาท ✗ / วงกลม ○', '🎯']],
      gone: ['.scan-card > h2', '.scan-card > p']
    },
    summaryTool: {
      code: '06', en: 'ACTIVITY LOG', icon: '📈',
      title: 'สรุปงาน', subSel: '.summary-head p',
      actions: ['.summary-actions'],
      hud: ['.summary-stats'],
      full: [['#summaryList', 'ไทม์ไลน์กิจกรรม', '🕘']],
      gone: ['.summary-head']
    },
    sunTool: {
      code: 'MK', en: 'MK PLAN', icon: '☀',
      titleFrom: '#scCurrentPage', sub: 'ข้อมูลจากฐานข้อมูล MK Plan — ค้นหา SKU กรอง และดาวน์โหลดได้จากแถบด้านบน',
      actions: ['.sun-toolbar'],
      full: [['#sunStatus', '', ''], ['#sunOutput', 'ข้อมูล', '📊']]
    }
  };

  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function find(sec, sel) {
    if (!sel) return null;
    if (sel.charAt(0) === '^') return document.querySelector(sel.slice(1));
    try { return sec.querySelector(sel); } catch (e) { return null; }
  }
  var root = document.documentElement;
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }

  // การ์ด: หัวการ์ด (โน้ตเลขขั้น หรือ ไอคอน + ชื่อ) + ตัวบล็อกเดิม · ไม่มีชื่อ = การ์ดบาง (เช่นแถบ progress)
  var cards = [];
  function card(block, title, icon, n) {
    var p = el('section', 'ms-card' + (title ? '' : ' ms-card-bare'));
    if (title) {
      p.appendChild(el('header', 'ms-card-head',
        (n != null ? '<b class="ms-num" aria-hidden="true">' + (n + 1) + '</b>' : '<b class="ms-ico" aria-hidden="true">' + (icon || '♪') + '</b>') +
        '<span>' + title + '</span>'));
    }
    var body = el('div', 'ms-card-body');
    p.appendChild(body);
    block.parentNode.insertBefore(p, block);
    body.appendChild(block);
    cards.push([p, block]);
    return p;
  }

  var heads = [];
  function build(id, cfg) {
    var sec = document.getElementById(id);
    if (!sec || sec.querySelector('.ms-head')) return;
    sec.classList.add('ms-page');
    var resolve = function (list) { return (list || []).map(function (d) { return [find(sec, d[0]), d[1], d[2]]; }); };
    var setList = resolve(cfg.side), stageList = resolve(cfg.main || cfg.full);

    // ---------- การ์ด NOW PLAYING ----------
    var subText = cfg.sub || '';
    var subEl = find(sec, cfg.subSel);
    if (subEl) subText = subEl.innerHTML;
    var wave = '';
    for (var i = 0; i < 48; i++) wave += '<i style="--h:' + (18 + ((i * 37 + cfg.code.charCodeAt(1) * 11) % 70)) + '%"></i>';
    var head = el('header', 'ms-head',
      '<div class="ms-jacket" aria-hidden="true"><b>' + cfg.icon + '</b><span class="ms-eq"><i></i><i></i><i></i><i></i></span></div>' +
      '<div class="ms-head-main">' +
      '<div class="ms-track"><span class="ms-live">● NOW PLAYING</span><span>TRACK ' + cfg.code + ' · ' + cfg.en + '</span></div>' +
      '<h2 class="ms-title"><span></span></h2>' +
      '<p class="ms-sub"></p>' +
      '<div class="ms-wave" aria-hidden="true">' + wave + '</div>' +
      '</div>' +
      '<div class="ms-head-actions"></div>' +
      '<img class="ms-head-miku" alt="" aria-hidden="true" draggable="false">');
    head.querySelector('.ms-title span').textContent = cfg.title || '';
    head.querySelector('.ms-sub').innerHTML = subText;
    heads.push(head.querySelector('.ms-head-miku'));
    var host = (cfg.host && find(sec, cfg.host)) || sec;
    host.insertBefore(head, host.firstChild);
    var hud = el('div', 'ms-hud');
    head.parentNode.insertBefore(hud, head.nextSibling);
    var acts = head.querySelector('.ms-head-actions');
    (cfg.actions || []).forEach(function (s) { var b = find(sec, s); if (b && !head.contains(b)) acts.appendChild(b); });
    (cfg.hud || []).forEach(function (s) { var b = find(sec, s); if (b && !hud.contains(b)) hud.appendChild(b); });
    if (!acts.children.length) acts.remove();
    if (!hud.children.length) hud.classList.add('is-empty');

    if (cfg.titleFrom) {
      var src = document.querySelector(cfg.titleFrom), span = head.querySelector('.ms-title span');
      var syncT = function () { if (src && sec.classList.contains('active')) span.textContent = src.textContent; };
      syncT();
      if (src) new MutationObserver(syncT).observe(src, { childList: true, characterData: true, subtree: true });
      new MutationObserver(syncT).observe(sec, { attributes: true, attributeFilter: ['class'] });
    }

    // ---------- SETLIST (ขั้นตอน) + ON STAGE (ผลลัพธ์) ----------
    var body = el('div', 'ms-body');
    host.appendChild(body);
    var setl = null;
    if (!cfg.full) {
      setl = el('div', 'ms-setlist');
      body.appendChild(el('div', 'ms-label', '<span>SETLIST</span><small>ขั้นตอน</small>'));
      body.appendChild(setl);
    }
    var stage = el('div', 'ms-stage');
    body.appendChild(el('div', 'ms-label', '<span>ON STAGE</span><small>' + (cfg.full ? 'พื้นที่ทำงาน' : 'ผลลัพธ์') + '</small>'));
    body.appendChild(stage);
    var n = 0;
    setList.forEach(function (d) {
      var b = d[0]; if (!b || body.contains(b) || head.contains(b) || hud.contains(b)) return;
      setl.appendChild(b); card(b, d[1], d[2], d[1] ? n++ : null);
    });
    stageList.forEach(function (d) {
      var b = d[0]; if (!b || body.contains(b) || head.contains(b) || hud.contains(b)) return;
      stage.appendChild(b); card(b, d[1], d[2], null);
    });
    if (!cfg.full) {
      stage.appendChild(el('section', 'ms-card ms-empty',
        '<div class="ms-empty-art" aria-hidden="true"><img alt="" src="img/miku-day.png?v=miku5" draggable="false"></div>' +
        '<div><b>ยังไม่มีเพลงบนเวที</b><span>ทำตาม SETLIST ด้านบน แล้วผลลัพธ์จะขึ้นที่นี่ ♪</span></div>'));
    }
    (cfg.gone || []).forEach(function (s) { var g = find(sec, s); if (g && !body.contains(g) && !head.contains(g) && !hud.contains(g)) g.classList.add('ms-gone'); });
    // กรอบเดิมที่ไม่เหลืออะไรข้างในแล้ว = ซ่อนทั้งกรอบ (ไล่จากในออกนอก)
    var shells = Array.prototype.slice.call(sec.querySelectorAll('div, main, header')).filter(function (x) {
      return !body.contains(x) && !head.contains(x) && !hud.contains(x) && x !== body && x !== head && x !== hud;
    }).reverse();
    shells.forEach(function (x) {
      if (x.id && x.id !== 'sunImportTool') return;
      if (!x.children.length) {
        if (/(beta-card|app|scan-card|summary-card|sun-card-wrap)/.test(x.className) && !(x.textContent || '').trim()) x.classList.add('ms-gone');
        return;
      }
      var left = Array.prototype.some.call(x.children, function (c) { return !c.classList.contains('ms-gone'); });
      if (!left) x.classList.add('ms-gone');
    });
    sec.classList.add('ms-built');
  }

  /* ---------- ซ่อนการ์ดที่บล็อกข้างในถูกระบบซ่อนอยู่ + การ์ด "ยังไม่มีเพลงบนเวที" ---------- */
  function hiddenEl(b) { return b.hidden || getComputedStyle(b).display === 'none'; }
  var raf = 0;
  function refresh() {
    raf = 0;
    cards.forEach(function (pb) { pb[0].classList.toggle('is-off', hiddenEl(pb[1])); });
    document.querySelectorAll('.ms-stage').forEach(function (m) {
      var ph = m.querySelector('.ms-empty');
      if (!ph) return;
      var any = Array.prototype.some.call(m.children, function (c) { return c.classList.contains('ms-card') && !c.classList.contains('ms-empty') && !c.classList.contains('is-off') && !c.classList.contains('ms-card-bare'); });
      ph.classList.toggle('is-off', any);
    });
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(refresh); }
  function paintMiku() {
    var src = isDay() ? 'img/miku-day.png?v=miku5' : 'img/miku-night.png?v=miku5';
    heads.forEach(function (im) { if (im.getAttribute('src') !== src) im.setAttribute('src', src); });
  }

  for (var id in PAGES) build(id, PAGES[id]);
  root.classList.add('ms-studio');
  paintMiku();
  refresh();
  new MutationObserver(schedule).observe(document.querySelector('.panel-wrap') || document.body, { subtree: true, attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
  new MutationObserver(paintMiku).observe(root, { attributes: true, attributeFilter: ['data-prod-theme'] });
  window.addEventListener('load', refresh);
  window.MKSTUDIO = { refresh: refresh };
})();
