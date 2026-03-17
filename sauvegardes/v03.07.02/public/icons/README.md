# PWA Icons

This directory contains the PWA icons for VIBE.

## Required files

| File | Size | Usage |
|---|---|---|
| `icon.svg` | scalable | Favicon, base source |
| `icon-192.png` | 192×192 | Android homescreen, SW manifest |
| `icon-512.png` | 512×512 | Splash screen, PWA install prompt |

## Generating PNG icons

The PNG icons must be generated from `icon.svg` before deployment:

```bash
# Using sharp-cli (recommended)
npx sharp-cli -i public/icons/icon.svg -o public/icons/icon-192.png resize 192 192
npx sharp-cli -i public/icons/icon.svg -o public/icons/icon-512.png resize 512 512

# Or using Inkscape
inkscape public/icons/icon.svg -w 192 -h 192 -o public/icons/icon-192.png
inkscape public/icons/icon.svg -w 512 -h 512 -o public/icons/icon-512.png
```

## Design

- Background: `#0a0a1a` (LCARS dark)
- Primary accent: `#CC8800` (LCARS amber)
- Secondary accent: `#9999FF` (LCARS lavender)
- Style: Star Trek LCARS interface language
