# Icon Generation Instructions

The extension requires PNG icons in the following sizes:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

## Option 1: Use the generation script (requires ImageMagick or Inkscape)

```bash
./generate-icons.sh
```

## Option 2: Convert manually using online tools

1. Open `icon.svg` in your browser
2. Use one of these tools to convert SVG to PNG:
   - https://cloudconvert.com/svg-to-png
   - https://svgtopng.com/
   - https://convertio.co/svg-png/

3. Generate at sizes: 16x16, 48x48, and 128x128
4. Save as `icon16.png`, `icon48.png`, `icon128.png` in this directory

## Option 3: Use ImageMagick manually

```bash
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

## Option 4: Use Inkscape manually

```bash
inkscape icon.svg -w 16 -h 16 -o icon16.png
inkscape icon.svg -w 48 -h 48 -o icon48.png
inkscape icon.svg -w 128 -h 128 -o icon128.png
```

## Temporary Workaround

If you can't generate the icons right now, the extension will use Chrome's default icon. Generate the proper icons when you have the tools available for a professional appearance.
