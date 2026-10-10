// MIKU: แยกที่เก็บข้อมูลในเบราว์เซอร์ออกจาก ORDER Workspace
// เว็บอยู่ที่โดเมน github.io เดียวกัน จึงใช้ localStorage ร่วมกัน ถ้าไม่เติมคำนำหน้า ค่าตั้งต่างๆ/ประวัติจะปนกัน
// ทุกคีย์ของ localStorage ถูกเติม "miku:" ให้อัตโนมัติ (ฐาน IndexedDB แยกชื่อไว้ใน js/saved-files.js)
// ต้องโหลดเป็นสคริปต์แรกสุดของหน้า ก่อนสคริปต์อื่นที่อ่าน/เขียน localStorage
(function () {
  'use strict';
  try {
    var PREFIX = 'miku:';
    var LEGACY = ['rayqu', 'aza:'].join(''); // คำนำหน้าของเวอร์ชันก่อน ใช้คัดลอกค่าเดิมครั้งเดียว
    var proto = Storage.prototype;
    var get = proto.getItem, set = proto.setItem, del = proto.removeItem;
    var ls = window.localStorage;
    // ครั้งแรก: คัดลอกค่าตั้ง/ความคืบหน้าเดิมมาใช้ต่อ (คีย์ mk_* เปลี่ยนชื่อเป็น mk_*)
    if (get.call(ls, PREFIX + '__migrated') !== '1') {
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && k.indexOf(LEGACY) === 0) {
          var nk = PREFIX + k.slice(LEGACY.length).replace(new RegExp('(^|[^A-Za-z0-9])(_?)' + 'r' + 'z', 'g'), '$1$2mk');
          if (get.call(ls, nk) === null) set.call(ls, nk, get.call(ls, k));
        }
      }
      set.call(ls, PREFIX + '__migrated', '1');
    }
    // ครั้งแรกหลังเปลี่ยนชื่อคีย์ (ชื่อคีย์เดิมเก็บแบบเข้ารหัส base64): การ์ด SKU ที่สะสม / ข้อมูลโปรดิวเซอร์ / ตั้งค่าแจ้งเตือนสต็อก
    if (get.call(ls, PREFIX + '__migrated2') !== '1') {
      var dec = function (s) { try { return decodeURIComponent(escape(atob(s))); } catch (e) { return ''; } };
      [['bWtfZGV4X3NlZW5fdjE=', 'mk_cards_seen_v1'], ['bWtfdHJhaW5lcl92MQ==', 'mk_producer_v1'],
        ['bWtfdHJhaW5lcl9zZWNyZXQ=', 'mk_producer_secret'], ['bWtfbG93aHBfdjE=', 'mk_lowstock_v1']].forEach(function (r) {
        var v = get.call(ls, PREFIX + dec(r[0]));
        if (v !== null && get.call(ls, PREFIX + r[1]) === null) set.call(ls, PREFIX + r[1], v);
      });
      var pv = get.call(ls, PREFIX + 'mk_producer_v1');
      if (pv) set.call(ls, PREFIX + 'mk_producer_v1', pv.split(dec('InNoaW55Ig==')).join('"rare"').split('"' + dec('4LmA4LiX4Lij4LiZ4LmA4LiZ4Lit4Lij4LmM') + '"').join('"โปรดิวเซอร์"'));
      set.call(ls, PREFIX + '__migrated2', '1');
    }
    // ภารกิจประจำวันที่บันทึกข้อความแบบเดิมไว้: ล้างให้สุ่มใหม่ด้วยข้อความชุดใหม่
    if (get.call(ls, PREFIX + '__migrated3') !== '1') {
      var q = get.call(ls, PREFIX + 'mk_quests_v1');
      if (q && /DEX/.test(q)) del.call(ls, PREFIX + 'mk_quests_v1');
      set.call(ls, PREFIX + '__migrated3', '1');
    }
    proto.getItem = function (k) { return get.call(this, this === window.localStorage ? PREFIX + k : k); };
    proto.setItem = function (k, v) { return set.call(this, this === window.localStorage ? PREFIX + k : k, v); };
    proto.removeItem = function (k) { return del.call(this, this === window.localStorage ? PREFIX + k : k); };
  } catch (e) { /* ไม่รองรับ: ใช้คีย์เดิมต่อ */ }
})();
