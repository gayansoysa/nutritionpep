#!/usr/bin/env node

/**
 * NutritionPep - Deployment Testing Script
 *
 * This script runs comprehensive tests to ensure the app is ready for production
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Test configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  timeout: 10000,
  retries: 3,
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error("Request timeout"));
    }, config.timeout);

    const req = client.get(url, options, (res) => {
      clearTimeout(timeout);
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Test functions
async function testHealthEndpoint() {
  log("🏥 Testing health endpoint...", "blue");

  try {
    const response = await makeRequest(`${config.baseUrl}/api/health`);

    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);

      if (healthData.status === "healthy") {
        log("✅ Health endpoint is working", "green");
        log(`   Response time: ${healthData.checks.responseTime}`, "cyan");
        return true;
      } else {
        log("❌ Health endpoint returned unhealthy status", "red");
        log(`   Status: ${healthData.status}`, "red");
        return false;
      }
    } else {
      log(`❌ Health endpoint returned status ${response.statusCode}`, "red");
      return false;
    }
  } catch (error) {
    log(`❌ Health endpoint test failed: ${error.message}`, "red");
    return false;
  }
}

async function testMainPages() {
  log("📄 Testing main pages...", "blue");

  const pages = [
    "/",
    "/dashboard",
    "/dashboard/today",
    "/dashboard/search",
    "/dashboard/scan",
    "/dashboard/history",
    "/login",
  ];

  let passedTests = 0;

  for (const page of pages) {
    try {
      const response = await makeRequest(`${config.baseUrl}${page}`);

      if (response.statusCode === 200 || response.statusCode === 302) {
        log(`✅ ${page} - Status: ${response.statusCode}`, "green");
        passedTests++;
      } else {
        log(`❌ ${page} - Status: ${response.statusCode}`, "red");
      }
    } catch (error) {
      log(`❌ ${page} - Error: ${error.message}`, "red");
    }
  }

  log(`📊 Pages test: ${passedTests}/${pages.length} passed`, "cyan");
  return passedTests === pages.length;
}

async function testPWAManifest() {
  log("📱 Testing PWA manifest...", "blue");

  try {
    const response = await makeRequest(`${config.baseUrl}/manifest.json`);

    if (response.statusCode === 200) {
      const manifest = JSON.parse(response.data);

      const requiredFields = [
        "name",
        "short_name",
        "start_url",
        "display",
        "icons",
      ];
      const missingFields = requiredFields.filter((field) => !manifest[field]);

      if (missingFields.length === 0) {
        log("✅ PWA manifest is valid", "green");
        log(`   Name: ${manifest.name}`, "cyan");
        log(`   Icons: ${manifest.icons.length} defined`, "cyan");
        return true;
      } else {
        log("❌ PWA manifest is missing required fields", "red");
        log(`   Missing: ${missingFields.join(", ")}`, "red");
        return false;
      }
    } else {
      log(`❌ PWA manifest returned status ${response.statusCode}`, "red");
      return false;
    }
  } catch (error) {
    log(`❌ PWA manifest test failed: ${error.message}`, "red");
    return false;
  }
}

async function testSecurityHeaders() {
  log("🔒 Testing security headers...", "blue");

  try {
    const response = await makeRequest(`${config.baseUrl}/`);

    const requiredHeaders = [
      "x-frame-options",
      "x-content-type-options",
      "referrer-policy",
    ];

    let passedHeaders = 0;

    for (const header of requiredHeaders) {
      if (response.headers[header]) {
        log(`✅ ${header}: ${response.headers[header]}`, "green");
        passedHeaders++;
      } else {
        log(`❌ Missing header: ${header}`, "red");
      }
    }

    log(
      `📊 Security headers: ${passedHeaders}/${requiredHeaders.length} present`,
      "cyan"
    );
    return passedHeaders === requiredHeaders.length;
  } catch (error) {
    log(`❌ Security headers test failed: ${error.message}`, "red");
    return false;
  }
}

async function testStaticAssets() {
  log("🖼️ Testing static assets...", "blue");

  const assets = [
    "/icon-192.png",
    "/icon-512.png",
    "/apple-touch-icon.png",
    "/favicon.ico",
  ];

  let passedAssets = 0;

  for (const asset of assets) {
    try {
      const response = await makeRequest(`${config.baseUrl}${asset}`);

      if (response.statusCode === 200) {
        log(`✅ ${asset} - Available`, "green");
        passedAssets++;
      } else {
        log(`❌ ${asset} - Status: ${response.statusCode}`, "red");
      }
    } catch (error) {
      log(`❌ ${asset} - Error: ${error.message}`, "red");
    }
  }

  log(`📊 Static assets: ${passedAssets}/${assets.length} available`, "cyan");
  return passedAssets >= assets.length * 0.8; // Allow 20% failure for optional assets
}

function testEnvironmentVariables() {
  log("🌍 Testing environment variables...", "blue");

  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];

  let passedVars = 0;

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log(`✅ ${envVar} - Set`, "green");
      passedVars++;
    } else {
      log(`❌ ${envVar} - Missing`, "red");
    }
  }

  log(
    `📊 Environment variables: ${passedVars}/${requiredEnvVars.length} set`,
    "cyan"
  );
  return passedVars === requiredEnvVars.length;
}

function testBuildArtifacts() {
  log("🏗️ Testing build artifacts...", "blue");

  const requiredFiles = [
    ".next/BUILD_ID",
    ".next/static",
    "public/manifest.json",
  ];

  let passedFiles = 0;

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);

    if (fs.existsSync(filePath)) {
      log(`✅ ${file} - Exists`, "green");
      passedFiles++;
    } else {
      log(`❌ ${file} - Missing`, "red");
    }
  }

  log(
    `📊 Build artifacts: ${passedFiles}/${requiredFiles.length} present`,
    "cyan"
  );
  return passedFiles === requiredFiles.length;
}

// Main test runner
async function runTests() {
  log("🚀 NutritionPep Deployment Testing", "magenta");
  log("=====================================", "magenta");
  log(`Testing URL: ${config.baseUrl}`, "cyan");
  log("");

  const tests = [
    {
      name: "Environment Variables",
      fn: testEnvironmentVariables,
      critical: true,
    },
    { name: "Build Artifacts", fn: testBuildArtifacts, critical: true },
    { name: "Health Endpoint", fn: testHealthEndpoint, critical: true },
    { name: "Main Pages", fn: testMainPages, critical: true },
    { name: "PWA Manifest", fn: testPWAManifest, critical: false },
    { name: "Security Headers", fn: testSecurityHeaders, critical: false },
    { name: "Static Assets", fn: testStaticAssets, critical: false },
  ];

  const results = [];

  for (const test of tests) {
    log(`\n--- ${test.name} ---`, "yellow");

    try {
      const result = await test.fn();
      results.push({
        name: test.name,
        passed: result,
        critical: test.critical,
      });
    } catch (error) {
      log(`❌ Test failed with error: ${error.message}`, "red");
      results.push({
        name: test.name,
        passed: false,
        critical: test.critical,
      });
    }
  }

  // Summary
  log("\n🎯 Test Summary", "magenta");
  log("===============", "magenta");

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const criticalTests = results.filter((r) => r.critical).length;
  const passedCriticalTests = results.filter(
    (r) => r.critical && r.passed
  ).length;

  results.forEach((result) => {
    const icon = result.passed ? "✅" : "❌";
    const critical = result.critical ? " (Critical)" : "";
    log(`${icon} ${result.name}${critical}`, result.passed ? "green" : "red");
  });

  log("");
  log(`📊 Overall: ${passedTests}/${totalTests} tests passed`, "cyan");
  log(
    `🔥 Critical: ${passedCriticalTests}/${criticalTests} critical tests passed`,
    "cyan"
  );

  const allCriticalPassed = passedCriticalTests === criticalTests;
  const deploymentReady = allCriticalPassed && passedTests / totalTests >= 0.8;

  if (deploymentReady) {
    log("\n🎉 Deployment Ready!", "green");
    log("All critical tests passed and overall success rate is good.", "green");
    process.exit(0);
  } else {
    log("\n⚠️ Deployment Not Ready", "red");
    if (!allCriticalPassed) {
      log("Critical tests failed. Fix these issues before deploying.", "red");
    } else {
      log(
        "Too many non-critical tests failed. Consider fixing before deploying.",
        "yellow"
      );
    }
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    log(`💥 Test runner failed: ${error.message}`, "red");
    process.exit(1);
  });
}

module.exports = { runTests, config };
