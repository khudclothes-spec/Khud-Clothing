# Studio mockup images

Drop garment mockup PNGs here, replacing the empty placeholders.

```
<garment>/<color>/<view>.png
  garment : classic | oversized
  color   : white | black | blue | grey      (blue = Navy Blue)
  view    : front | back | left-sleeve | right-sleeve
```

The customization studio loads `/mockups/<garment>/<color>/<view>.png` and falls
back to an SVG silhouette when a file is missing or empty, so partial uploads are
safe.

Exact resolution, shirt positioning, printable-area coordinates and colour hex
codes are in **[docs/mockup-specifications.md](../../docs/mockup-specifications.md)**.
