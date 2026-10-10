// MIKU ONLINE — ฟีเจอร์ที่ต้องต่ออินเทอร์เน็ต/ส่งข้อมูลออกนอกเครื่อง · ทุกอย่าง "ปิด" ไว้เป็นค่าเริ่มต้น
// เปิดได้ที่เมนู ✦ > 🌐 ออนไลน์ (ทุกข้อจะถามยืนยันพร้อมบอกว่าข้อมูลอะไรส่งไปที่ไหน)
//  1) สภาพอากาศจริง: ส่งพิกัดระดับเมือง (ทศนิยม 2 ตำแหน่ง) ไป api.open-meteo.com (ฟรี ไม่ต้องสมัคร) ทุก 30 นาที
//     → ฝน/แดด/หมอกในแอปตามข้างนอกจริง · ท้องฟ้าเป็นสีทองช่วงพระอาทิตย์ขึ้น/ตก · โหมดอัตโนมัติ (⏱) ใช้เวลาพระอาทิตย์ขึ้น/ตกจริง
//  2) อันดับทีม: ส่งชื่อ/เลเวล/EXP/สถิติโปรดิวเซอร์ (ไม่มีข้อมูลสินค้า) ไปตาราง op_producer ใน Supabase ของระบบ (ต้องรัน supabase/op_producer.sql ก่อน)
//  3) สั่งงานด้วยเสียง: กดปุ่ม 🎙️ หรือปุ่ม V แล้วพูด — เสียงถูกส่งไปบริการแปลงเสียงของเบราว์เซอร์ (Chrome = Google, Edge = Microsoft)
(function () {
  'use strict';

  var KEY = 'mk_online_v1';
  var root = document.documentElement;
  var O = { weather: false, place: 'bkk', lat: null, lon: null, team: false, voice: false, speak: true };
  try { var raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw) for (var k in raw) O[k] = raw[k]; } catch (e) { /* ข้าม */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(O)); } catch (e) { /* ข้าม */ } }
  function toast(m, t) { if (window.fxToast) window.fxToast(m, t || ''); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function ask(msg) { return window.mkConfirm ? window.mkConfirm(msg) : Promise.resolve(window.confirm(msg)); }
  function say(text) {
    if (window.MKBUDDY) window.MKBUDDY.say(text);
    if (O.voice && O.speak && window.speechSynthesis) {
      try {
        var u = new SpeechSynthesisUtterance(text.replace(/[^฀-๿a-zA-Z0-9 .,!?]/g, ' '));
        u.lang = 'th-TH';
        var v = speechSynthesis.getVoices().filter(function (x) { return /^th/i.test(x.lang); })[0];
        if (v) u.voice = v;
        u.rate = 1.05; u.pitch = 1.1;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      } catch (e) { /* ข้าม */ }
    }
  }

  /* ================= 1) สภาพอากาศจริง + พระอาทิตย์ ================= */
  var PLACES = [
    ['bkk', 'กรุงเทพฯ', 13.75, 100.50], ['nbi', 'นนทบุรี', 13.86, 100.51], ['pte', 'ปทุมธานี', 14.02, 100.53], ['spk', 'สมุทรปราการ', 13.60, 100.60],
    ['npt', 'นครปฐม', 13.82, 100.06], ['aya', 'พระนครศรีอยุธยา', 14.35, 100.57], ['cbi', 'ชลบุรี', 13.36, 100.98], ['ryg', 'ระยอง', 12.68, 101.28],
    ['kri', 'กาญจนบุรี', 14.02, 99.53], ['nsn', 'นครสวรรค์', 15.70, 100.14], ['plk', 'พิษณุโลก', 16.82, 100.26], ['cmi', 'เชียงใหม่', 18.79, 98.98],
    ['cri', 'เชียงราย', 19.91, 99.83], ['nma', 'นครราชสีมา', 14.97, 102.10], ['kkn', 'ขอนแก่น', 16.43, 102.83], ['udn', 'อุดรธานี', 17.41, 102.79],
    ['ubn', 'อุบลราชธานี', 15.24, 104.85], ['sni', 'สุราษฎร์ธานี', 9.14, 99.33], ['pkt', 'ภูเก็ต', 7.88, 98.39], ['hdy', 'สงขลา (หาดใหญ่)', 7.01, 100.47]
  ];
  function coords() {
    if (O.place === 'gps' && O.lat !== null) return [O.lat, O.lon, 'ตำแหน่งเครื่อง'];
    var p = PLACES.filter(function (x) { return x[0] === O.place; })[0] || PLACES[0];
    return [p[2], p[3], p[1]];
  }
  function wmo(code, isDay) {
    if (code === 0) return isDay ? 'sun' : 'clear';
    if (code <= 3) return 'clear';
    if (code === 45 || code === 48) return 'fog';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain';
    return 'clear';
  }
  var WNAME = { clear: 'ท้องฟ้าโปร่ง', sun: 'แดดจัด', rain: 'ฝนตก', fog: 'มีหมอก', snow: 'หิมะ', melody: 'ฝนโน้ตเพลง' };
  var wxInfo = null, wxTimer = 0;
  function fetchWeather(announce) {
    if (!O.weather) return;
    var c = coords();
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + c[0].toFixed(2) + '&longitude=' + c[1].toFixed(2) +
      '&current=weather_code,is_day,temperature_2m&daily=sunrise,sunset&timezone=auto&forecast_days=1';
    fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (j) {
      var w = wmo(j.current.weather_code, j.current.is_day === 1);
      var rise = new Date(j.daily.sunrise[0]).getTime(), set = new Date(j.daily.sunset[0]).getTime();
      window.MK_SUN = { rise: rise, set: set };
      wxInfo = { w: w, temp: j.current.temperature_2m, place: c[2], rise: rise, set: set, at: Date.now() };
      if (window.MKWORLD) window.MKWORLD.weather(w, false);
      golden();
      paintPanel();
      if (announce) toast('สภาพอากาศจริงที่' + c[2] + ': ' + WNAME[w] + ' ' + Math.round(wxInfo.temp) + '°C — ท้องฟ้าในแอปเปลี่ยนตามแล้ว', 'success');
    }).catch(function (e) {
      wxInfo = { error: String(e.message || e) };
      paintPanel();
      if (announce) toast('ดึงสภาพอากาศไม่สำเร็จ (ต้องต่ออินเทอร์เน็ต): ' + wxInfo.error, '');
    });
  }
  // แสงทองช่วงพระอาทิตย์ขึ้น/ตก (±50 นาที) ตอนท้องฟ้าโปร่ง
  var goldenOn = false;
  function golden() {
    var S = window.MK_SUN, R = window.MK3D;
    if (!O.weather || !S || !R || !wxInfo || (wxInfo.w !== 'clear' && wxInfo.w !== 'sun')) return;
    var now = Date.now(), near = Math.min(Math.abs(now - S.rise), Math.abs(now - S.set));
    if (near < 50 * 60 * 1000) {
      var amt = 0.45 * (1 - near / (50 * 60 * 1000));
      R.weather = { dens: 0.9, speed: 0.9, tint: [1, 0.55, 0.5], tintAmt: amt };
      goldenOn = true;
    } else if (goldenOn) {
      goldenOn = false;
      if (window.MKWORLD) window.MKWORLD.weather(wxInfo.w, false); // หมดช่วงแสงทอง: กลับท้องฟ้าปกติ
    }
  }
  function startWeather(announce) {
    clearInterval(wxTimer);
    if (!O.weather) { window.MK_SUN = null; return; }
    fetchWeather(announce);
    wxTimer = setInterval(function () { fetchWeather(false); }, 30 * 60 * 1000);
  }
  setInterval(golden, 60 * 1000);

  /* ================= 2) อันดับทีม (Supabase) ================= */
  var sb = null, board = null, boardErr = '', syncTimer = 0;
  function client() {
    if (sb) return sb;
    var c = window.MIKU_CONFIG || {};
    if (!c.supabaseUrl || !c.supabaseKey || !window.supabase || !window.supabase.createClient) return null;
    sb = window.supabase.createClient(c.supabaseUrl, c.supabaseKey);
    return sb;
  }
  function secret() {
    var s = null;
    try { s = localStorage.getItem('mk_producer_secret'); } catch (e) { /* ข้าม */ }
    if (!s) {
      var a = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(a);
      s = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      try { localStorage.setItem('mk_producer_secret', s); } catch (e) { /* ข้าม */ }
    }
    return s;
  }
  function levelOf(exp) { var lv = 1; while (lv < 100 && exp >= 40 + lv * 20) { exp -= 40 + lv * 20; lv++; } return lv; }
  function sync() {
    if (!O.team || !window.MKPRODUCER) return Promise.resolve();
    var c = client(); if (!c) { boardErr = 'ยังเชื่อมต่อ Supabase ไม่ได้'; paintPanel(); return Promise.resolve(); }
    var T = window.MKPRODUCER.state(), d = new Date();
    var today = T.today && T.today.key === d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() ? T.today : { exp: 0, tasks: 0 };
    return c.rpc('op_producer_sync', {
      p_id: T.id, p_secret: secret(), p_name: T.name, p_level: levelOf(T.exp), p_exp: T.exp,
      p_today_exp: today.exp, p_today_tasks: today.tasks,
      p_day: d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2),
      p_streak: T.streak, p_badges: Object.keys(T.badges || {}).length, p_rare: (T.c && T.c.rare) || 0
    }).then(function (r) {
      if (r.error) throw r.error;
      boardErr = '';
      return loadBoard();
    }).catch(function (e) {
      boardErr = /op_producer|function|schema cache|does not exist/i.test(e.message || '') ? 'ยังไม่มีตารางอันดับ — ให้ผู้ดูแลรัน supabase/op_producer.sql ใน Supabase ก่อน' : 'ส่งข้อมูลไม่สำเร็จ: ' + (e.message || e);
      paintPanel();
    });
  }
  function loadBoard() {
    var c = client(); if (!c) return Promise.resolve();
    return c.from('op_producer_board').select('*').order('exp', { ascending: false }).limit(50).then(function (r) {
      if (r.error) throw r.error;
      board = r.data || [];
      paintPanel();
      announceMvp();
    });
  }
  // โปรดิวเซอร์ดีเด่นประจำวัน (EXP วันนี้สูงสุด) — แจ้งวันละครั้ง
  function announceMvp() {
    if (!board || !board.length) return;
    var d = new Date(), day = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var top = board.filter(function (r) { return String(r.day) === day && r.today_exp > 0; }).sort(function (a, b) { return b.today_exp - a.today_exp; })[0];
    if (!top) return;
    var k = 'mk_mvp_' + day + '_' + top.id;
    try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) { return; }
    toast('🏆 โปรดิวเซอร์ดีเด่นวันนี้: ' + top.name + ' (+' + fmt(top.today_exp) + ' EXP)', 'success');
  }
  function startTeam() {
    clearInterval(syncTimer);
    if (!O.team) return;
    sync();
    syncTimer = setInterval(sync, 5 * 60 * 1000);
  }
  window.addEventListener('mk:levelup', function () { if (O.team) setTimeout(sync, 1500); });

  /* ================= 3) สั่งงานด้วยเสียง ================= */
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null, listening = false, mic = null;
  function tab(tool, sun) {
    var b = document.querySelector('.tab[data-tool="' + tool + '"]' + (sun ? '[data-sun-mode="' + sun + '"]' : ''));
    if (b) b.click();
    return !!b;
  }
  var CMDS = [
    [/ไม่เคลื่อนไหว/, function () { return tab('sunTool', 'idle') && 'เปิดหน้าตำแหน่งไม่เคลื่อนไหว'; }],
    [/เคลื่อนไหว/, function () { return tab('sunTool', 'stockin') && 'เปิดหน้าประวัติเคลื่อนไหวสต๊อก'; }],
    [/ขายดี|abc/i, function () { return tab('sunTool', 'best') && 'เปิดหน้าสินค้าขายดี'; }],
    [/สั่งซื้อล่วงหน้า|ใบสั่งซื้อ/, function () { return tab('sunTool', 'purchase') && 'เปิดหน้าใบสั่งซื้อล่วงหน้า'; }],
    [/นำเข้า/, function () { return tab('mergeTool') && 'ไปหน้านำเข้าข้อมูล'; }],
    [/ตรวจ(ออเดอร์|order|สต็อก|สต๊อก)/i, function () { return tab('compareTool') && 'ไปหน้าตรวจ ORDER กับ Stock'; }],
    [/รับ(ออเดอร์|order)/i, function () { return tab('orderTool') && 'ไปหน้ารับ ORDER'; }],
    [/ก่อนสั่ง/, function () { return tab('beforeOrderTool') && 'ไปหน้าก่อนสั่ง'; }],
    [/ใบปริ้น|ใบพิมพ์/, function () { return tab('scanTool') && 'ไปหน้าตรวจใบปริ้น'; }],
    [/สรุปวันนี้|รายงานวันนี้/, function () { if (window.MKPRODUCER) window.MKPRODUCER.daily(true); return 'นี่คือสรุปของวันนี้'; }],
    [/สรุปงาน/, function () { return tab('summaryTool') && 'ไปหน้าสรุปงาน'; }],
    [/บัตรโปรดิวเซอร์|เลเวล/, function () { if (window.MKPRODUCER) window.MKPRODUCER.card(); return 'นี่คือบัตรโปรดิวเซอร์ของเธอ'; }],
    [/อากาศ/, function () { if (window.MKWORLD) window.MKWORLD.cycle(); return 'เปลี่ยนสภาพอากาศแล้ว'; }],
    [/ปิดเพลง/, function () { if (window.MKWORLD && window.MKWORLD.bgmOn()) window.MKWORLD.bgm(); return 'ปิดเพลงแล้ว'; }],
    [/เปิดเพลง|เพลง/, function () { if (window.MKWORLD && !window.MKWORLD.bgmOn()) window.MKWORLD.bgm(); return 'เปิดเพลงแล้ว'; }],
    [/กลางวัน|สว่าง/, function () { var b = document.querySelector('[data-theme-choice="light"]'); if (b) b.click(); return 'ฮัตสึเนะ มิกุ โหมดกลางวัน'; }],
    [/กลางคืน|กลางคืน|มืด/, function () { var b = document.querySelector('[data-theme-choice="dark"]'); if (b) b.click(); return 'มิกุไนท์ไลฟ์ โหมดกลางคืน'; }],
    [/ดราก้อน|แอสเซนต์|beam/i, function () { if (window.MKFX2) window.MKFX2.beam(); return 'ดราก้อนแอสเซนต์!'; }],
    [/^(ค้นหา|หา|เปิด)\s*(sku)?\s*(.+)$/i, function (m) {
      var q = m[3].replace(/\s+/g, '').toUpperCase();
      if (window.MKSKUCARD) window.MKSKUCARD.open(q);
      return 'เปิด MIKU CARD ของ ' + q;
    }]
  ];
  function run(text) {
    var t = String(text || '').trim().replace(/^(มิกุ|miku|มิกุ|miku)\s*/i, '');
    var flat = t.replace(/\s+/g, '');
    for (var i = 0; i < CMDS.length; i++) {
      var m = CMDS[i][0].exec(i === CMDS.length - 1 ? t : flat);
      if (m) { var r = CMDS[i][1](m); if (r) { say(r); if (window.MKSTAGE) window.MKSTAGE.sfx('ok'); return; } }
    }
    say('ยังไม่เข้าใจคำสั่ง "' + t + '" ลองพูดว่า ไปหน้ารับออเดอร์ หรือ สรุปวันนี้');
  }
  function listen() {
    if (!O.voice) return;
    if (!Rec) { toast('เบราว์เซอร์นี้ไม่รองรับการสั่งด้วยเสียง (ใช้ Chrome หรือ Edge)', ''); return; }
    if (listening && rec) { rec.stop(); return; }
    rec = new Rec();
    rec.lang = 'th-TH';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = function () { listening = true; paintMic(); if (window.MKBUDDY) window.MKBUDDY.say('🎙️ ฟังอยู่… พูดได้เลย'); };
    rec.onresult = function (e) { var t = e.results[0][0].transcript; toast('🎙️ "' + t + '"', ''); run(t); };
    rec.onerror = function (e) { if (e.error !== 'no-speech' && e.error !== 'aborted') toast('สั่งด้วยเสียงไม่สำเร็จ: ' + e.error + (e.error === 'network' ? ' (ต้องต่ออินเทอร์เน็ต)' : e.error === 'not-allowed' ? ' (ยังไม่อนุญาตไมโครโฟน)' : ''), ''); };
    rec.onend = function () { listening = false; paintMic(); };
    try { rec.start(); } catch (e) { /* ข้าม */ }
  }
  function paintMic() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (O.voice && !mic && bar) {
      mic = document.createElement('button');
      mic.type = 'button'; mic.id = 'mkMicBtn'; mic.className = 'mk-fx-toggle mk-sound-toggle mk-mic';
      mic.title = 'สั่งงานด้วยเสียง (V)';
      mic.textContent = '🎙️';
      mic.addEventListener('click', listen);
      bar.insertBefore(mic, bar.querySelector('.theme-switch'));
    }
    if (mic) { mic.style.display = O.voice ? '' : 'none'; mic.classList.toggle('is-live', listening); }
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if ((window.MK_MIDWORD && window.MK_MIDWORD()) || !O.voice || e.ctrlKey || e.metaKey || e.altKey || (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)))) return;
    if (e.key === 'v' || e.key === 'V') listen();
  });

  /* ================= แผงตั้งค่า 🌐 ออนไลน์ ================= */
  var panel = null;
  function row(id, title, on, body) {
    return '<section class="mk-on-sec"><label class="mk-on-row"><span class="mk-on-sw"><input type="checkbox" data-k="' + id + '"' + (on ? ' checked' : '') + '><i></i></span><b>' + title + '</b></label>' + body + '</section>';
  }
  function paintPanel() {
    if (!panel) return;
    var c = coords();
    var wx = !O.weather ? '' : wxInfo && wxInfo.error ? '<p class="mk-on-st err">⚠️ ' + esc(wxInfo.error) + '</p>'
      : wxInfo ? '<p class="mk-on-st">ตอนนี้ที่' + esc(wxInfo.place) + ': <b>' + WNAME[wxInfo.w] + ' ' + Math.round(wxInfo.temp) + '°C</b> · พระอาทิตย์ขึ้น ' +
        new Date(wxInfo.rise).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' ตก ' + new Date(wxInfo.set).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + '</p>'
      : '<p class="mk-on-st">กำลังดึงข้อมูล…</p>';
    var opts = PLACES.map(function (p) { return '<option value="' + p[0] + '"' + (O.place === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') +
      '<option value="gps"' + (O.place === 'gps' ? ' selected' : '') + '>📍 ตำแหน่งเครื่อง' + (O.lat !== null ? ' (' + O.lat + ', ' + O.lon + ')' : '') + '</option>';
    var me = window.MKPRODUCER ? window.MKPRODUCER.state().id : '';
    var d = new Date(), day = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var tb = '';
    if (O.team) {
      if (boardErr) tb = '<p class="mk-on-st err">⚠️ ' + esc(boardErr) + '</p>';
      else if (!board) tb = '<p class="mk-on-st">กำลังโหลดอันดับ…</p>';
      else {
        var todays = board.filter(function (r) { return String(r.day) === day; }).sort(function (a, b) { return b.today_exp - a.today_exp; }).slice(0, 5);
        tb = '<div class="mk-on-board"><div><h4>🏆 รวมตลอดกาล</h4><ol>' + board.slice(0, 10).map(function (r) {
          return '<li' + (r.id === me ? ' class="is-me"' : '') + '><span>' + esc(r.name) + '</span><b>Lv.' + r.level + '</b><small>' + fmt(r.exp) + ' EXP</small></li>';
        }).join('') + '</ol></div><div><h4>🔥 วันนี้</h4><ol>' + (todays.length ? todays.map(function (r) {
          return '<li' + (r.id === me ? ' class="is-me"' : '') + '><span>' + esc(r.name) + '</span><b>+' + fmt(r.today_exp) + '</b><small>' + fmt(r.today_tasks) + ' งาน</small></li>';
        }).join('') : '<li class="mk-on-empty">ยังไม่มีใครเริ่มงานวันนี้</li>') + '</ol></div></div>';
      }
    }
    panel.querySelector('.mk-on-list').innerHTML =
      row('weather', '🌦️ สภาพอากาศจริง + พระอาทิตย์ขึ้น/ตก', O.weather,
        '<p class="mk-on-why">ส่งพิกัดระดับเมืองไปที่ <code>api.open-meteo.com</code> ทุก 30 นาที (ไม่ต้องสมัคร ไม่ส่งข้อมูลอื่น)</p>' +
        '<label class="mk-on-place">พื้นที่ <select data-k="place">' + opts + '</select></label>' + wx) +
      row('team', '🏆 อันดับทีม', O.team,
        '<p class="mk-on-why">ส่ง <b>ชื่อโปรดิวเซอร์ เลเวล EXP งานวันนี้ วันทำงานติดกัน จำนวนเหรียญ/กลางคืน</b> ไปตาราง <code>op_producer</code> ใน Supabase ของระบบ ทุก 5 นาที (ไม่มีข้อมูลสินค้า/ORDER) · ต้องรัน <code>supabase/op_producer.sql</code> ก่อน · ปิดแล้วเลือกลบข้อมูลของตัวเองได้</p>' + tb) +
      row('voice', '🎙️ สั่งงานด้วยเสียง', O.voice,
        '<p class="mk-on-why">กดปุ่ม 🎙️ หรือปุ่ม <b>V</b> แล้วพูด เช่น "ไปหน้ารับออเดอร์", "สรุปวันนี้", "ค้นหา ABC123", "เปิดเพลง" — เสียงจะถูกส่งไปบริการแปลงเสียงของเบราว์เซอร์ (Chrome = Google, Edge = Microsoft) เฉพาะตอนกดฟัง</p>' +
        (O.voice ? '<label class="mk-on-place"><input type="checkbox" data-k="speak"' + (O.speak ? ' checked' : '') + '> ให้ MIKU พูดตอบ (ใช้เสียงภาษาไทยในเครื่อง)</label>' : '') +
        (!Rec ? '<p class="mk-on-st err">⚠️ เบราว์เซอร์นี้ไม่รองรับ (ใช้ Chrome หรือ Edge)</p>' : ''));
  }
  function openPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.className = 'mk-tc-ov mk-on-ov';
    panel.innerHTML = '<div class="mk-tc mk-on" role="dialog" aria-label="ฟีเจอร์ออนไลน์"><div class="mk-tc-head"><b>ONLINE</b><span>ทุกข้อปิดไว้ก่อน · เปิดเฉพาะที่ต้องการ</span><button type="button" class="mk-tc-x" aria-label="ปิด">×</button></div><div class="mk-on-list"></div><div class="mk-tc-foot"><button type="button" class="mk-tc-close">ปิด</button></div></div>';
    document.body.appendChild(panel);
    paintPanel();
    if (O.team) loadBoard().catch(function () { /* แสดงใน paintPanel แล้ว */ });
    var close = function () { if (!panel) return; var p = panel; panel = null; p.classList.add('is-out'); setTimeout(function () { p.remove(); }, 250); document.removeEventListener('keydown', onEsc, true); };
    function onEsc(e) { if (e.key === 'Escape' && !document.querySelector('.mk-ask')) { e.stopPropagation(); close(); } }
    document.addEventListener('keydown', onEsc, true);
    panel.addEventListener('click', function (e) { if (e.target === panel || e.target.closest('.mk-tc-x, .mk-tc-close')) close(); });
    panel.addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-k');
      if (!k) return;
      if (k === 'place') {
        var v = e.target.value;
        if (v === 'gps') {
          if (!navigator.geolocation) { toast('เครื่องนี้หาตำแหน่งไม่ได้', ''); paintPanel(); return; }
          navigator.geolocation.getCurrentPosition(function (p) {
            O.place = 'gps'; O.lat = Math.round(p.coords.latitude * 100) / 100; O.lon = Math.round(p.coords.longitude * 100) / 100; save(); startWeather(true); paintPanel();
          }, function () { toast('ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง — เลือกจังหวัดจากรายการแทนได้', ''); paintPanel(); }, { timeout: 10000, maximumAge: 3600000 });
          return;
        }
        O.place = v; save(); startWeather(true); paintPanel();
        return;
      }
      if (k === 'speak') { O.speak = e.target.checked; save(); return; }
      var on = e.target.checked;
      if (!on) {
        O[k] = false; save();
        if (k === 'weather') { startWeather(false); if (window.MKWORLD) window.MKWORLD.weather(window.MKWORLD.current(), false); }
        if (k === 'team') {
          startTeam();
          ask('ลบข้อมูลอันดับของคุณออกจากตาราง op_producer ด้วยไหม?').then(function (yes) {
            var c = client();
            if (yes && c && window.MKPRODUCER) c.rpc('op_producer_leave', { p_id: window.MKPRODUCER.state().id, p_secret: secret() }).then(function (r) { toast(r.error ? 'ลบไม่สำเร็จ: ' + r.error.message : 'ลบข้อมูลอันดับของคุณแล้ว', r.error ? '' : 'success'); });
          });
        }
        if (k === 'voice') { if (rec) try { rec.abort(); } catch (er) { /* ข้าม */ } paintMic(); }
        paintPanel();
        return;
      }
      e.target.checked = false;
      var msg = {
        weather: 'เปิดสภาพอากาศจริง?\n\nจะส่งพิกัดระดับเมือง (' + coords()[2] + ') ไปที่ api.open-meteo.com ทุก 30 นาที เพื่อดึงสภาพอากาศและเวลาพระอาทิตย์ขึ้น/ตก',
        team: 'เปิดอันดับทีม?\n\nจะส่งชื่อโปรดิวเซอร์ เลเวล EXP งานวันนี้ วันทำงานติดกัน จำนวนเหรียญ/กลางคืน ไปตาราง op_producer ใน Supabase ของระบบ ทุก 5 นาที ทุกคนในทีมจะเห็นข้อมูลนี้\n(ควรตกลงกับทีมก่อน)',
        voice: 'เปิดสั่งงานด้วยเสียง?\n\nตอนกดปุ่มฟัง เสียงพูดจะถูกส่งไปบริการแปลงเสียงของเบราว์เซอร์ (Chrome = Google, Edge = Microsoft) และเบราว์เซอร์จะขออนุญาตใช้ไมโครโฟน'
      }[k];
      ask(msg).then(function (yes) {
        if (!yes) return;
        O[k] = true; save();
        if (k === 'weather') startWeather(true);
        if (k === 'team') startTeam();
        if (k === 'voice') { paintMic(); toast('เปิดสั่งงานด้วยเสียงแล้ว — กด 🎙️ หรือปุ่ม V แล้วพูดได้เลย', 'success'); }
        paintPanel();
      });
    });
  }

  function addButton() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.getElementById('mkOnlineBtn')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'mkOnlineBtn'; b.className = 'mk-fx-toggle mk-sound-toggle';
    b.textContent = '🌐';
    b.setAttribute('aria-pressed', String(O.weather || O.team || O.voice));
    b.addEventListener('click', openPanel);
    bar.appendChild(b);
  }

  function init() {
    addButton();
    paintMic();
    startWeather(false);
    startTeam();
    window.MKONLINE = { open: openPanel, run: run, sync: sync };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
