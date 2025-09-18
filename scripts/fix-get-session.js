#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Files to fix and their patterns
const filesToFix = [
  // Server components - replace getSession with getUser
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/admin/page.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/onboarding/layout.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/recipes/layout.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/profile/page.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/admin/foods/page.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/dashboard/analytics/page.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/admin/layout.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/dashboard/page.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/dashboard/settings/page.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/page.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/dashboard/today/page.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/dashboard/history/page.tsx",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/dashboard/layout.tsx",
];

// API routes to fix
const apiRoutesToFix = [
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/api/recipe-collections/route.ts",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/api/recipe-collections/[id]/recipes/route.ts",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/api/recipe-collections/[id]/route.ts",
  "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/src/app/api/setup-favorites/route.ts",
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Pattern 1: Standard server component pattern
    const pattern1 =
      /const\s*{\s*data:\s*{\s*session\s*},?\s*}\s*=\s*await\s+supabase\.auth\.getSession\(\);/g;
    if (pattern1.test(content)) {
      content = content.replace(
        pattern1,
        "const { data: { user } } = await supabase.auth.getUser();"
      );
      modified = true;
      console.log(`Fixed pattern 1 in ${filePath}`);
    }

    // Pattern 2: Session variable usage
    content = content.replace(/\bsession\b(?!\s*[=:])/g, "user");

    // Pattern 3: session?.user -> user
    content = content.replace(/session\?\.user/g, "user");

    // Pattern 4: Debug auth page specific pattern
    const debugPattern =
      /const\s*{\s*data:\s*sessionData,\s*error:\s*sessionError\s*}\s*=\s*await\s+supabase\.auth\.getSession\(\);/g;
    if (debugPattern.test(content)) {
      content = content.replace(
        debugPattern,
        "const { data: userData, error: userError } = await supabase.auth.getUser();"
      );
      content = content.replace(/sessionData/g, "userData");
      content = content.replace(/sessionError/g, "userError");
      content = content.replace(/sessionData\.session/g, "userData");
      modified = true;
      console.log(`Fixed debug pattern in ${filePath}`);
    }

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

// Fix all files
console.log("🔧 Fixing getSession() calls...\n");

[...filesToFix, ...apiRoutesToFix].forEach(fixFile);

console.log("\n✅ All files processed!");
