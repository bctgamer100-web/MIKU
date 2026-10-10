// MIKU CARD — ดับเบิลคลิก SKU ในตารางไหนก็ได้ = เปิดการ์ดเพลงของสินค้า (คู่กับ css/mk-buddy.css)
//  - ข้อมูลมาจากแถวที่คลิก (ทุกคอลัมน์ที่เป็นตัวเลข = ค่าพารามิเตอร์เทียบกับค่าสูงสุดในตารางนั้น) + ผลตรวจ ORDER กับ Stock ล่าสุด (ถ้ามี)
//  - ภาพอีควอไลเซอร์ประจำ SKU สร้างจากรหัสสินค้า (รหัสเดียวกันได้ภาพเดียวกันเสมอ) · แนวเพลงจากยี่ห้อ + สถานะสต็อก
//  - นับจำนวน SKU ที่เคยเปิดดู ("สะสมแล้ว") เก็บในเบราว์เซอร์
(function () {
  'use strict';

  var SEEN_KEY = 'mk_cards_seen_v1';
  var TYPES = [
    ['POP', '#39c5bb'], ['ROCK', '#e12885'], ['BALLAD', '#86cecb'], ['EDM', '#7a5cff'], ['J-POP', '#ff8fc7'], ['JAZZ', '#c9a15a'],
    ['METAL', '#5a6168'], ['FUNK', '#f08030'], ['DISCO', '#b06ad8'], ['TECHNO', '#2bb3aa'], ['ANISONG', '#ff5f8f'], ['CITY POP', '#58c8f8'],
    ['SYNTH', '#4ad8ff'], ['LO-FI', '#8a9aa6'], ['IDOL', '#ff3fa4'], ['CHIPTUNE', '#78c850'], ['CLASSIC', '#b8b8d0'], ['ACOUSTIC', '#d9a46c']
  ];
  var FLAVOR = [
    'เพลงประจำตัวมีจังหวะ 120 BPM เต้นตามได้ทั้งคลัง',
    'ขึ้นชาร์ตขายดีทุกครั้งที่มีโปรโมชั่น',
    'ทุกครั้งที่ถูกสแกนบาร์โค้ด จะดังเหมือนโน้ตตัวแรกของเพลง',
    'ชอบยืนแถวหลังบนชั้นวาง แต่มีแฟนคลับตามหาเสมอ',
    'นับสต็อกตอนเที่ยงคืนเมื่อไหร่ เหมือนได้ยินเสียงร้องเบาๆ',
    'ออกทัวร์ไปกับรถขนส่งได้วันละหลายร้อยกิโล',
    'ถ้าแพ็กดี จะถึงมือแฟนๆ ในสภาพสมบูรณ์แบบ',
    'เป็นเพลงฮิตติดหูในช่วงปลายเดือน'
  ];
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(t) { var m = /^\s*-?[\d,]+(\.\d+)?\s*$/.exec(t || ''); return m ? parseFloat(t.replace(/,/g, '')) : null; }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }

  /* ---------- ภาพอีควอไลเซอร์ประจำ SKU (แท่งเสียงพิกเซล 12×12 สมมาตร สร้างจากรหัส) ---------- */
  function sprite(sku, c1, c2) {
    var cv = document.createElement('canvas');
    var N = 12, S = 8;
    cv.width = cv.height = N * S;
    var g = cv.getContext('2d'), h = hash(sku), rnd = function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
    var half = [];
    for (var x = 0; x < N / 2; x++) half.push(2 + Math.floor(rnd() * (N - 3)));
    for (var col = 0; col < N; col++) {
      var hgt = half[col < N / 2 ? col : N - 1 - col];
      for (var y = 0; y < hgt; y++) {
        var yy = N - 1 - y;
        g.fillStyle = y >= hgt - 1 ? '#ffffff' : (y > hgt * 0.6 ? c2 : c1);
        g.fillRect(col * S + 1, yy * S + 1, S - 2, S - 2);
      }
    }
    return cv;
  }

  /* ---------- อ่านข้อมูลจากตาราง ---------- */
  function headersOf(table) {
    var row = (table.tHead && table.tHead.rows[0]) || table.querySelector('tr');
    return row ? Array.prototype.map.call(row.cells, function (c) { return (c.textContent || '').trim(); }) : [];
  }
  function skuIndex(heads) {
    for (var i = 0; i < heads.length; i++) if (/sku|รหัส/i.test(heads[i])) return i;
    return -1;
  }
  function norm(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9฀-๿]/g, ''); } // ไม่สนขีด/ช่องว่าง (สั่งด้วยเสียงพูดขีดไม่ได้)
  function brandOf(sku) { var m = /^([A-Za-z]+)/.exec(sku) || /^([^-\s]+)/.exec(sku); return m ? m[1].toUpperCase() : sku; }
  function compareItem(sku) {
    try {
      if (typeof compareResults === 'undefined' || !compareResults.length) return null; // eslint-disable-line no-undef
      var k = norm(sku);
      return compareResults.find(function (x) { return norm(x.sku) === k; }) || null; // eslint-disable-line no-undef
    } catch (e) { return null; }
  }

  var ov = null;
  function open(sku, table, tr) {
    close();
    sku = String(sku).trim();
    var heads = table ? headersOf(table) : [], cells = tr ? Array.prototype.map.call(tr.cells, function (c) { return (c.textContent || '').trim(); }) : [];
    // ค่าพารามิเตอร์: คอลัมน์ตัวเลข เทียบกับค่าสูงสุดของคอลัมน์ในตาราง (ดูไม่เกิน 600 แถว)
    var stats = [];
    if (table && tr) {
      var rows = Array.prototype.slice.call((table.tBodies[0] || table).rows, 0, 600);
      heads.forEach(function (hd, i) {
        var v = num(cells[i]);
        if (v === null || !hd || /^#|ลำดับ|no\.?$/i.test(hd)) return;
        var max = 0;
        rows.forEach(function (r) { var x = r.cells[i] && num(r.cells[i].textContent); if (x !== null && Math.abs(x) > max) max = Math.abs(x); });
        stats.push([hd, v, max ? Math.abs(v) / max : 0]);
      });
    }
    var it = compareItem(sku);
    var h = hash(sku);
    var t1 = TYPES[hash(brandOf(sku)) % TYPES.length];
    var t2 = it ? (/^✅/.test(it.status) ? TYPES[3] : /^⚠️/.test(it.status) ? TYPES[4] : /^❌/.test(it.status) ? TYPES[1] : null) : null;
    if (t2 && t2[0] === t1[0]) t2 = null;
    var no = ('00' + (h % 999 + 1)).slice(-3);

    var seen = {};
    try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch (e) { /* ข้าม */ }
    var isNew = !seen[sku];
    try { window.dispatchEvent(new CustomEvent('mk:skucard', { detail: { sku: sku, isNew: isNew } })); } catch (e) { /* ข้าม */ }
    seen[sku] = 1;
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) { /* ข้าม */ }
    var seenN = Object.keys(seen).length;

    var desc = [];
    desc.push('สินค้ารหัส ' + sku + ' ของยี่ห้อ ' + brandOf(sku) + '.');
    if (it) {
      desc.push('มีสต็อก ' + fmt(it.stockQty) + ' ชิ้น' + (it.locations ? ' พบได้ที่ ' + it.locations : '') + '.');
      desc.push('ORDER ต้องการ ' + fmt(it.orderShown || it.orderQty) + ' ชิ้น — ' + it.status.replace(/^\S+\s*/, '') + '.');
      if (it.stockSku) desc.push('เบิกแทนด้วยรหัสคู่ ' + it.stockSku + '.');
    }
    desc.push(FLAVOR[h % FLAVOR.length] + '.');

    if (it) {
      var mx = Math.max(it.stockQty, it.orderQty, 1);
      stats.unshift(['สต็อก', it.stockQty, it.stockQty / mx], ['ORDER', it.orderQty, it.orderQty / mx]);
    }
    var statHtml = stats.slice(0, 7).map(function (s) {
      return '<div class="mk-skucard-stat"><span>' + esc(s[0]) + '</span><b>' + fmt(s[1]) + '</b><i><em style="width:' + Math.max(3, Math.min(100, s[2] * 100)).toFixed(0) + '%"></em></i></div>';
    }).join('') || '<p class="mk-skucard-none">ไม่มีค่าตัวเลขในแถวนี้</p>';
    var type = function (t) { return t ? '<i class="mk-type" style="background:' + t[1] + '">' + t[0] + '</i>' : ''; };

    ov = document.createElement('div');
    ov.className = 'mk-skucard-ov';
    ov.innerHTML =
      '<div class="mk-skucard" role="dialog" aria-label="MIKU CARD ' + esc(sku) + '">' +
      '<div class="mk-skucard-top"><span class="mk-skucard-eq"><i></i><i></i><i></i><i></i><i></i></span>' +
      '<b>MIKU CARD</b><span class="mk-skucard-seen">สะสมแล้ว ' + fmt(seenN) + ' SKU</span><button type="button" class="mk-skucard-x" aria-label="ปิด">×</button></div>' +
      '<div class="mk-skucard-body">' +
      '<div class="mk-skucard-screen"><div class="mk-skucard-art"></div><div class="mk-skucard-no">TRACK ' + no + (isNew ? ' <em>NEW!</em>' : '') + '</div></div>' +
      '<div class="mk-skucard-info"><h3>' + esc(sku) + '</h3><div class="mk-skucard-types">' + type(t1) + type(t2) + '</div>' +
      '<div class="mk-skucard-stats">' + statHtml + '</div></div>' +
      '</div>' +
      '<p class="mk-skucard-desc">' + esc(desc.join(' ')) + '</p>' +
      '</div>';
    ov.querySelector('.mk-skucard-art').appendChild(sprite(sku, t1[1], t2 ? t2[1] : '#e12885'));
    document.body.appendChild(ov);
    if (window.MKSTAGE) window.MKSTAGE.sfx(isNew ? 'ok' : 'click');
    if (isNew && window.MKBUDDY && seenN % 10 === 0) window.MKBUDDY.say('สะสม MIKU CARD แล้ว ' + seenN + ' ใบ!');
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.mk-skucard-x')) close(); });
    document.addEventListener('keydown', onKey, true);
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
  function close() {
    if (!ov) return;
    var o = ov; ov = null;
    document.removeEventListener('keydown', onKey, true);
    o.classList.add('is-out');
    setTimeout(function () { o.remove(); }, 220);
  }

  document.addEventListener('dblclick', function (e) {
    var td = e.target.closest && e.target.closest('td');
    if (!td || e.target.closest('input, textarea, select, button, a')) return;
    var table = td.closest('table'), tr = td.closest('tr');
    if (!table || !tr) return;
    var heads = headersOf(table), i = skuIndex(heads);
    var sku = (i >= 0 && tr.cells[i] ? tr.cells[i].textContent : td.textContent || '').trim();
    if (!sku || sku === '-' || sku.length > 60) return;
    if (window.getSelection) try { window.getSelection().removeAllRanges(); } catch (er) { /* ข้าม */ }
    open(sku, table, tr);
  });

  // ให้โมดูลอื่นใช้ภาพอีควอไลเซอร์/แนวเพลงเดียวกับการ์ด
  function spriteFor(sku) {
    var t1 = TYPES[hash(brandOf(sku)) % TYPES.length];
    return sprite(String(sku), t1[1], '#ffffff');
  }
  window.MKSKUCARD = {
    sprite: spriteFor,
    open: function (sku) {
      // หาแถวของ SKU นี้ในตารางที่เห็นอยู่ (ถ้ามี) เพื่อดึงค่าพารามิเตอร์
      var tds = document.querySelectorAll('td'), k = norm(sku);
      for (var i = 0; i < tds.length; i++) {
        if (tds[i].offsetParent && norm(tds[i].textContent) === k) return open((tds[i].textContent || '').trim(), tds[i].closest('table'), tds[i].closest('tr'));
      }
      var it = compareItem(sku);
      open(it ? it.sku : sku, null, null);
    }
  };
})();
