# MIKU — ตั้งค่าระบบให้แยกจาก ORDER Workspace

โฟลเดอร์นี้เป็นสำเนาของ `ORDOR-main` ที่ทำให้ **แยกระบบได้จริง** ไม่ใช้ฐานข้อมูล/ที่เก็บข้อมูลชุดเดียวกัน

## สิ่งที่แยกแล้ว (ในโค้ด)
| ส่วน | ORDER Workspace | MIKU |
|---|---|---|
| ธีม/ชื่อ/ไอคอน | น้ำเงิน, ORDER Workspace | เขียวมรกต+ทอง, MIKU (`css/miku.css`, `favicon.svg`) |
| localStorage ในเบราว์เซอร์ | คีย์เดิม | ขึ้นต้น `miku:` (`js/mk-storage.js`) |
| IndexedDB (ไฟล์ที่เคยใช้/ใบปริ้น) | `order_ws_v1` | `miku_ws_v1` |
| ข้อความระหว่างหน้าเว็บ↔ส่วนขยาย | `order-workspace` / `stock-sync` / `order-autoload` | `miku-page` / `miku-sync` / `miku-autoload` |
| แอตทริบิวต์ตรวจส่วนขยาย | `data-stock-sync` | `data-miku-sync` |
| Supabase | โปรเจกต์เดิม | **ใช้ฐานข้อมูลชุดเดิมร่วมกัน** (ตั้งใน `js/mk-config.js` และ `stock-sync-extension/mk-config.js`) |

> ตอนนี้ MIKU ชี้ไปฐานข้อมูลชุดเดิม จึงอ่าน/อัปโหลดข้อมูลชุดเดียวกับ ORDER Workspace (อัปโหลดจากฝั่งไหนก็เขียนทับตารางเดียวกัน และโควตา 1 ครั้ง/วันนับร่วมกัน) ขั้นตอนด้านล่างใช้เฉพาะตอนจะแยกฐานข้อมูลภายหลัง
> ถ้าล้างค่าทั้งสองไฟล์ให้ว่าง ฟังก์ชันที่ใช้ฐานข้อมูลจะไม่ทำงาน และมีแถบเหลืองเตือนที่ล่างหน้าเว็บ

## ขั้นตอน
1. สร้างโปรเจกต์ Supabase ใหม่ (supabase.com > New project)
2. เปิด **SQL Editor** แล้วรันไฟล์ในโฟลเดอร์ `supabase/` ตามลำดับนี้ (รันทีละไฟล์ รอให้ขึ้นสำเร็จก่อนไฟล์ถัดไป)
   1. `op_setup.sql` — **แก้ `CHANGE_ME` ท้ายไฟล์เป็นรหัสอัปโหลดก่อนรัน** (ห้ามรันไฟล์นี้ซ้ำภายหลัง)
   2. `op_append.sql`
   3. `op_com_recalc.sql`
   4. `op_front_sale.sql`
   5. `op_com_carry.sql`
   6. `op_com_increment.sql`
   7. `op_com_read.sql`
   8. `op_pick_log.sql`
   9. `op_share.sql` — ที่เก็บใบปริ้น/ไฟล์ร่วมกันทุกเครื่อง (สร้าง bucket `op-share`)
   10. `op_st_noon_reset.sql` — ST รีเซ็ตโควตาตอน 12:00 (ต้องเปิด pg_cron)
   11. (ถ้าไม่อยากพิมพ์รหัสอัปโหลด) `op_no_passcode.sql`
3. คัดลอก **Project URL** และ **publishable/anon key** จาก Project Settings > API
4. ใส่ค่าในสองไฟล์ (ค่าชุดเดียวกัน):
   - `js/mk-config.js`
   - `stock-sync-extension/mk-config.js`
5. โหลดส่วนขยายเข้า Chrome: `chrome://extensions` > Developer mode > Load unpacked > เลือก `stock-sync-extension` ของโฟลเดอร์นี้
   (ชื่อส่วนขยายคือ "MIKU" แยกจากของ ORDER Workspace ติดตั้งคู่กันได้)
6. ที่อยู่เว็บที่ส่วนขยายจะทำงานด้วย: `https://bctgamer100-web.github.io/miku/*`, `http://localhost/*`, `file:///*`
   ถ้าโฮสต์ที่อื่น ให้แก้ `matches` ใน `stock-sync-extension/manifest.json` และ `ORDER_PAGE_URLS` ใน `stock-sync-extension/background.js`

## ที่ยังใช้ร่วมกับ ORDER Workspace
- บัญชี BigSeller และลิงก์ไฟล์ส่งออก (`…myqcloud.com/temp/…`) เป็นของ BigSeller ตัวเดียวกัน
- ชื่อไฟล์ชุดโค้ด `OrderWorkspace.exe` ใน `installer/` ยังเป็นชื่อเดิม (ยังไม่ได้เปลี่ยน)
