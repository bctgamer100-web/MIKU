// MIKU — ตั้งค่าฐานข้อมูล Supabase (ใช้ฐานข้อมูลชุดเดิมร่วมกับระบบเก่า)
//
// ค่าจาก Supabase > Project Settings > API (ใช้ publishable/anon key เท่านั้น ห้ามใช้ service_role)
// ตอนนี้ชี้ไปฐานข้อมูลชุดเดิม (โปรเจกต์เดียวกับระบบเก่า) · ปล่อยว่างไว้ = ไม่ต่อฐานข้อมูลเลย
// ถ้าจะแยกฐานข้อมูลภายหลัง: ดู supabase/MIKU-SETUP.md
//
// ส่วนขยาย (stock-sync-extension) มีไฟล์ตั้งค่าของตัวเอง: stock-sync-extension/mk-config.js ต้องใส่ค่าชุดเดียวกัน
window.MIKU_CONFIG = {
  supabaseUrl: 'https://yvfqxlgkwaylivopctno.supabase.co',
  supabaseKey: 'sb_publishable_xNq2vHHwVe8v_rujH3P_QQ_ep6-g6ol'   // publishable key เท่านั้น
};

(function () {
  'use strict';
  var c = window.MIKU_CONFIG;
  c.ready = !!(c.supabaseUrl && c.supabaseKey);
  if (c.ready) return;
  // แจ้งเตือนบนหน้าเว็บ: ยังไม่ได้ตั้งค่า
  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.createElement('div');
    bar.textContent = '⚠️ MIKU ยังไม่ได้ตั้งค่า Supabase ของตัวเอง — ฟังก์ชันที่ใช้ฐานข้อมูล (นำเข้าข้อมูล, ซิงค์ใบปริ้น, ตรวจ ORDER กับ Stock) จะยังไม่ทำงาน · แก้ไฟล์ js/mk-config.js (ดู supabase/MIKU-SETUP.md)';
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;padding:8px 14px;background:#4bece1;color:#080f12;font:13px/1.4 system-ui,Tahoma,sans-serif;text-align:center';
    document.body.appendChild(bar);
  });
})();
