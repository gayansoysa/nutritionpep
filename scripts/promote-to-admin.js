#!/usr/bin/env node

/**
 * Admin Promotion Utility
 *
 * This script helps promote a user to admin role by generating the SQL command
 * that needs to be run in Supabase SQL Editor.
 *
 * Usage:
 *   node scripts/promote-to-admin.js your-email@example.com
 */

const email = process.argv[2];

if (!email) {
  console.log("\n🔐 Admin Promotion Utility\n");
  console.log("Usage: node scripts/promote-to-admin.js <email>");
  console.log("Example: node scripts/promote-to-admin.js user@example.com\n");
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error("❌ Invalid email format");
  process.exit(1);
}

const sqlCommand = `-- Promote ${email} to admin
UPDATE public.profiles 
SET role = 'admin'::public.user_role,
    updated_at = NOW()
WHERE id = (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = '${email}'
);

-- Verify the update worked
SELECT 
    au.email,
    p.id,
    p.full_name,
    p.role,
    p.updated_at
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE au.email = '${email}';`;

console.log("\n🔐 Admin Promotion SQL Command\n");
console.log("📧 Email:", email);
console.log(
  "\n📋 Copy and paste this SQL command into your Supabase SQL Editor:\n"
);
console.log("─".repeat(80));
console.log(sqlCommand);
console.log("─".repeat(80));
console.log("\n📝 Steps:");
console.log("1. Go to your Supabase Dashboard");
console.log("2. Navigate to SQL Editor");
console.log("3. Paste the SQL command above");
console.log('4. Click "Run"');
console.log("5. Refresh your admin page");
console.log(
  "\n✅ After running the SQL command, you will have admin access!\n"
);
