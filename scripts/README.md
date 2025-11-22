# Asset Generation Scripts

This directory contains scripts for generating app icons and splash screens from the main logo SVG.

## Prerequisites

Install Sharp for image processing:

```bash
npm install sharp --save-dev
```

## Scripts

### `generate-icons.js`

Generates Android app icons in all required densities from the logo SVG.

**Usage:**

```bash
node scripts/generate-icons.js
```

**Output:**

- `android/app/src/main/res/mipmap-*/ic_launcher.png` (48px to 192px)
- `public/logo-*.png` (16px, 32px, 180px for web favicons)

### `generate-splash.js`

Generates Android splash screens in all required densities and orientations from the logo SVG.

**Usage:**

```bash
node scripts/generate-splash.js
```

**Output:**

- `android/app/src/main/res/drawable-land-*/splash.png` (landscape orientations)
- `android/app/src/main/res/drawable-port-*/splash.png` (portrait orientations)
- `public/splash.png` (web asset for Capacitor)

## Notes

- Both scripts use the SVG content embedded in the script
- Icons are generated at standard Android densities (ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- Splash screens are centered on white backgrounds with the logo scaled to 30% of screen size
- After running, rebuild the app with `npm run build` to include the new assets
