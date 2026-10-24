#!/usr/bin/env python3
"""Generates an animated cyberpunk city SVG (pure SVG + CSS/SMIL, no scripts)."""
import random
import sys

random.seed(2077)
W, H = 1600, 900
BASE = 800  # street line

CYAN, MAGENTA, PINK, PURPLE, YELLOW, TEAL, ORANGE = (
    "#00f0ff", "#ff2bd6", "#ff3864", "#9d4dff", "#ffd23f", "#2de2e6", "#ff8a3d")

out = []
a = out.append


def r(lo, hi):
    return random.uniform(lo, hi)


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


# ---------------------------------------------------------------- header / defs
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
  'preserveAspectRatio="xMidYMid slice">')
a('<title>Neon Rain — an animated cyberpunk city</title>')
a("""<style>
.tw{animation:tw 3s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.15}50%{opacity:1}}
.fl{animation:fl 5s steps(1,end) infinite}
@keyframes fl{0%{opacity:1}41%{opacity:1}42%{opacity:.15}43%{opacity:1}45%{opacity:.25}46%{opacity:1}78%{opacity:1}79%{opacity:.1}82%{opacity:1}}
.fl2{animation:fl2 7s steps(1,end) infinite}
@keyframes fl2{0%{opacity:1}12%{opacity:1}13%{opacity:.2}14%{opacity:1}60%{opacity:1}61%{opacity:.3}62%{opacity:.9}63%{opacity:.2}66%{opacity:1}}
.won{animation:won 11s steps(1,end) infinite}
@keyframes won{0%{opacity:0}30%{opacity:1}85%{opacity:0}}
.blink{animation:blink 1.8s steps(1,end) infinite}
@keyframes blink{0%{opacity:1}50%{opacity:.05}}
.rain{animation:rain .55s linear infinite}
.rain2{animation:rain .8s linear infinite}
@keyframes rain{from{transform:translateY(-900px)}to{transform:translateY(0)}}
.drift{animation:drift 70s linear infinite}
@keyframes drift{from{transform:translateX(0)}to{transform:translateX(-1600px)}}
.drift2{animation:drift 110s linear infinite}
.steam{animation:steam 6s ease-out infinite;opacity:0}
@keyframes steam{0%{transform:translate(0,0) scale(.4);opacity:0}15%{opacity:.35}100%{transform:translate(-30px,-160px) scale(1.8);opacity:0}}
.run{animation:run 3s linear infinite}
@keyframes run{from{stroke-dashoffset:0}to{stroke-dashoffset:-400}}
.shim{animation:shim 2.6s ease-in-out infinite}
@keyframes shim{0%,100%{opacity:.25;transform:scaleX(1)}50%{opacity:.5;transform:scaleX(1.06)}}
.gl1{animation:gl1 3.2s steps(1,end) infinite}
@keyframes gl1{0%{transform:translate(0,0)}88%{transform:translate(0,0)}89%{transform:translate(-6px,1px)}91%{transform:translate(4px,-1px)}93%{transform:translate(0,0)}}
.gl2{animation:gl2 3.2s steps(1,end) infinite}
@keyframes gl2{0%{transform:translate(0,0)}88%{transform:translate(0,0)}89%{transform:translate(6px,-1px)}91%{transform:translate(-4px,1px)}93%{transform:translate(0,0)}}
.scan{animation:scan 7s linear infinite}
@keyframes scan{from{transform:translateY(-120px)}to{transform:translateY(1000px)}}
.ticker{animation:ticker 14s linear infinite}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-640px)}}
.pulse{animation:pulse 4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.55}50%{opacity:1}}
text{font-family:'Courier New',Consolas,monospace;font-weight:700}
.jp{font-family:'Hiragino Kaku Gothic Pro','Yu Gothic','Noto Sans CJK JP','Noto Sans JP','MS Gothic',sans-serif;font-weight:900}
</style>""")

