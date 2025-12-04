#!/usr/bin/env tsx
/**
 * Verify ANSI Frame Rendering
 * 
 * This script tests that ANSI frames render correctly in a real terminal
 */

import { ANSIRenderer } from './src/ansi/ANSIRenderer.js';
import { ANSIFrameValidator } from './src/ansi/ANSIFrameValidator.js';

console.clear();

const renderer = new ANSIRenderer('data/ansi');

console.log('\x1b[36m\x1b[1m');
console.log('═'.repeat(80));
console.log('🖥️  ANSI FRAME RENDERING VERIFICATION');
console.log('═'.repeat(80));
console.log('\x1b[0m\n');

// Test 1: Welcome Screen
console.log('\x1b[33m▶ Test 1: Welcome Screen\x1b[0m\n');

const welcome = renderer.render('welcome.ans', {
  node: '1',
  max_nodes: '4',
  caller_count: '0',
});

console.log(welcome);
console.log('');

const welcomeResult = ANSIFrameValidator.validateMultiple(welcome);
const welcomeValid = welcomeResult.every(r => r.valid);

if (welcomeValid) {
  console.log('\x1b[32m✓ Welcome screen renders correctly\x1b[0m');
  console.log(`  Dimensions: ${welcomeResult[0].width}x${welcomeResult[0].height}`);
} else {
  console.log('\x1b[31m✗ Welcome screen has issues:\x1b[0m');
  welcomeResult.forEach((result, i) => {
    if (!result.valid) {
      console.log(`  Frame ${i + 1}:`);
      result.issues.forEach(issue => console.log(`    • ${issue}`));
    }
  });
}

console.log('\n\x1b[36m' + '─'.repeat(80) + '\x1b[0m\n');

// Test 2: Goodbye Screen
console.log('\x1b[33m▶ Test 2: Goodbye Screen\x1b[0m\n');

const goodbye = renderer.render('goodbye.ans');

console.log(goodbye);
console.log('');

const goodbyeResult = ANSIFrameValidator.validate(goodbye);

if (goodbyeResult.valid) {
  console.log('\x1b[32m✓ Goodbye screen renders correctly\x1b[0m');
  console.log(`  Dimensions: ${goodbyeResult.width}x${goodbyeResult.height}`);
} else {
  console.log('\x1b[31m✗ Goodbye screen has issues:\x1b[0m');
  goodbyeResult.issues.forEach(issue => console.log(`    • ${issue}`));
}

console.log('\n\x1b[36m' + '─'.repeat(80) + '\x1b[0m\n');

// Test 3: Variable Consistency
console.log('\x1b[33m▶ Test 3: Variable Value Consistency\x1b[0m\n');

const testCases = [
  { node: '1', max_nodes: '4', caller_count: '0', label: 'Min values' },
  { node: '10', max_nodes: '10', caller_count: '50', label: 'Medium values' },
  { node: '100', max_nodes: '100', caller_count: '999', label: 'Max values' },
];

let allValid = true;

testCases.forEach(testCase => {
  const frame = renderer.render('welcome.ans', testCase);
  const results = ANSIFrameValidator.validateMultiple(frame);
  const isValid = results.every(r => r.valid);
  
  const status = isValid ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`  ${status} ${testCase.label}: Node ${testCase.node}/${testCase.max_nodes}, ${testCase.caller_count} callers`);
  
  if (!isValid) {
    allValid = false;
  }
});

console.log('');

if (allValid) {
  console.log('\x1b[32m✓ All variable combinations produce valid frames\x1b[0m');
} else {
  console.log('\x1b[31m✗ Some variable combinations produce invalid frames\x1b[0m');
}

console.log('\n\x1b[36m');
console.log('═'.repeat(80));
console.log(allValid && welcomeValid && goodbyeResult.valid 
  ? '✅ ALL TESTS PASSED - ANSI rendering is working correctly!' 
  : '❌ SOME TESTS FAILED - Please review the issues above');
console.log('═'.repeat(80));
console.log('\x1b[0m\n');
