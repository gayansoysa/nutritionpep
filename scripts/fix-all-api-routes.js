#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Get all API route files that contain getSession()
function findApiRoutesWithGetSession() {
  try {
    const result = execSync(
      'find /Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/api -name "*.ts" -exec grep -l "getSession()" {} \\;',
      { encoding: "utf8" }
    );
    return result
      .trim()
      .split("\n")
      .filter((file) => file.length > 0);
  } catch (error) {
    console.error("Error finding files:", error.message);
    return [];
  }
}

function fixApiRoute(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Pattern 1: Standard API route pattern
    const sessionPattern =
      /const\s*{\s*data:\s*{\s*session\s*},?\s*error:\s*sessionError\s*}\s*=\s*await\s+supabase\.auth\.getSession\(\);/g;
    if (sessionPattern.test(content)) {
      content = content.replace(
        sessionPattern,
        "const { data: { user }, error: userError } = await supabase.auth.getUser();"
      );
      modified = true;
    }

    // Pattern 2: Alternative session pattern
    const altSessionPattern =
      /const\s*{\s*data:\s*{\s*session\s*}\s*}\s*=\s*await\s+supabase\.auth\.getSession\(\);/g;
    if (altSessionPattern.test(content)) {
      content = content.replace(
        altSessionPattern,
        "const { data: { user } } = await supabase.auth.getUser();"
      );
      modified = true;
    }

    // Fix variable references
    content = content.replace(/sessionError/g, "userError");
    content = content.replace(/if\s*\(\s*sessionError\s*\)/g, "if (userError)");
    content = content.replace(
      /console\.error\([^)]*"Session error"[^)]*sessionError/g,
      'console.error("User error:", userError'
    );
    content = content.replace(/if\s*\(\s*!session\s*\)/g, "if (!user)");
    content = content.replace(/session\.user\.id/g, "user.id");
    content = content.replace(/session\.user/g, "user");
    content = content.replace(/"No session found/g, '"No user found');
    content = content.replace(/Session found for user/g, "User found");

    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⚠️  No changes needed in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Main execution
console.log("🔍 Finding API routes with getSession() calls...\n");

const apiFiles = findApiRoutesWithGetSession();
console.log(`Found ${apiFiles.length} API route files to fix:\n`);

apiFiles.forEach((file) => {
  console.log(`📁 ${file}`);
});

console.log("\n🔧 Fixing API routes...\n");

apiFiles.forEach(fixApiRoute);

console.log("\n✅ All API routes processed!");
