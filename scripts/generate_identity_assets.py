"""
Script: generate_identity_assets.py
Generates official vector and high-resolution raster branding assets for:
Aden International Center for Safety and Field Assessment
مركز عدن الدولي للسلامة والدراسات الميدانية
"""

import os
import math
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'images')
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. VECTOR SVG GENERATION (Crisp, Infinite Resolution)
# -------------------------------------------------------------
def generate_svg_symbol(filepath):
    svg_content = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F1E2E"/>
      <stop offset="50%" stop-color="#162A40"/>
      <stop offset="100%" stop-color="#0A1622"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="50%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E3A5F" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#0F1E2E" stop-opacity="0.95"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Outer Protective Hexagonal Shield (Safety Framework) -->
  <polygon points="256,24 436,88 436,336 256,488 76,336 76,88" 
           fill="url(#bgGrad)" 
           stroke="url(#goldGrad)" 
           stroke-width="8" 
           stroke-linejoin="round"/>

  <!-- Inner Concentric Shield (Field Assessment & Resilience) -->
  <polygon points="256,56 406,110 406,320 256,450 106,320 106,110" 
           fill="url(#shieldGrad)" 
           stroke="#38BDF8" 
           stroke-width="2.5" 
           stroke-opacity="0.5" 
           stroke-linejoin="round"/>

  <!-- Field Assessment Coordinate Grid (Subtle Lines) -->
  <!-- Horizontal Axis -->
  <line x1="126" y1="230" x2="386" y2="230" stroke="#38BDF8" stroke-width="1.5" stroke-opacity="0.25" stroke-dasharray="4,4"/>
  <!-- Vertical Axis -->
  <line x1="256" y1="90" x2="256" y2="400" stroke="#38BDF8" stroke-width="1.5" stroke-opacity="0.25" stroke-dasharray="4,4"/>

  <!-- Concentric Assessment Rings (Early Warning & Analysis) -->
  <circle cx="256" cy="230" r="105" fill="none" stroke="#F59E0B" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="6,4"/>
  <circle cx="256" cy="230" r="70" fill="none" stroke="#38BDF8" stroke-width="2" stroke-opacity="0.45"/>
  <circle cx="256" cy="230" r="35" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-opacity="0.75"/>

  <!-- Central Pathway / Access Route (Field Access) -->
  <!-- Left Wing / Assessment Vector -->
  <path d="M190,320 L256,150 L256,270 Z" fill="url(#tealGrad)" opacity="0.9"/>
  <!-- Right Wing / Safety Anchor -->
  <path d="M322,320 L256,150 L256,270 Z" fill="url(#goldGrad)" opacity="0.9"/>

  <!-- Central Calibration Beacon (Early Warning Focal Point) -->
  <circle cx="256" cy="230" r="14" fill="#FFFFFF" filter="url(#softGlow)"/>
  <circle cx="256" cy="230" r="7" fill="#0F1E2E"/>

  <!-- Four Cardinal Field Coordinate Markers -->
  <!-- North (Apex) -->
  <polygon points="256,130 251,146 261,146" fill="#F59E0B"/>
  <!-- South -->
  <polygon points="256,330 251,314 261,314" fill="#38BDF8"/>
  <!-- West -->
  <polygon points="150,230 166,225 166,235" fill="#38BDF8"/>
  <!-- East -->
  <polygon points="362,230 346,225 346,235" fill="#F59E0B"/>

  <!-- Bottom Milestone Marker (Field Knowledge Base) -->
  <circle cx="256" cy="410" r="6" fill="#F59E0B"/>
  <line x1="236" y1="410" x2="246" y2="410" stroke="#38BDF8" stroke-width="2"/>
  <line x1="266" y1="410" x2="276" y2="410" stroke="#38BDF8" stroke-width="2"/>
