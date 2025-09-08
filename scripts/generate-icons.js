#!/usr/bin/env node

/**
 * NutritionPep - Icon Generation Script
 *
 * This script generates all required app icons from the base SVG
 * For production, you should use proper design tools or services like:
 * - Figma with icon export plugins
 * - Adobe Illustrator
 * - Online services like favicon.io or realfavicongenerator.net
 */

const fs = require("fs");
const path = require("path");

// Icon sizes needed for the app
const iconSizes = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 48, name: "favicon-48x48.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 180, name: "apple-touch-icon-precomposed.png" },
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
];

// Simple SVG to base64 conversion for placeholder icons
function generatePlaceholderIcon(size, name) {
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="256" fill="#10B981"/>
      <circle cx="256" cy="256" r="200" fill="#059669" opacity="0.8"/>
      <g transform="translate(256, 256)">
        <path d="M-40 -20 C-40 -60, -20 -80, 0 -80 C20 -80, 40 -60, 40 -20 C40 20, 20 60, 0 60 C-20 60, -40 20, -40 -20 Z" fill="#FFFFFF"/>
        <path d="M5 -75 C15 -85, 25 -80, 30 -70 C25 -75, 15 -75, 5 -75 Z" fill="#22C55E"/>
        <rect x="-2" y="-85" width="4" height="10" fill="#8B5CF6" rx="2"/>
        <circle cx="50" cy="30" r="25" fill="#FFFFFF" opacity="0.9"/>
        <text x="50" y="35" text-anchor="middle" fill="#059669" font-family="Arial, sans-serif" font-size="16" font-weight="bold">NP</text>
      </g>
    </svg>
  `;

  return svgContent.trim();
}

// Generate favicon.ico instruction
function generateFaviconInstructions() {
  return `
# Favicon Generation Instructions

To generate a proper favicon.ico file, you can:

1. **Use online tools:**
   - https://favicon.io/favicon-converter/
   - https://realfavicongenerator.net/
   - https://www.favicon-generator.org/

2. **Use command line tools:**
   \`\`\`bash
   # Install ImageMagick
   brew install imagemagick
   
   # Convert PNG to ICO
   convert icon-192.png -resize 16x16 favicon-16.png
   convert icon-192.png -resize 32x32 favicon-32.png
   convert icon-192.png -resize 48x48 favicon-48.png
   convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
   \`\`\`

3. **Use the provided SVG:**
   - Upload public/icon.svg to any favicon generator
   - Download the generated files
   - Replace the placeholder files in public/

## Required Files:
- favicon.ico (16x16, 32x32, 48x48 combined)
- apple-touch-icon.png (180x180)
- icon-192.png (192x192)
- icon-512.png (512x512)
`;
}

// Main function
function main() {
  console.log("🎨 NutritionPep Icon Generation");
  console.log("================================");

  const publicDir = path.join(__dirname, "..", "public");

  // Check if public directory exists
  if (!fs.existsSync(publicDir)) {
    console.error("❌ Public directory not found");
    process.exit(1);
  }

  console.log("📝 Generating placeholder icons...");

  // Generate placeholder SVG icons for each size
  iconSizes.forEach(({ size, name }) => {
    const svgContent = generatePlaceholderIcon(size, name);
    const svgPath = path.join(publicDir, name.replace(".png", ".svg"));

    try {
      fs.writeFileSync(svgPath, svgContent);
      console.log(`✅ Generated ${name.replace(".png", ".svg")}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  });

  // Generate instructions file
  const instructionsPath = path.join(publicDir, "ICON_GENERATION.md");
  fs.writeFileSync(instructionsPath, generateFaviconInstructions());
  console.log("✅ Generated ICON_GENERATION.md");

  console.log("");
  console.log("🎯 Next Steps:");
  console.log("1. Use the generated SVG files as templates");
  console.log("2. Create proper PNG/ICO files using design tools");
  console.log("3. Replace placeholder icons with final versions");
  console.log("4. Test PWA installation on mobile devices");
  console.log("");
  console.log("📖 See public/ICON_GENERATION.md for detailed instructions");
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generatePlaceholderIcon, iconSizes };
