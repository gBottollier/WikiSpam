# -*- coding: utf-8 -*-
"""Genere les bannieres de region de la page Personnages a partir de la carte.

Tout le cout est ici (build), pas dans le navigateur : chaque banniere est une
image plate deja recadree, deja assombrie/desaturee, avec les icones de lieux
incrustees. Le client ne fait qu'un decodage d'image, aucune composition de
calques ni transformation au runtime.

Sortie : img/region/banner/<cle>.webp        (desktop, 7.3:1)
         img/region/banner/<cle>-m.webp      (mobile,  2:1)
         app/src/data/regionBanners.js       (manifeste des cles generees)

Usage : python tools/make_region_banners.py
"""
import json
import os
import re
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = os.path.join(ROOT, 'img', 'map')
OUT = os.path.join(ROOT, 'img', 'region', 'banner')

DESKTOP = (1600, 220)   # 7.3:1 - .region-header fait ~1330x180 au plus large
MOBILE = (640, 320)     # 2:1   - ~340x180 sur telephone, donc bien moins large
PAD = 0.18              # marge autour de la region, en fraction de sa bbox
MAX_UPSCALE = 1.6       # agrandissement max de la carte source (trait plat, il tient)

# Traitement cuit dans le fichier : le titre doit rester lisible par-dessus
# sans filtre CSS (qui, lui, se paierait a chaque repaint).
SATURATION = 0.62
BRIGHTNESS = 0.92

# Une banniere aussi etiree ne peut pas contenir un continent entier : elle
# montre forcement une bande de monde. On garde donc la region a sa couleur et
# on assombrit tout le reste, pour qu'on voie du premier coup d'oeil OU elle se
# trouve. Cuit dans l'image, donc gratuit a l'affichage.
OUT_SATURATION = 0.30
OUT_BRIGHTNESS = 0.45
FEATHER = 0.022         # flou du masque, en fraction de la largeur de sortie


def load_map_regions():
    src = open(os.path.join(ROOT, 'js', 'map-data.js'), encoding='utf-8').read()
    return json.loads(src[src.index('{'):src.rindex('}') + 1])


def load_perso_keys():
    src = open(os.path.join(ROOT, 'app', 'src', 'data', 'personnages.js'), encoding='utf-8').read()
    return re.findall(r'"key":\s*"([^"]+)"', src)


def polygon_bbox(poly):
    """bbox [x0,y0,w,h] a partir d'un polygone normalise (None si degenere)."""
    if not poly or len(poly) < 3:
        return None
    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    return [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)]


def alpha_bbox(img, size):
    """bbox normalisee du contenu non transparent d'un calque."""
    box = img.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox()
    if not box:
        return None
    w, h = size
    return [box[0] / w, box[1] / h, (box[2] - box[0]) / w, (box[3] - box[1]) / h]


def build_base(regions, size):
    """Ocean + continents + toutes les icones de lieux, en pleine resolution."""
    w, h = size
    base = Image.open(os.path.join(MAP, 'layers', '1_Ocean.webp')).convert('RGBA')
    top = Image.open(os.path.join(MAP, 'layers', 'top.webp')).convert('RGBA')
    base.alpha_composite(top)

    for r in regions.values():
        for p in r.get('points', []):
            icon = p.get('icon')
            if not icon:
                continue
            path = os.path.join(MAP, 'icons', icon)
            if not os.path.exists(path):
                print('  icone manquante : ' + icon)
                continue
            # Memes coordonnees que markerStyle() dans Carte.vue : iconX/iconY
            # sont le CENTRE normalise sur la carte entiere, iconW/iconH une
            # taille en pourcentage de la carte entiere.
            iw = max(1, round(p['iconW'] / 100.0 * w))
            ih = max(1, round(p['iconH'] / 100.0 * h))
            left = round((p['iconX'] - p['iconW'] / 200.0) * w)
            top_ = round((p['iconY'] - p['iconH'] / 200.0) * h)
            icon_img = Image.open(path).convert('RGBA').resize((iw, ih), Image.LANCZOS)
            base.alpha_composite(icon_img, (left, top_))
    return base


