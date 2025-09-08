import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Allow any types during development
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused variables during development
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow unescaped entities in JSX
      "react/no-unescaped-entities": "warn",
      // Allow img elements (can be optimized later)
      "@next/next/no-img-element": "warn",
      // Allow HTML links for pages (can be optimized later)
      "@next/next/no-html-link-for-pages": "warn",
      // Allow missing dependencies in useEffect
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
