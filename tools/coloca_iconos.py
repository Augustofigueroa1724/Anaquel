"""Reparte las maestras de tools/salida por iOS, Android y la web, a cada tamaño."""
import glob
from pathlib import Path
from PIL import Image

S = Path('tools/salida')
icono = Image.open(S / 'icono.png').convert('RGB')          # opaco: Apple rechaza transparencia
redondo = Image.open(S / 'icono-redondo.png').convert('RGBA')
plano = Image.open(S / 'primer-plano.png').convert('RGBA')
arranque = Image.open(S / 'arranque.png').convert('RGB')

def guarda(img, ruta, lado):
    img.resize((lado, lado), Image.LANCZOS).save(ruta, optimize=True)

# iOS: un solo icono de 1024 y las tres imágenes de arranque.
guarda(icono, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024)
for f in glob.glob('ios/App/App/Assets.xcassets/Splash.imageset/*.png'):
    arranque.resize(Image.open(f).size, Image.LANCZOS).save(f, optimize=True)

# Android: iconos por densidad, primer plano adaptativo y arranque (recorte centrado).
for f in glob.glob('android/app/src/main/res/mipmap-*/ic_launcher.png'):
    guarda(icono, f, Image.open(f).size[0])
for f in glob.glob('android/app/src/main/res/mipmap-*/ic_launcher_round.png'):
    guarda(redondo, f, Image.open(f).size[0])
for f in glob.glob('android/app/src/main/res/mipmap-*/ic_launcher_foreground.png'):
    guarda(plano, f, Image.open(f).size[0])
for f in glob.glob('android/app/src/main/res/drawable*/splash.png'):
    w, h = Image.open(f).size
    lado = max(w, h)
    cuadro = arranque.resize((lado, lado), Image.LANCZOS)
    x, y = (lado - w) // 2, (lado - h) // 2
    cuadro.crop((x, y, x + w, y + h)).save(f, optimize=True)

# Web (GitHub Pages y «añadir a pantalla de inicio»).
guarda(icono, 'public/apple-touch-icon.png', 180)
guarda(redondo, 'public/favicon.png', 64)
print('Iconos colocados')
