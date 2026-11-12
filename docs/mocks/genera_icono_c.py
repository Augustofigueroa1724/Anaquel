# Genera el SVG del icono C con libros en 3D inclinados hacia la letra.
import math, sys

def libro(i, x0, ang, w, h, tela, oscura, bandas=True, rotulo=None):
    dx, dy = 22, 14          # profundidad aparente (vista desde arriba a la derecha)
    t = f'translate({x0} 742) rotate({-ang})'
    g = [f'<g transform="{t}">']
    # tapa derecha (canto de la cubierta, en sombra)
    g.append(f'<polygon points="{w},{-h} {w+dx},{-h-dy} {w+dx},{-dy} {w},0" fill="{oscura}"/>')
    # cabeza: cantos de las páginas
    g.append(f'<polygon points="0,{-h} {w},{-h} {w+dx},{-h-dy} {dx},{-h-dy}" fill="url(#c-hojas)"/>')
    # lomo con volumen
    g.append(f'<rect x="0" y="{-h}" width="{w}" height="{h}" fill="{tela}"/>')
    g.append(f'<rect x="0" y="{-h}" width="{w}" height="{h}" fill="url(#c-vol)"/>')
    if bandas:
        for y in (-h+26, -h+36, -40, -30):
            g.append(f'<rect x="0" y="{y}" width="{w}" height="{4 if y in (-h+26,-40) else 2}" fill="url(#c-laton)"/>')
    if rotulo:
        g.append(f'<rect x="{w*0.22}" y="{-h*0.62}" width="{w*0.56}" height="{h*0.22}" rx="3" fill="none" stroke="url(#c-laton)" stroke-width="3"/>')
    g.append('</g>')
    return '\n'.join(g)

def svg(libros):
    defs = '''<defs>
  <linearGradient id="c-fondo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f1f22"/><stop offset="1" stop-color="#0e0e0f"/></linearGradient>
  <linearGradient id="c-laton" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d58f"/><stop offset=".55" stop-color="#d4ad66"/><stop offset="1" stop-color="#9b7230"/></linearGradient>
  <linearGradient id="c-vol" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
  <linearGradient id="c-hojas" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cdbf9f"/><stop offset="1" stop-color="#efe6d0"/></linearGradient>
  <radialGradient id="c-sombra" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>'''
    cuerpo = [
      '<rect width="1024" height="1024" fill="url(#c-fondo)"/>',
      '<ellipse cx="720" cy="744" rx="170" ry="16" fill="url(#c-sombra)"/>',
      '<text x="400" y="742" text-anchor="middle" font-family="Bodoni Moda, Didot, Georgia, serif" font-weight="500" font-size="640" fill="url(#c-laton)">A</text>',
    ] + libros + [
      # balda en 3D: canto superior y frente
      '<polygon points="170,742 870,742 884,730 184,730" fill="#f3d58f" opacity=".55"/>',
      '<rect x="170" y="742" width="700" height="14" fill="url(#c-laton)"/>',
      '<rect x="170" y="756" width="700" height="6" fill="#000" opacity=".35"/>',
    ]
    fondo, resto = cuerpo[0], cuerpo[1:]
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">{defs}\n{fondo}\n<g transform="translate(0,-30)">' + '\n'.join(resto) + '</g>\n</svg>'

ang = 24
c = 1/math.cos(math.radians(ang))
x1 = 646
dos = [libro(1, x1, ang, 84, 370, '#6e2a26', '#3e1412', rotulo=True),
       libro(2, x1+84*c+5, ang, 72, 335, '#1f2d47', '#101a2e')]
tres = dos + [libro(3, x1+84*c+5+72*c+5, ang, 62, 300, '#2b4a52', '#16292e', bandas=False)]
open(sys.argv[1]+'/c2.svg','w').write(svg(dos))
open(sys.argv[1]+'/c3.svg','w').write(svg(tres))
