#!/usr/bin/env node

/**
 * Post-build optimization script
 * Run this after building to optimize your bundle
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting post-build optimization...');

// Check if dist folder exists
const distPath = path.join(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist folder not found. Run "npm run build" first.');
  process.exit(1);
}

// Analyze bundle size
const statsPath = path.join(distPath, 'stats.html');
if (fs.existsSync(statsPath)) {
  console.log('✅ Bundle analysis available at:', statsPath);
}

// Check for large files
const maxSize = 500 * 1024; // 500KB
let largeFiles = [];

function checkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      checkDirectory(filePath);
    } else if (stat.size > maxSize) {
      largeFiles.push({
        path: filePath.replace(distPath, ''),
        size: (stat.size / 1024).toFixed(2) + 'KB'
      });
    }
  });
}

checkDirectory(distPath);

if (largeFiles.length > 0) {
  console.log('⚠️  Large files detected:');
  largeFiles.forEach(file => {
    console.log(`   ${file.path}: ${file.size}`);
  });
  console.log('💡 Consider code splitting or lazy loading for these files.');
} else {
  console.log('✅ No large files detected. Bundle size looks good!');
}

console.log('🎉 Build optimization complete!');
console.log('📊 Run "npm run build:analyze" to see detailed bundle analysis.');
