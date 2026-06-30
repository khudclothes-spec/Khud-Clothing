# Mockup Image Specifications

These specs are derived directly from the studio code, not guessed:

- **Canvas size** — [components/customize/StudioCanvas.jsx](../components/customize/StudioCanvas.jsx) computes `w = clamp(containerWidth, 300, 460)` and `h = round(w * 1.16)`. So the design canvas aspect ratio is **width : height = 1 : 1.16** (≈ 0.862 : 1).
- **Garment image fills the frame exactly** — `.studio-garment { padding: 0 }` + `object-fit: contain`. Therefore the printable-area fractions map **1:1 onto the image**. The shirt's transparent margin is baked into the asset (below).
- **Printable regions** — fractions of the canvas, defined in [lib/data.js](../lib/data.js) `customPrintAreas`:

| View | x | y | width | height |
|------|----|----|-------|--------|
| Front | 0.17 | 0.21 | 0.66 | 0.64 |
| Back | 0.17 | 0.17 | 0.66 | 0.68 |
| Left Sleeve | 0.35 | 0.18 | 0.30 | 0.60 |
| Right Sleeve | 0.35 | 0.18 | 0.30 | 0.60 |

The same fractions apply to **both Classic and Oversized** tees (oversized simply looks boxier/wider in the artwork; the coordinates are identical).

---

## 1. Recommended image resolution

Use a **1 : 1.16** portrait canvas. Recommended export size:

- **1600 × 1856 px** (high quality, what the specs below are calculated against)
- Acceptable minimum: 1000 × 1160 px
- Format: **PNG with transparency (alpha)**
- File names exactly: `front.png`, `back.png`, `left-sleeve.png`, `right-sleeve.png`

> If you export at a different size, keep the **1 : 1.16** aspect ratio or the image will letterbox and the print area will no longer line up.

## 2. Shirt positioning inside the image

- **Front / Back:** shirt centered horizontally. Shirt body occupies **~88% of width** and **~92% of height**. Neckline at roughly **y = 12%**, hem at roughly **y = 95%**. This makes the printable rectangle start ~10% below the neckline and end ~10% above the hem.
- **Left / Right Sleeve:** show the **whole sleeve cloth** laid flat (a tapered trapezoid), centered, filling ~**90% of height**. The narrow end (cuff) is at the bottom. The app overlays a dashed **fold/outer-edge centre guideline** at x = 50%, so leave the sleeve symmetric around the centre.
- **Transparent padding/margin:** keep a **~6% transparent margin** on every side (no drop shadow bleeding past it). Everything outside the shirt must be fully transparent.

## 3. Exact shirt colour hex codes

| Folder (`colorKey`) | Colour | Hex |
|---------------------|--------|-----|
| `white` | White | `#FFFFFF` |
| `black` | Black | `#111111` |
| `blue` | Navy Blue | `#1E3A8A` |
| `grey` | Grey | `#9CA3AF` |

Paint the actual shirt fabric these colours. (White on a white page: include soft seams/shadows so the shirt reads.)

## 4. Per-view printable area — pixel coordinates @ 1600 × 1856

Coordinates are `top-left (x, y)` and `size (w × h)` in image pixels (fraction × image dimension). **Identical for Classic and Oversized.**

### Front
- Printable rect: **x 272, y 390 → 1056 × 1188 px**
- = 75% of shirt width, starts ~10% below neckline, ends ~10% above hem

### Back
- Printable rect: **x 272, y 316 → 1056 × 1262 px**
- Slightly taller than front (no front neckline cut-in)

### Left Sleeve
- Printable rect: **x 560, y 334 → 480 × 1114 px**
- Conservative rectangle fully inside the sleeve trapezoid; fold line at x 800

### Right Sleeve
- Printable rect: **x 560, y 334 → 480 × 1114 px** (mirror of left)

> To recompute for another resolution: `px = fraction × imageDimension`, using the fractions table at the top.

## 5. Folder structure (already created, empty placeholders inside)

```
public/mockups/
  classic/   {white,black,blue,grey}/ {front,back,left-sleeve,right-sleeve}.png
  oversized/ {white,black,blue,grey}/ {front,back,left-sleeve,right-sleeve}.png
```

Drop your generated PNGs in, replacing the empty placeholders. Until a real file
is present the studio automatically falls back to the SVG silhouette, so nothing
breaks if some are missing.

## 6. Guidelines for generating / uploading assets (AI-prompt friendly)

When generating each image, instruct the model to:

1. Produce a **flat, front-on product mockup** of a {classic | oversized} t-shirt, **{colour}**, on a **fully transparent background**, PNG.
2. Canvas **1600 × 1856 px**, shirt **centered**, occupying ~88% width / ~92% height, ~6% transparent margin all around.
3. **No background, no props, no mannequin, no folds beyond subtle fabric shading.** Even, soft studio lighting; no harsh shadows outside the shirt silhouette.
4. For **back**: same shirt from the back (no collar V, flat neckline).
5. For **sleeves**: render the **whole sleeve fabric laid flat** as a tapered panel (wide shoulder at top, cuff at bottom), centered, symmetric about the vertical centre.
6. Keep the garment **inside the printable-area coordinates above** clear of seams/logos so customer artwork prints cleanly.
7. Export the four views per colour, name them `front.png`, `back.png`, `left-sleeve.png`, `right-sleeve.png`, and place them in the matching `public/mockups/<garment>/<colorKey>/` folder.