def band(bbox, size, out_size):
    """Bande horizontale centree sur la region.

    Une banniere de 7:1 ne peut pas contenir un continent entier : soit on
    montre toute la region et on se retrouve avec une bande de monde entier ou
    elle n'occupe qu'un coin, soit on cadre sur sa largeur et on la coupe en
    hauteur. On choisit le cadrage en largeur : le relief et les icones de
    lieux restent lisibles, et le halo (region eclairee, reste assombri) dit ou
    on se trouve.

    La carte n'est pas cylindrique : ses bords est et ouest ne se rejoignent
    pas. Une region collee a un bord est donc decentree, jamais enroulee.
    """
    W, H = size
    out_w, out_h = out_size
    aspect = out_w / out_h
    x0, y0, bw, bh = bbox
    cx, cy = (x0 + bw / 2) * W, (y0 + bh / 2) * H

    # Assez large pour la region + sa marge, mais sans agrandir la carte source
    # au-dela de MAX_UPSCALE (le trait plat encaisse, une photo ne pourrait pas).
    w = max(bw * W * (1 + 2 * PAD), out_w / MAX_UPSCALE)
    w = min(w, W)
    h = w / aspect
    if h > H:
        h, w = H, H * aspect
    left = min(max(cx - w / 2, 0), W - w)
    top = min(max(cy - h / 2, 0), H - h)
    return (round(left), round(top), round(left + w), round(top + h))


def region_mask(r, size):
    """Masque pleine carte (blanc = la region) a partir de son polygone.

    Comme dans Carte.vue, polygon est soit un anneau, soit une liste d'anneaux.
    Les regions dont le contour est degenere (moins de 3 points) retombent sur
    leur bbox, adoucie ensuite par le flou du masque.
    """
    W, H = size
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    poly = r.get('polygon') or []
    rings = poly if (poly and isinstance(poly[0][0], list)) else [poly]
    drawn = False
    for ring in rings:
        if len(ring) >= 3:
            draw.polygon([(p[0] * W, p[1] * H) for p in ring], fill=255)
            drawn = True
    if not drawn:
        b = r.get('bbox')
        if not b:
            return None
        draw.rectangle([b[0] * W, b[1] * H, (b[0] + b[2]) * W, (b[1] + b[3]) * H], fill=255)
    return mask


def open_water_box(land, ocean, size, out_size, width_frac=0.40):
    """Cadre la bande sur de l'eau libre, en evitant le bleu uni.

    Pour la region "ocean" il n'y a pas de continent a montrer : on balaie la
    carte, on ne garde que les bandes presque sans terre (canal alpha du calque
    des continents), puis parmi celles-la on prend la plus contrastee sur le
    calque ocean — chaque mer y a sa couleur, donc on tombe sur une frontiere
    de mers plutot que sur un aplat.
    """
    W, H = size
    w = W * width_frac
    h = w / (out_size[0] / out_size[1])
    small = land.getchannel('A').resize((160, 107), Image.BILINEAR)
    sea = ocean.convert('L').resize((160, 107), Image.BILINEAR)
    sw, sh = small.size
    bw, bh = max(1, round(w * sw / W)), max(1, round(h * sh / H))

    boxes = []
    for sy in range(0, sh - bh + 1, 2):
        for sx in range(0, sw - bw + 1, 2):
            px = list(small.crop((sx, sy, sx + bw, sy + bh)).getdata())
            boxes.append((sum(px) / len(px), sx, sy))
    if not boxes:
        return (0, 0, round(w), round(h))

    floor = min(b[0] for b in boxes)
    best, best_box = None, None
    for landiness, sx, sy in boxes:
        if landiness > floor + 6:          # presque pas de terre
            continue
        px = list(sea.crop((sx, sy, sx + bw, sy + bh)).getdata())
        mean = sum(px) / len(px)
        variety = sum((v - mean) ** 2 for v in px) / len(px)
        if best is None or variety > best:
            best, best_box = variety, (sx * W / sw, sy * H / sh)
    left, top = best_box
    return tuple(round(v) for v in (left, top, left + w, top + h))


