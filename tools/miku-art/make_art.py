# สร้างภาพธีม HATSUNE MIKU (วาดเองด้วย SVG แล้วแปลงเป็น PNG ด้วย Chrome/Edge แบบ headless)
# รัน: python tools/miku-art/make_art.py   (จากโฟลเดอร์หลักของโปรเจกต์)
# ภาพมิกุใช้ภาพทางการจาก img/source/ (piapro.net · Hatsune Miku by Crypton Future Media, INC. 2007 · CC BY-NC 3.0)
import os, subprocess, sys, shutil, tempfile
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'img')
SVG_DIR = os.path.dirname(os.path.abspath(__file__))

BROWSERS = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
]
BROWSER = next((b for b in BROWSERS if os.path.exists(b)), None)

# กลางวัน = มิกุปกติ (มิ้นต์ · เทาเงิน · ชมพู) / กลางคืน = มิกุคอนเสิร์ตกลางคืน (ดำ · ชมพูนีออน · มิ้นต์เรืองแสง)
PAL = {
    'day': dict(hair='#39C5BB', hair2='#86CECB', hairDark='#137A7F', line='#1E3A40', skin='#FFEDE3',
                shirt='#C9D3D9', shirt2='#9FADB6', skirt='#3B4248', trim='#39C5BB', tie='#39C5BB',
                sleeve='#3B4248', boot='#2A2F33', accent='#E12885', eye='#2BB3AA', eye2='#0E6E6A',
                glow='none', note1='#39C5BB', note2='#E12885'),
    'night': dict(hair='#2FD3C7', hair2='#9AF2EA', hairDark='#0C5E62', line='#0B1416', skin='#FBE6DE',
                  shirt='#2A2F36', shirt2='#1A1E23', skirt='#14171B', trim='#FF3FA4', tie='#FF3FA4',
                  sleeve='#14171B', boot='#0D0F12', accent='#FF3FA4', eye='#33E0D3', eye2='#0A6F69',
                  glow='url(#glow)', note1='#FF3FA4', note2='#5CF2E6'),
}


def note(x, y, s, c, line):
    # โน้ตเพลงตัวเขบ็ต 1 ชั้น
    return (f'<g transform="translate({x},{y}) scale({s})" stroke="{line}" stroke-width="4" stroke-linejoin="round">'
            f'<ellipse cx="0" cy="0" rx="17" ry="12" transform="rotate(-25)" fill="{c}"/>'
            f'<path d="M14 -6 V-70 C30 -60 44 -52 46 -30 C38 -44 28 -46 22 -48 V-6 Z" fill="{c}"/></g>')


def stone_svg(p, size=160):
    # "หินเมก้า" เดิม -> คริสตัลโน้ตเพลงของมิกุ
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="{size}" height="{size}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9FFF9"/><stop offset=".5" stop-color="#39C5BB"/><stop offset="1" stop-color="#0E6E6A"/></linearGradient></defs>
<path d="M80 6 L148 70 L80 154 L12 70 Z" fill="url(#g)" stroke="#1E3A40" stroke-width="6" stroke-linejoin="round"/>
<path d="M80 6 L104 70 L80 154 L56 70 Z M12 70 L148 70" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="3"/>
<g transform="translate(70 104) scale(.9)" stroke="#1E3A40" stroke-width="4" stroke-linejoin="round">
<ellipse cx="0" cy="0" rx="17" ry="12" transform="rotate(-25)" fill="#E12885"/><path d="M14 -6 V-70 C30 -60 44 -52 46 -30 C38 -44 28 -46 22 -48 V-6 Z" fill="#E12885"/></g>
</svg>'''


def disc_svg():
    # แผ่นเสียง MIKU DISC (ใช้กับหน้าล็อก / ฉากเปิดแอป: ครึ่งบนยกออกได้)
    grooves = ''.join(f'<circle cx="128" cy="128" r="{r}" fill="none" stroke="#2c3438" stroke-width="1.6"/>' for r in range(56, 116, 7))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
<defs><radialGradient id="v" cx=".5" cy=".5" r=".5"><stop offset=".4" stop-color="#1b2124"/><stop offset="1" stop-color="#0b0f11"/></radialGradient>
<linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#86CECB"/><stop offset="1" stop-color="#139A93"/></linearGradient>
<linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>
<circle cx="128" cy="128" r="120" fill="url(#v)" stroke="#39C5BB" stroke-width="6"/>
{grooves}
<path d="M40 70 A100 100 0 0 1 186 40 L128 128 Z" fill="url(#s)"/>
<circle cx="128" cy="128" r="48" fill="url(#l)" stroke="#E12885" stroke-width="4"/>
<text x="128" y="122" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="15" fill="#ffffff" letter-spacing="1">MIKU</text>
<text x="128" y="152" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="22" fill="#E12885">01</text>
<circle cx="128" cy="128" r="6" fill="#0b0f11"/>
</svg>'''