a("<defs>")
a(f"""<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#05010f"/><stop offset=".45" stop-color="#1a0638"/>
  <stop offset=".75" stop-color="#4b0f5e"/><stop offset="1" stop-color="#b0206e"/></linearGradient>
<radialGradient id="horizon" cx=".5" cy="1" r=".7">
  <stop offset="0" stop-color="{MAGENTA}" stop-opacity=".55"/><stop offset=".5" stop-color="{PURPLE}" stop-opacity=".18"/>
  <stop offset="1" stop-color="{PURPLE}" stop-opacity="0"/></radialGradient>
<linearGradient id="moonG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#ffe46b"/><stop offset=".45" stop-color="#ff7a59"/><stop offset="1" stop-color="#ff1f8e"/></linearGradient>
<radialGradient id="moonHalo"><stop offset=".4" stop-color="#ff4fa3" stop-opacity=".45"/><stop offset="1" stop-color="#ff4fa3" stop-opacity="0"/></radialGradient>
<mask id="moonCut"><rect x="0" y="0" width="{W}" height="{H}" fill="#fff"/>""")
for i in range(9):
    y = 330 + i * 18
    a(f'<rect x="800" y="{y}" width="600" height="{2 + i * 1.4:.1f}" fill="#000"/>')
a(f"""</mask>
<linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#bff8ff" stop-opacity=".38"/><stop offset="1" stop-color="#bff8ff" stop-opacity="0"/></linearGradient>
<linearGradient id="beamP" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#ff9bf0" stop-opacity=".32"/><stop offset="1" stop-color="#ff9bf0" stop-opacity="0"/></linearGradient>
<linearGradient id="farB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1563"/><stop offset="1" stop-color="#5a1a6e"/></linearGradient>
<linearGradient id="midB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0a3a"/><stop offset="1" stop-color="#2c0c45"/></linearGradient>
<linearGradient id="nearB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0520"/><stop offset="1" stop-color="#07020f"/></linearGradient>
<linearGradient id="tower" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#120628"/><stop offset=".5" stop-color="#26104a"/><stop offset="1" stop-color="#0b0418"/></linearGradient>
<linearGradient id="street" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1a0a2e"/><stop offset="1" stop-color="#040108"/></linearGradient>
<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#c03fae" stop-opacity="0"/><stop offset=".6" stop-color="#c03fae" stop-opacity=".22"/>
  <stop offset="1" stop-color="#5a1a7a" stop-opacity=".05"/></linearGradient>
<linearGradient id="trailC" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="{CYAN}" stop-opacity="0"/><stop offset="1" stop-color="{CYAN}" stop-opacity=".85"/></linearGradient>
<linearGradient id="trailP" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="{PINK}" stop-opacity="0"/><stop offset="1" stop-color="{PINK}" stop-opacity=".85"/></linearGradient>
<linearGradient id="trailY" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="{YELLOW}" stop-opacity="0"/><stop offset="1" stop-color="{YELLOW}" stop-opacity=".85"/></linearGradient>
<linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ff2bd6" stop-opacity=".85"/><stop offset=".5" stop-color="#6a2cff" stop-opacity=".75"/>
  <stop offset="1" stop-color="#00f0ff" stop-opacity=".85"/>
  <animate attributeName="x1" values="0;1;0" dur="9s" repeatCount="indefinite"/></linearGradient>
<linearGradient id="scanBar" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="vignette" cx=".5" cy=".5" r=".75">
  <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>
<radialGradient id="holo"><stop offset="0" stop-color="{CYAN}" stop-opacity=".5"/><stop offset="1" stop-color="{CYAN}" stop-opacity="0"/></radialGradient>
<pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".22"/></pattern>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="glowS" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="blur20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
<clipPath id="blimpScreen"><rect x="-70" y="-12" width="140" height="24" rx="3"/></clipPath>
<clipPath id="towerScreen"><rect x="712" y="300" width="96" height="150"/></clipPath>
""")
# flying car shapes (pointing +x)
for cid, col, trail in (("carC", CYAN, "trailC"), ("carP", PINK, "trailP"), ("carY", YELLOW, "trailY")):
    a(f"""<g id="{cid}">
  <rect x="-150" y="-1.5" width="150" height="3" fill="url(#{trail})"/>
  <path d="M-22,-4 Q-18,-11 -4,-11 L10,-10 Q22,-8 24,-2 L24,3 Q22,6 14,6 L-20,6 Q-26,5 -26,1 Z" fill="#150a26" stroke="{col}" stroke-width="1.2"/>
  <path d="M-12,-9 L6,-9 L12,-4 L-14,-4 Z" fill="{col}" opacity=".55"/>
  <rect x="-24" y="6" width="44" height="2" fill="{col}" opacity=".9" filter="url(#glowS)"/>
  <circle cx="23" cy="0" r="2.4" fill="#fff" filter="url(#glowS)"/>
  <circle cx="-25" cy="1" r="2" fill="#ff1a3c" filter="url(#glowS)"/>
</g>""")
a("</defs>")

