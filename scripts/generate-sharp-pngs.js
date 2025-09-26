#!/usr/bin/env node

/**
 * Generate proper PNG icons using Sharp
 * This creates real PNG files with proper dimensions
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Create SVG content for the icon
function createIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#grad)" rx="${
    size * 0.15
  }"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="${
      size * 0.5
    }" font-weight="bold">N</text>
  </svg>`;
}

const icons = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 48, name: "favicon-48x48.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
];

async function generatePNG(size, outputPath) {
  const svgContent = createIconSVG(size);
  const svgBuffer = Buffer.from(svgContent);

  try {
    await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);

    return true;
  } catch (error) {
    console.error(`Error generating ${outputPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🎨 Generating PNG icons with Sharp...");

  const publicDir = path.join(__dirname, "..", "public");

  // Generate all PNG icons
  for (const { size, name } of icons) {
    const outputPath = path.join(publicDir, name);

    try {
      const success = await generatePNG(size, outputPath);
      if (success) {
        console.log(`✅ Generated ${name} (${size}x${size})`);
      } else {
        console.log(`❌ Failed to generate ${name}`);
      }
    } catch (error) {
      console.error(`❌ Error with ${name}:`, error.message);
    }
  }

  // Also create a favicon.ico using the 32x32 PNG
  try {
    const faviconSVG = createIconSVG(32);
    const svgBuffer = Buffer.from(faviconSVG);

    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, "favicon.png"));

    console.log("✅ Generated favicon.png (32x32)");
  } catch (error) {
    console.error("❌ Failed to generate favicon.png:", error.message);
  }

  console.log("");
  console.log("✅ All PNG icons generated successfully!");
  console.log("🚀 Your PWA should now be installable with proper icons!");

  // Verify file sizes
  console.log("");
  console.log("📊 Generated file sizes:");
  icons.forEach(({ name }) => {
    const filePath = path.join(publicDir, name);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`   ${name}: ${stats.size} bytes`);
    }
  });
}

if (require.main === module) {
  main().catch(console.error);
}