def cursor_svg():
    # เคอร์เซอร์: ต้นหอม (negi) เล็ก ๆ
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
<g transform="rotate(40 12 12)" stroke="#1E3A40" stroke-width="1.4" stroke-linejoin="round">
<path d="M9.5 22 L14.5 22 L14.2 14 L9.8 14 Z" fill="#FFFFFF"/><path d="M9.8 14 L14.2 14 L14 9 L10 9 Z" fill="#B7E36A"/>
<path d="M10 9.5 C8.6 6 8 4 7.2 1.5 C9.4 3.4 10.8 6 11.4 9 Z" fill="#5DBB3F"/><path d="M12.4 9 C12.8 6 13.8 3.4 15.6 1.4 C15.2 4 14.4 6.4 13.8 9.5 Z" fill="#39C5BB"/></g></svg>'''


def render(svg, w, h, out_png, tmp):
    html = os.path.join(tmp, 'r.html')
    with open(html, 'w', encoding='utf-8') as f:
        f.write('<!doctype html><html><head><style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block}</style></head><body>' + svg + '</body></html>')
    shot = os.path.join(tmp, 'shot.png')
    if os.path.exists(shot):
        os.remove(shot)
    subprocess.run([BROWSER, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    '--default-background-color=00000000', f'--window-size={w},{h}', f'--screenshot={shot}',
                    'file:///' + html.replace('\\', '/')], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    im = Image.open(shot).convert('RGBA').crop((0, 0, w, h))
    im.save(out_png, optimize=True)
    return im


def face(src, box, size):
    return Image.open(src).convert('RGBA').crop(box).resize((size, size), Image.LANCZOS)


def glow(im, rgb, radius):
    # เรืองแสงรอบตัวภาพ (โหมดกลางคืน)
    from PIL import ImageFilter
    pad = radius * 3
    base = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    base.paste(im, (pad, pad), im)
    a = base.split()[3].filter(ImageFilter.GaussianBlur(radius))
    halo = Image.new('RGBA', base.size, rgb + (0,))
    halo.putalpha(a.point(lambda v: min(255, int(v * 1.6))))
    halo.alpha_composite(base)
    return halo


def main():
    if not BROWSER:
        sys.exit('ไม่พบ Chrome/Edge')
    SRC = os.path.join(OUT, 'source')
    full = os.path.join(SRC, 'ch_img_miku.png')      # ภาพทางการ Art by KEI (piapro.net, CC BY-NC 3.0)
    v6 = os.path.join(SRC, 'img_prod_miku-v6.png')  # ภาพกล่อง HATSUNE MIKU V6 (piapro.net)
    im = Image.open(full).convert('RGBA')
    # วางกลางผืนขนาด 890×792 (สัดส่วนเดียวกับที่หน้าเว็บจัดวางไว้) ภาพสูงจะได้ไม่ล้นกรอบ
    def fit(src, W=890, H=792, pad=24):
        k = (H - pad * 2) / src.height
        s2 = src.resize((round(src.width * k), H - pad * 2), Image.LANCZOS)
        cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        cv.alpha_composite(s2, ((W - s2.width) // 2, pad))
        return cv
    fit(im).save(os.path.join(OUT, 'miku-day.png'), optimize=True)
    fit(glow(im, (255, 63, 164), 10), pad=8).save(os.path.join(OUT, 'miku-night.png'), optimize=True)
    kei = (190, 18, 340, 168)
    face(full, kei, 160).save(os.path.join(OUT, 'logo-day.png'), optimize=True)
    face(v6, (222, 72, 382, 232), 160).save(os.path.join(OUT, 'logo-night.png'), optimize=True)
    big = face(full, kei, 256)
    big.resize((64, 64), Image.LANCZOS).save(os.path.join(OUT, 'favicon-miku.png'))
    for s in (16, 32, 48, 128):
        big.resize((s, s), Image.LANCZOS).save(os.path.join(ROOT, 'extension', 'icons', f'icon{s}.png'))
    shutil.copyfile(os.path.join(SRC, 'ch_logo_miku.png'), os.path.join(OUT, 'miku-logo.png'))
    import base64, io
    buf = io.BytesIO(); big.resize((64, 64), Image.LANCZOS).save(buf, 'PNG')
    with open(os.path.join(ROOT, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><!-- Hatsune Miku by Crypton Future Media, INC. 2007 (Art by KEI) --><image width="64" height="64" href="data:image/png;base64,'
                + base64.b64encode(buf.getvalue()).decode() + '"/></svg>')
    tmp = tempfile.mkdtemp(prefix='miku-art-')
    try:
        render(stone_svg(PAL['day']), 160, 160, os.path.join(OUT, 'note-crystal.png'), tmp)
        render(disc_svg(), 256, 256, os.path.join(OUT, 'miku-disc-256.png'), tmp)
        render(cursor_svg(), 24, 24, os.path.join(OUT, 'cursor-negi.png'), tmp)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print('done')


if __name__ == '__main__':
    main()
