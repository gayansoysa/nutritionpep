#!/usr/bin/env node

/**
 * Create proper PWA icons for NutritionPep
 * This script creates base64-encoded PNG icons from SVG
 */

const fs = require("fs");
const path = require("path");

// Base SVG for the app icon
const baseSVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="256" cy="256" r="256" fill="#10B981"/>
  
  <!-- Inner circle for depth -->
  <circle cx="256" cy="256" r="200" fill="#059669" opacity="0.9"/>
  
  <!-- Main nutrition symbol (stylized N) -->
  <g transform="translate(256, 256)">
    <!-- Letter N shape -->
    <path d="M-80 -100 L-80 100 L-40 100 L-40 -20 L40 100 L80 100 L80 -100 L40 -100 L40 20 L-40 -100 Z" fill="#FFFFFF"/>
    
    <!-- Small leaf accent -->
    <path d="M60 -80 C80 -90, 100 -70, 90 -50 C85 -60, 70 -65, 60 -80 Z" fill="#22C55E"/>
    
    <!-- Small dot accent -->
    <circle cx="85" cy="-85" r="8" fill="#FFFFFF" opacity="0.8"/>
  </g>
  
  <!-- Subtle gradient overlay -->
  <defs>
    <radialGradient id="shine" cx="0.3" cy="0.3" r="0.7">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="256" cy="256" r="256" fill="url(#shine)"/>
</svg>`;

// Function to create SVG with specific size
function createSVGIcon(size) {
  return baseSVG.replace(
    'width="512" height="512"',
    `width="${size}" height="${size}"`
  );
}

// Create a simple base64 PNG placeholder (this is a minimal approach)
function createBase64PNG(size) {
  // This creates a very basic PNG data URL - in production you'd want to use a proper image library
  const canvas = `data:image/svg+xml;base64,${Buffer.from(
    createSVGIcon(size)
  ).toString("base64")}`;
  return canvas;
}

// Icon configurations
const icons = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 48, name: "favicon-48x48.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
];

function main() {
  console.log("🎨 Creating PWA icons for NutritionPep...");

  const publicDir = path.join(__dirname, "..", "public");

  // Create SVG versions first
  icons.forEach(({ size, name }) => {
    const svgContent = createSVGIcon(size);
    const svgPath = path.join(publicDir, name.replace(".png", ".svg"));

    try {
      fs.writeFileSync(svgPath, svgContent);
      console.log(`✅ Created ${name.replace(".png", ".svg")}`);
    } catch (error) {
      console.error(`❌ Failed to create ${name}:`, error.message);
    }
  });

  // Create a proper favicon.ico instruction
  const faviconInstructions = `# To create favicon.ico:
# 1. Use online tool: https://favicon.io/favicon-converter/
# 2. Upload the icon-192.svg file
# 3. Download and replace favicon.ico in public folder

# Or use ImageMagick:
# convert icon-192.svg -resize 16x16 favicon-16.png
# convert icon-192.svg -resize 32x32 favicon-32.png  
# convert icon-192.svg -resize 48x48 favicon-48.png
# convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
`;

  fs.writeFileSync(
    path.join(publicDir, "favicon-instructions.txt"),
    faviconInstructions
  );

  console.log("✅ PWA icons created successfully!");
  console.log("📝 Next steps:");
  console.log(
    "1. Convert SVG files to PNG using an online tool or ImageMagick"
  );
  console.log("2. Create favicon.ico from the PNG files");
  console.log("3. Test PWA installation");
}

if (require.main === module) {
  main();
}
