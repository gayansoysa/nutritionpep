
# Favicon Generation Instructions

To generate a proper favicon.ico file, you can:

1. **Use online tools:**
   - https://favicon.io/favicon-converter/
   - https://realfavicongenerator.net/
   - https://www.favicon-generator.org/

2. **Use command line tools:**
   ```bash
   # Install ImageMagick
   brew install imagemagick
   
   # Convert PNG to ICO
   convert icon-192.png -resize 16x16 favicon-16.png
   convert icon-192.png -resize 32x32 favicon-32.png
   convert icon-192.png -resize 48x48 favicon-48.png
   convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
   ```

3. **Use the provided SVG:**
   - Upload public/icon.svg to any favicon generator
   - Download the generated files
   - Replace the placeholder files in public/

## Required Files:
- favicon.ico (16x16, 32x32, 48x48 combined)
- apple-touch-icon.png (180x180)
- icon-192.png (192x192)
- icon-512.png (512x512)