# ---------------------------------------------------------------- sky
a(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
a('<g fill="#fff">')
for _ in range(140):
    x, y, rad = r(0, W), r(0, 480), r(.4, 1.5)
    if random.random() < .45:
        a(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(rad)}" class="tw" style="animation-delay:-{f(r(0, 3))}s;animation-duration:{f(r(2, 5))}s"/>')
    else:
        a(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(rad * .8)}" opacity="{f(r(.2, .7))}"/>')
a("</g>")

# moon / sun disc
a('<circle cx="1100" cy="330" r="300" fill="url(#moonHalo)" class="pulse"/>')
a('<circle cx="1100" cy="330" r="165" fill="url(#moonG)" mask="url(#moonCut)" opacity=".95"/>')
a(f'<rect x="0" y="380" width="{W}" height="520" fill="url(#horizon)"/>')

# drifting cloud bands
for cls, op, ys in (("drift2", .25, (170, 240, 300)), ("drift", .3, (380, 430))):
    a(f'<g class="{cls}" opacity="{op}" filter="url(#blur20)">')
    for y in ys:
        for rep in (0, W):
            for _ in range(3):
                a(f'<ellipse cx="{f(r(0, W) + rep)}" cy="{f(y + r(-15, 15))}" rx="{f(r(160, 320))}" ry="{f(r(10, 22))}" fill="#e05ac0"/>')
    a("</g>")

# searchlights
for x, grad, dur, delay, swing in ((420, "beam", 13, 0, 28), (980, "beamP", 17, -6, 22), (1380, "beam", 11, -3, 30)):
    a(f'<g transform="translate({x},{BASE})"><polygon points="-8,0 -70,-950 70,-950 8,0" fill="url(#{grad})">'
      f'<animateTransform attributeName="transform" type="rotate" values="-{swing};{swing};-{swing}" dur="{dur}s" begin="{delay}s" '
      'repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/></polygon></g>')


# ---------------------------------------------------------------- skyline helper
def skyline(x0, x1, hmin, hmax, wmin, wmax, fill, prob, colors, ww, wh, sx, sy, flick, opacity=1.0,
            antenna=0.0, rim=None, base=BASE):
    bld, lit, flk, ant, rims = [], {c: [] for c in colors}, [], [], []
    x = x0
    while x < x1:
        w = random.randint(wmin, wmax)
        h = random.randint(hmin, hmax)
        top = base - h
        bld.append(f'<rect x="{x}" y="{top}" width="{w}" height="{h + 40}"/>')
        roof = top
        if random.random() < .35:
            sw = int(w * r(.4, .7))
            sh = random.randint(12, 50)
            bld.append(f'<rect x="{x + (w - sw) // 2}" y="{top - sh}" width="{sw}" height="{sh + 1}"/>')
            roof = top - sh
        if random.random() < antenna:
            ax = x + w // 2 + random.randint(-w // 4, w // 4)
            ah = random.randint(20, 70)
            bld.append(f'<rect x="{ax - 1}" y="{roof - ah}" width="2" height="{ah}"/>')
            ant.append(f'<circle cx="{ax}" cy="{roof - ah}" r="2.4" fill="#ff2340" class="blink" '
                       f'style="animation-delay:-{f(r(0, 1.8))}s"/>')
        if rim and random.random() < .6:
            c = random.choice(rim)
            rims.append(f'<path d="M{x},{top + h * .55:.0f} V{top} H{x + w}" fill="none" stroke="{c}" stroke-width="1.4" opacity=".75"/>')
        style = random.random()
        if style < .22:  # horizontal light bands
            c = random.choice(colors)
            for yy in range(top + 14, base - 10, random.randint(16, 26)):
                if random.random() < .7:
                    lit[c].append(f'<rect x="{x + 4}" y="{yy}" width="{w - 8}" height="{max(2, wh // 2)}" opacity="{f(r(.35, .8))}"/>')
        else:
            c_main = random.choice(colors)
            p = prob * r(.5, 1.5)
            for yy in range(top + 8, base - 8, sy):
                for xx in range(x + 5, x + w - ww - 3, sx):
                    if random.random() < p:
                        c = c_main if random.random() < .8 else random.choice(colors)
                        rect = f'<rect x="{xx}" y="{yy}" width="{ww}" height="{wh}"'
                        if random.random() < flick:
                            cls = random.choice(("fl", "fl2", "won"))
                            flk.append(f'{rect} fill="{c}" class="{cls}" style="animation-delay:-{f(r(0, 11))}s"/>')
                        else:
                            lit[c].append(f'{rect} opacity="{f(r(.55, 1))}"/>')
        x += w + random.randint(-8, 3)
    a(f'<g opacity="{opacity}">')
    a(f'<g fill="{fill}">' + "".join(bld) + "</g>")
    for c, items in lit.items():
        if items:
            a(f'<g fill="{c}">' + "".join(items) + "</g>")
    a("".join(flk) + "".join(rims) + "".join(ant))
    a("</g>")


WIN_DIM = ["#ff7ad9", "#8f6bff", "#5fd8ff"]
WIN_MID = [CYAN, MAGENTA, YELLOW, "#b48cff"]

# far skyline
skyline(-20, W + 20, 120, 330, 30, 70, "url(#farB)", .16, WIN_DIM, 2, 3, 7, 9, .02, opacity=.9, antenna=.35)

# blimp (behind mid layer)
a('<g><animateTransform attributeName="transform" type="translate" values="1850 190;-250 230" dur="75s" begin="-30s" repeatCount="indefinite"/>')
a('<polygon points="-30,22 30,22 90,330 -90,330" fill="url(#beamP)" opacity=".5"/>')
a('<ellipse cx="0" cy="0" rx="120" ry="34" fill="#1b0b30" stroke="#ff2bd6" stroke-width="1.2"/>')
a('<path d="M95,-6 L135,-30 L130,0 L135,30 L95,6 Z" fill="#160826" stroke="#ff2bd6" stroke-width="1"/>')
a('<rect x="-26" y="28" width="52" height="12" rx="4" fill="#120620" stroke="#00f0ff" stroke-width="1"/>')
a('<g clip-path="url(#blimpScreen)"><rect x="-70" y="-12" width="140" height="24" fill="#0a0315"/>')
a('<g class="ticker"><text x="-60" y="6" font-size="15" fill="#00f0ff" filter="url(#glowS)">'
  'UPGRADE YOUR BODY // 夢を買え // NEW FLESH 2.0 // UPGRADE YOUR BODY // 夢を買え // NEW FLESH 2.0 //</text></g></g>')
a('<rect x="-70" y="-12" width="140" height="24" rx="3" fill="none" stroke="#ff2bd6" stroke-width="1.2" filter="url(#glowS)" class="fl2"/>')
a('<circle cx="-118" cy="0" r="2.5" fill="#ff2340" class="blink"/><circle cx="0" cy="-34" r="2" fill="#00f0ff" class="blink" style="animation-delay:-.9s"/>')
a("</g>")

# distant flying cars (small)
def car(car_id, path, dur, begin, scale, opacity=1.0):
    a(f'<g opacity="{opacity}"><g><animateMotion path="{path}" dur="{dur}s" begin="{begin}s" repeatCount="indefinite" rotate="auto"/>'
      f'<use href="#{car_id}" transform="scale({scale})"/></g></g>')


lanes_far = [
    ("carC", "M-200,360 C300,340 900,380 1800,350", 22, -3),
    ("carP", "M1800,330 C1200,350 500,320 -200,345", 26, -14),
    ("carY", "M-200,395 C500,385 1100,410 1800,390", 19, -9),
    ("carC", "M1800,410 C1100,400 400,420 -200,405", 24, -18),
]
for cid, p, d, b in lanes_far:
    car(cid, p, d, b, .35, .8)

# mid skyline
skyline(-30, W + 30, 180, 470, 50, 110, "url(#midB)", .26, WIN_MID, 4, 5, 10, 13, .06, antenna=.3,
        rim=[CYAN, MAGENTA, PURPLE])

# ---------------------------------------------------------------- megatower
TX, TW, TTOP = 700, 120, 150
a('<g>')
a(f'<polygon points="{TX + 40},{TTOP - 60} {TX + 80},{TTOP - 60} {TX + 70},{TTOP} {TX + 50},{TTOP}" fill="#140728"/>')
a(f'<rect x="{TX + 58}" y="{TTOP - 150}" width="4" height="92" fill="#140728"/>')
a(f'<circle cx="{TX + 60}" cy="{TTOP - 152}" r="4" fill="#ff2340" class="blink" filter="url(#glowS)"/>')
a(f'<polygon points="{TX},{BASE + 20} {TX},{TTOP + 40} {TX + 20},{TTOP} {TX + TW - 20},{TTOP} {TX + TW},{TTOP + 40} {TX + TW},{BASE + 20}" fill="url(#tower)"/>')
# running edge lights
for x1 in (TX + 3, TX + TW - 3):
    a(f'<line x1="{x1}" y1="{BASE}" x2="{x1}" y2="{TTOP + 42}" stroke="{CYAN}" stroke-width="2" stroke-dasharray="60 340" class="run" filter="url(#glowS)"/>')
    a(f'<line x1="{x1}" y1="{BASE}" x2="{x1}" y2="{TTOP + 42}" stroke="{CYAN}" stroke-width="1" opacity=".25"/>')
a(f'<path d="M{TX + 20},{TTOP} H{TX + TW - 20}" stroke="{MAGENTA}" stroke-width="2.5" filter="url(#glow)" class="fl"/>')
# tower floors
a(f'<g fill="#6a3fd0" opacity=".45">')
for yy in range(TTOP + 60, BASE, 9):
    if not (295 <= yy <= 455):
        a(f'<rect x="{TX + 10}" y="{yy}" width="{TW - 20}" height="2"/>')
a("</g>")
# giant ad screen on the tower
a(f'<rect x="{TX + 12}" y="300" width="96" height="150" fill="#0a0316"/>')
a('<g clip-path="url(#towerScreen)">')
a(f'<rect x="{TX + 12}" y="300" width="96" height="150" fill="url(#screen)" opacity=".8"/>')
a(f'<g class="gl1"><text x="{TX + 60}" y="368" font-size="40" text-anchor="middle" class="jp" fill="#00f0ff" opacity=".8">影森</text></g>')
a(f'<g class="gl2"><text x="{TX + 60}" y="368" font-size="40" text-anchor="middle" class="jp" fill="#ff2bd6" opacity=".8">影森</text></g>')
a(f'<text x="{TX + 60}" y="368" font-size="40" text-anchor="middle" class="jp" fill="#fff">影森</text>')
a(f'<text x="{TX + 60}" y="400" font-size="12" text-anchor="middle" fill="#fff" letter-spacing="2">KAGEMORI</text>')
a(f'<text x="{TX + 60}" y="420" font-size="8" text-anchor="middle" fill="#fff" opacity=".8" class="fl">TRUST THE NETWORK</text>')
a(f'<rect x="{TX + 12}" y="300" width="96" height="40" fill="url(#scanBar)" class="scan" style="animation-duration:3s"/>')
a(f'<rect x="{TX + 12}" y="300" width="96" height="150" fill="url(#scanlines)"/>')
a("</g>")
a(f'<rect x="{TX + 12}" y="300" width="96" height="150" fill="none" stroke="#ff2bd6" stroke-width="1.5" filter="url(#glowS)"/>')
a("</g>")

# hologram rings on a mid building roof
HX, HY = 1010, 420
a(f'<g transform="translate({HX},{HY})">')
a('<ellipse cx="0" cy="0" rx="90" ry="90" fill="url(#holo)" class="pulse"/>')
for rad, dash, dur, direc, col in ((58, "6 10", 14, 1, CYAN), (44, "30 8 4 8", 9, -1, MAGENTA), (30, "2 6", 6, 1, CYAN)):
    a(f'<circle r="{rad}" fill="none" stroke="{col}" stroke-width="2" stroke-dasharray="{dash}" filter="url(#glowS)" opacity=".85">'
      f'<animateTransform attributeName="transform" type="rotate" from="0" to="{360 * direc}" dur="{dur}s" repeatCount="indefinite"/></circle>')
a(f'<g class="fl2"><polygon points="0,-18 16,9 -16,9" fill="none" stroke="{CYAN}" stroke-width="2" filter="url(#glowS)">'
  '<animateTransform attributeName="transform" type="rotate" from="0" to="-360" dur="5s" repeatCount="indefinite"/></polygon></g>')
a(f'<polygon points="-6,90 6,90 30,0 -30,0" fill="{CYAN}" opacity=".08"/>')
a("</g>")

# mid-depth flying cars
for cid, p, d, b in [
    ("carP", "M-200,470 C300,450 1000,500 1800,460", 14, -2),
    ("carC", "M1800,500 C1100,480 500,520 -200,495", 16, -7),
    ("carY", "M-200,540 C400,560 1200,520 1800,545", 12, -5),
    ("carC", "M-200,250 C500,230 1000,280 1800,240", 18, -11),
]:
    car(cid, p, d, b, .6)

# ---------------------------------------------------------------- monorail
RY = 640
a(f'<g fill="#0c0419">')
for px in range(120, W, 260):
    a(f'<rect x="{px}" y="{RY + 8}" width="14" height="{BASE - RY}"/>')
a(f'<rect x="0" y="{RY}" width="{W}" height="9"/></g>')
a(f'<rect x="0" y="{RY + 8}" width="{W}" height="1.5" fill="{MAGENTA}" opacity=".6" filter="url(#glowS)"/>')
a('<g><animateTransform attributeName="transform" type="translate" values="-900 0;1700 0;1700 0" keyTimes="0;.55;1" dur="16s" begin="-3s" repeatCount="indefinite"/>')
for i in range(6):
    cx = i * 128
    nose = ' rx="10"' if i in (0, 5) else ' rx="3"'
    a(f'<rect x="{cx}" y="{RY - 28}" width="122" height="26"{nose} fill="#1a0c33" stroke="#3b1f6b"/>')
    a(f'<rect x="{cx + 8}" y="{RY - 22}" width="106" height="9" fill="{YELLOW}" opacity=".8" filter="url(#glowS)"/>')
    a(f'<rect x="{cx}" y="{RY - 6}" width="122" height="2" fill="{CYAN}" filter="url(#glowS)"/>')
a(f'<circle cx="{5 * 128 + 120}" cy="{RY - 14}" r="4" fill="#fff" filter="url(#glow)"/>')
a("</g>")

# ---------------------------------------------------------------- near buildings
a('<g fill="url(#nearB)">')
near_shapes = [
    "M-10,900 V230 H120 V180 H170 V300 H250 V380 H340 V900 Z",
    "M1230,900 V330 H1300 V210 H1420 V160 H1470 V260 H1610 V900 Z",
]
for d in near_shapes:
    a(f'<path d="{d}"/>')
a("</g>")
# rim lights on near buildings
a(f'<path d="M340,900 V380 H250 V300 H170" fill="none" stroke="{MAGENTA}" stroke-width="2" opacity=".8" filter="url(#glowS)"/>')
a(f'<path d="M1230,900 V330 H1300 V210 H1420" fill="none" stroke="{CYAN}" stroke-width="2" opacity=".8" filter="url(#glowS)"/>')
# near windows (sparse, warm)
a('<g>')
for x0, x1, y0 in ((10, 110, 250), (130, 160, 200), (180, 240, 320), (260, 330, 400), (1245, 1290, 350),
                   (1310, 1410, 230), (1480, 1590, 280)):
    for yy in range(y0, 780, 22):
        for xx in range(x0, x1 - 10, 18):
            if random.random() < .22:
                c = random.choice((YELLOW, ORANGE, CYAN, "#ff6ad5"))
                cls = f' class="won" style="animation-delay:-{f(r(0, 11))}s"' if random.random() < .15 else ""
                a(f'<rect x="{xx}" y="{yy}" width="11" height="13" fill="{c}" opacity=".7"{cls}/>')
a('</g>')
# fire escapes / pipes / AC units on the near buildings
a('<g stroke="#2a1648" stroke-width="2" fill="none">')
for yy in range(420, 780, 70):
    a(f'<path d="M260,{yy} H330 M260,{yy} V{yy + 8} M330,{yy} V{yy + 8} M268,{yy} L322,{yy + 62}"/>')
a(f'<path d="M1250,360 V790 M1258,360 V790"/>')
a("</g>")
a('<g fill="#1d0d33">')
for x, y in ((20, 330), (80, 470), (30, 610), (1500, 330), (1560, 520), (1440, 640)):
    a(f'<rect x="{x}" y="{y}" width="34" height="24"/><circle cx="{x + 17}" cy="{y + 12}" r="8" fill="#2b1748"/>')
a("</g>")
# rooftop antenna on near-right
a('<rect x="1444" y="70" width="3" height="90" fill="#0d0520"/><circle cx="1445" cy="68" r="3.5" fill="#ff2340" class="blink" filter="url(#glowS)"/>')
a('<rect x="143" y="110" width="3" height="70" fill="#0d0520"/><circle cx="144" cy="108" r="3" fill="#ff2340" class="blink" style="animation-delay:-.7s" filter="url(#glowS)"/>')

# ---------------------------------------------------------------- neon signs
reflections = []


def vsign(x, y, chars, col, cls, delay, size=34):
    hgt = len(chars) * (size + 8) + 16
    a(f'<g class="{cls}" style="animation-delay:{delay}s">')
    a(f'<rect x="{x}" y="{y}" width="{size + 18}" height="{hgt}" rx="4" fill="#0b0316" stroke="{col}" stroke-width="2.5" filter="url(#glow)"/>')
    for i, ch in enumerate(chars):
        a(f'<text x="{x + (size + 18) / 2}" y="{y + 12 + (i + 1) * (size + 8) - 8}" font-size="{size}" text-anchor="middle" '
          f'class="jp" fill="{col}" filter="url(#glowS)">{ch}</text>')
    a("</g>")
    reflections.append((x + (size + 18) / 2, size + 18, col))


def hsign(x, y, text, col, cls, delay, size=30, pad=12, border=True, jp=False):
    wdt = len(text) * size * (.95 if jp else .64) + pad * 2
    a(f'<g class="{cls}" style="animation-delay:{delay}s">')
    if border:
        a(f'<rect x="{x}" y="{y}" width="{f(wdt)}" height="{size + pad}" rx="6" fill="#0b0316" stroke="{col}" stroke-width="2.5" filter="url(#glow)"/>')
    a(f'<text x="{f(x + wdt / 2)}" y="{y + size * .82 + pad / 2}" font-size="{size}" text-anchor="middle" {"class=\"jp\" " if jp else ""}'
      f'fill="{col}" filter="url(#glow)" letter-spacing="2">{text}</text>')
    a("</g>")
    reflections.append((x + wdt / 2, wdt, col))


vsign(190, 400, "電脳街", MAGENTA, "fl", "-1.2")
hsign(18, 270, "HOTEL", CYAN, "fl2", "-3", size=28)
hsign(40, 520, "24H", YELLOW, "pulse", "0", size=34)
vsign(1255, 420, "サイバー", CYAN, "fl2", "-4.1", size=30)
hsign(1330, 300, "BAR", PINK, "fl", "-2.4", size=40)
hsign(1440, 430, "ラーメン", ORANGE, "pulse", "-1", size=24, jp=True)
hsign(1335, 690, "NO SIGNAL", "#b48cff", "fl", "-0.3", size=18)

# animated equalizer billboard on the right building
BX, BY, BW, BH = 1470, 560, 120, 90
a(f'<rect x="{BX}" y="{BY}" width="{BW}" height="{BH}" fill="#07020f" stroke="{CYAN}" stroke-width="2" filter="url(#glowS)"/>')
for i in range(10):
    bx = BX + 6 + i * 11
    vals = ";".join(f(r(8, BH - 14)) for _ in range(6))
    vals = vals + ";" + vals.split(";")[0]
    col = MAGENTA if i % 2 else CYAN
    a(f'<rect x="{bx}" y="{BY + 10}" width="8" height="20" fill="{col}" opacity=".9" transform="translate(0 {BY + BH - 6}) scale(1 -1) translate(0 {-(BY + 10)})">'
      f'<animate attributeName="height" values="{vals}" dur="{f(r(1.2, 2.2))}s" repeatCount="indefinite"/></rect>')
reflections.append((BX + BW / 2, BW, CYAN))

# ---------------------------------------------------------------- near flying cars (big, fast)
for cid, p, d, b in [
    ("carC", "M-300,600 C300,570 1100,610 1900,585", 7, -1),
    ("carP", "M1900,560 C1200,590 400,555 -300,575", 9, -4),
    ("carY", "M-300,180 C400,150 1100,200 1900,165", 11, -6),
]:
    car(cid, p, d, b, 1.15)

# ---------------------------------------------------------------- street + reflections
a(f'<rect x="0" y="{BASE}" width="{W}" height="{H - BASE}" fill="url(#street)"/>')
a(f'<rect x="0" y="{BASE}" width="{W}" height="2" fill="{MAGENTA}" opacity=".5" filter="url(#glowS)"/>')
# mirrored glow of the tower + signs on the wet ground
a('<g filter="url(#blur8)">')
a(f'<rect x="{TX + 10}" y="{BASE + 4}" width="{TW - 20}" height="90" fill="{MAGENTA}" opacity=".25" class="shim" style="transform-origin:{TX + 60}px 850px"/>')
for cx, wdt, col in reflections:
    a(f'<rect x="{f(cx - wdt / 2)}" y="{BASE + 6}" width="{f(wdt)}" height="{f(r(50, 85))}" fill="{col}" class="shim" '
      f'style="transform-origin:{f(cx)}px 850px;animation-delay:-{f(r(0, 2.6))}s"/>')
a("</g>")
# puddle streaks
a('<g opacity=".5">')
for _ in range(40):
    x, y = r(0, W), r(BASE + 8, H)
    c = random.choice((CYAN, MAGENTA, YELLOW, "#ffffff"))
    a(f'<rect x="{f(x)}" y="{f(y)}" width="{f(r(20, 90))}" height="1.2" fill="{c}" opacity="{f(r(.15, .6))}" class="tw" '
      f'style="animation-delay:-{f(r(0, 3))}s"/>')
a("</g>")
# road markings
a(f'<g fill="{YELLOW}" opacity=".35">')
for x in range(0, W, 120):
    a(f'<rect x="{x}" y="862" width="60" height="3"/>')
a("</g>")

# steam vents
for vx in (420, 610, 960, 1150):
    for k in range(3):
        a(f'<circle cx="{vx}" cy="{BASE + 10}" r="22" fill="#e6c4ff" filter="url(#blur8)" class="steam" '
          f'style="animation-delay:-{f(k * 2 + r(0, 1))}s;transform-box:fill-box;transform-origin:center"/>')

# ground fog
a(f'<rect x="0" y="640" width="{W}" height="200" fill="url(#fog)"/>')

# ---------------------------------------------------------------- rain
def rain(cls, n, length, op, width):
    a(f'<g transform="skewX(-10)" opacity="{op}"><g class="{cls}">')
    a('<g stroke="#bfe9ff" stroke-linecap="round" stroke-width="' + str(width) + '">')
    lines = []
    for _ in range(n):
        x, y = r(0, W + 200), r(0, H)
        ln = length * r(.6, 1.3)
        lines.append(f'<line x1="{f(x)}" y1="{f(y)}" x2="{f(x)}" y2="{f(y + ln)}"/>')
    tile = "".join(lines)
    a(tile)
    a(f'<g transform="translate(0 {H})">{tile}</g>')  # second copy so the loop is seamless
    a("</g></g></g>")


rain("rain2", 140, 14, .35, 1)
rain("rain", 110, 28, .55, 1.3)

# ---------------------------------------------------------------- CRT overlay
a(f'<rect width="{W}" height="{H}" fill="url(#scanlines)" opacity=".5"/>')
a(f'<rect x="0" y="0" width="{W}" height="120" fill="url(#scanBar)" class="scan"/>')
a(f'<rect width="{W}" height="{H}" fill="url(#vignette)"/>')

a("</svg>")

path = sys.argv[1] if len(sys.argv) > 1 else "cyberpunk-city.svg"
with open(path, "w", encoding="utf-8") as fh:
    fh.write("\n".join(out))
print(path)