def render(base, bbox, out_path, out_size, blur=0.0, mask=None, box=None):
    box = box or band(bbox, base.size, out_size)
    crop = base.crop(box).resize(out_size, Image.LANCZOS).convert('RGB')
    if blur:
        crop = crop.filter(ImageFilter.GaussianBlur(blur))

    if mask is not None:
        # Le masque suit exactement le meme recadrage que l'image.
        m = mask.crop(box).resize(out_size, Image.LANCZOS)
        m = m.filter(ImageFilter.GaussianBlur(out_size[0] * FEATHER))
        outside = ImageEnhance.Color(crop).enhance(OUT_SATURATION)
        outside = ImageEnhance.Brightness(outside).enhance(OUT_BRIGHTNESS)
        crop = Image.composite(crop, outside, m)

    crop = ImageEnhance.Color(crop).enhance(SATURATION)
    crop = ImageEnhance.Brightness(crop).enhance(BRIGHTNESS)
    crop.save(out_path, 'WEBP', quality=78, method=6)
    return os.path.getsize(out_path)


def main():
    regions = load_map_regions()
    os.makedirs(OUT, exist_ok=True)

    map_size = Image.open(os.path.join(MAP, 'layers', 'top.webp')).size
    base = build_base(regions, map_size)
    W, H = base.size

    # Les regions "personnages" sans continent propre : on leur donne quand meme
    # un ancrage geographique plutot qu'une illustration hors-carte.
    engloutie = Image.open(os.path.join(MAP, 'layers', '2_Ville_Engloutie.webp')).convert('RGBA')
    abysses_bbox = alpha_bbox(engloutie, (W, H))
    base_abysses = base.copy()
    base_abysses.alpha_composite(engloutie)

    full = [0.0, 0.0, 1.0, 1.0]
    land = Image.open(os.path.join(MAP, 'layers', 'top.webp')).convert('RGBA')
    ocean_layer = Image.open(os.path.join(MAP, 'layers', '1_Ocean.webp')).convert('RGB')
    # Rien a mettre en avant sur ces deux-la : tout le cadre recoit le meme
    # traitement, d'ou un masque entierement noir.
    dim_all = Image.new('L', (W, H), 0)
    special = {
        # cle personnage : (region servant de zone, image de base, flou, masque)
        # 'auto' = halo calcule depuis le contour de la region.
        'abysses': ({'bbox': abysses_bbox or full}, base_abysses, 0.0, 'auto'),
        # Tout le cadre EST la region : aucun halo, rien a assombrir.
        'ocean': ({'bbox': full}, base, 0.0, None),
        # Aucun lieu connu : le monde entier, estompe en entier.
        'inconnue': ({'bbox': full}, base, 2.5, dim_all),
    }
    # La carte et la page personnages n'ecrivent pas ce nom pareil.
    alias = {'iles-essoulees': 'iles-esseules'}

    manifest, total = [], 0
    for key in load_perso_keys():
        forced = None
        if key in special:
            r, src, blur, mask = special[key]
            if mask == 'auto':
                mask = region_mask(r, (W, H))
            if key == 'ocean':
                # Pas de continent a montrer : on cadre sur l'eau libre.
                forced = (open_water_box(land, ocean_layer, (W, H), DESKTOP),
                          open_water_box(land, ocean_layer, (W, H), MOBILE))
        else:
            r = regions.get(alias.get(key, key))
            src, blur = base, 0.0
            mask = region_mask(r, (W, H)) if r else None
        bbox = (r.get('bbox') or polygon_bbox(r.get('polygon'))) if r else None
        if not bbox:
            print('- %-16s aucune donnee de carte, ignore' % key)
            continue
        d = render(src, bbox, os.path.join(OUT, key + '.webp'), DESKTOP, blur, mask,
                   forced[0] if forced else None)
        m = render(src, bbox, os.path.join(OUT, key + '-m.webp'), MOBILE, blur, mask,
                   forced[1] if forced else None)
        total += d + m
        manifest.append(key)
        print('- %-16s %5.1f Ko + %5.1f Ko (mobile)' % (key, d / 1024, m / 1024))

    js = os.path.join(ROOT, 'app', 'src', 'data', 'regionBanners.js')
    with open(js, 'w', encoding='utf-8') as f:
        f.write('// Genere par tools/make_region_banners.py - ne pas editer a la main.\n')
        f.write("// Cles de region ayant une banniere decoupee dans la carte du monde.\n")
        f.write('export const REGION_BANNERS = new Set([\n')
        for k in manifest:
            f.write("  '%s',\n" % k)
        f.write('])\n')

    print('\n%d bannieres, %.0f Ko au total' % (len(manifest), total / 1024))


if __name__ == '__main__':
    main()
