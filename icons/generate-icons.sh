#!/bin/bash
# This script generates PNG icons from the SVG source
# Requires: imagemagick or inkscape

if command -v convert &> /dev/null; then
    echo "Generating icons with ImageMagick..."
    convert -background none icon.svg -resize 16x16 icon16.png
    convert -background none icon.svg -resize 48x48 icon48.png
    convert -background none icon.svg -resize 128x128 icon128.png
    echo "Icons generated successfully!"
elif command -v inkscape &> /dev/null; then
    echo "Generating icons with Inkscape..."
    inkscape icon.svg -w 16 -h 16 -o icon16.png
    inkscape icon.svg -w 48 -h 48 -o icon48.png
    inkscape icon.svg -w 128 -h 128 -o icon128.png
    echo "Icons generated successfully!"
else
    echo "Please install ImageMagick or Inkscape to generate icons"
    echo "Or use an online SVG to PNG converter:"
    echo "- https://cloudconvert.com/svg-to-png"
    echo "- https://svgtopng.com/"
    exit 1
fi