</svg>
"""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(svg_content.strip())
    print(f"[OK] Generated: {filepath}")

# -------------------------------------------------------------
# 2. RASTER IMAGE GENERATION WITH PILLOW (High Resolution)
# -------------------------------------------------------------
def generate_raster_assets():
    # Canvas size for supersampling: 1600x1600
    S = 1600
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = S // 2, S // 2

    # Color definitions (Institutional Humanitarian Safety)
    NAVY_DARK = (15, 30, 46, 255)       # #0F1E2E
    NAVY_MID  = (22, 42, 64, 255)       # #162A40
    NAVY_LIGHT = (30, 58, 95, 230)      # #1E3A5F
    GOLD_MAIN = (217, 119, 6, 255)      # #D97706
    GOLD_BRIGHT = (245, 158, 11, 255)   # #F59E0B
    TEAL_MAIN = (14, 165, 233, 255)     # #0EA5E9
    TEAL_LIGHT = (56, 189, 248, 255)    # #38BDF8
    WHITE = (255, 255, 255, 255)

    # 1. Draw Outer Hexagonal Protective Shield
    outer_points = [
        (cx, int(S * 0.05)),
        (int(S * 0.85), int(S * 0.17)),
        (int(S * 0.85), int(S * 0.66)),
        (cx, int(S * 0.95)),
        (int(S * 0.15), int(S * 0.66)),
        (int(S * 0.15), int(S * 0.17))
    ]
    draw.polygon(outer_points, fill=NAVY_DARK)

    # Outer Border (Gold Gradient Effect)
    for i in range(outer_points.__len__()):
        p1 = outer_points[i]
        p2 = outer_points[(i + 1) % len(outer_points)]
        draw.line([p1, p2], fill=GOLD_BRIGHT, width=24)

    # 2. Inner Shield
    inner_points = [
        (cx, int(S * 0.11)),
        (int(S * 0.79), int(S * 0.22)),
        (int(S * 0.79), int(S * 0.63)),
        (cx, int(S * 0.88)),
        (int(S * 0.21), int(S * 0.63)),
        (int(S * 0.21), int(S * 0.22))
    ]
    draw.polygon(inner_points, fill=NAVY_MID)
    for i in range(len(inner_points)):
        p1 = inner_points[i]
        p2 = inner_points[(i + 1) % len(inner_points)]
        draw.line([p1, p2], fill=TEAL_MAIN, width=8)

    # Center of inner grid:
    center_y = int(S * 0.45)

    # 3. Coordinate Grid & Rings
    # Concentric Assessment Rings
    for r, col, w in [(int(S * 0.21), (245, 158, 11, 80), 6),
                      (int(S * 0.14), (56, 189, 248, 120), 6),
                      (int(S * 0.07), (245, 158, 11, 200), 8)]:
        bbox = [cx - r, center_y - r, cx + r, center_y + r]
        draw.ellipse(bbox, outline=col, width=w)

    # Grid axes
    draw.line([(int(S * 0.25), center_y), (int(S * 0.75), center_y)], fill=(56, 189, 248, 80), width=4)
    draw.line([(cx, int(S * 0.18)), (cx, int(S * 0.78))], fill=(56, 189, 248, 80), width=4)

    # 4. Central Vectors / Pathways (Humanitarian Access Wings)
    # Left Vector (Teal)
    draw.polygon([(int(S * 0.37), int(S * 0.63)), (cx, int(S * 0.29)), (cx, int(S * 0.53))], fill=TEAL_MAIN)
    # Right Vector (Gold)
    draw.polygon([(int(S * 0.63), int(S * 0.63)), (cx, int(S * 0.29)), (cx, int(S * 0.53))], fill=GOLD_MAIN)

    # 5. Central Focal Beacon (Analytical Center)
    glow_r = int(S * 0.038)
    draw.ellipse([cx - glow_r, center_y - glow_r, cx + glow_r, center_y + glow_r], fill=(255, 255, 255, 180))
    core_r = int(S * 0.024)
    draw.ellipse([cx - core_r, center_y - core_r, cx + core_r, center_y + core_r], fill=WHITE)
    inner_dot = int(S * 0.012)
    draw.ellipse([cx - inner_dot, center_y - inner_dot, cx + inner_dot, center_y + inner_dot], fill=NAVY_DARK)

    # 6. Cardinal Coordinate Triangles
    # North
    draw.polygon([(cx, int(S * 0.25)), (cx - 24, int(S * 0.28)), (cx + 24, int(S * 0.28))], fill=GOLD_BRIGHT)
    # South
    draw.polygon([(cx, int(S * 0.65)), (cx - 24, int(S * 0.62)), (cx + 24, int(S * 0.62))], fill=TEAL_LIGHT)
    # West
    draw.polygon([(int(S * 0.30), center_y), (int(S * 0.33), center_y - 24), (int(S * 0.33), center_y + 24)], fill=TEAL_LIGHT)
    # East
    draw.polygon([(int(S * 0.70), center_y), (int(S * 0.67), center_y - 24), (int(S * 0.67), center_y + 24)], fill=GOLD_BRIGHT)

    # 7. Milestone Dots at Bottom
    draw.ellipse([cx - 16, int(S * 0.82) - 16, cx + 16, int(S * 0.82) + 16], fill=GOLD_BRIGHT)
    draw.line([(cx - 70, int(S * 0.82)), (cx - 30, int(S * 0.82))], fill=TEAL_LIGHT, width=6)
    draw.line([(cx + 30, int(S * 0.82)), (cx + 70, int(S * 0.82))], fill=TEAL_LIGHT, width=6)

    # ---------------------------------------------------------
    # RESAMPLE AND SAVE ASSETS
    # ---------------------------------------------------------
    # 1. High-Resolution Main Logo (800x800)
    logo_800 = img.resize((800, 800), Image.Resampling.LANCZOS)
    logo_800_path = os.path.join(OUTPUT_DIR, 'logo.png')
    logo_800.save(logo_800_path, 'PNG', optimize=True)
    print(f"[OK] Generated: {logo_800_path}")

    # 2. Medium Icon (128x128)
    logo_128 = img.resize((128, 128), Image.Resampling.LANCZOS)
    logo_128_path = os.path.join(OUTPUT_DIR, 'logo-128.png')
    logo_128.save(logo_128_path, 'PNG', optimize=True)
    print(f"[OK] Generated: {logo_128_path}")

    # 3. Favicon ICO (Multi-resolution: 16, 32, 48)
    favicon_path = os.path.join(PUBLIC_DIR, 'favicon.ico')
    ico_img = img.resize((48, 48), Image.Resampling.LANCZOS)
    ico_img.save(favicon_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"[OK] Generated: {favicon_path}")

if __name__ == '__main__':
    svg_path = os.path.join(OUTPUT_DIR, 'logo.svg')
    svg_sym_path = os.path.join(OUTPUT_DIR, 'logo-symbol.svg')
    generate_svg_symbol(svg_path)
    generate_svg_symbol(svg_sym_path)
    generate_raster_assets()
    print("[SUCCESS] All brand assets created successfully.")
