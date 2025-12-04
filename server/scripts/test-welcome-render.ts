import { ANSIRenderer } from '../src/ansi/ANSIRenderer.js';
import { ANSIFrameValidator } from '../src/ansi/ANSIFrameValidator.js';

const renderer = new ANSIRenderer();
const welcome = renderer.render('welcome.ans', {
  node: '1',
  max_nodes: '4',
  caller_count: '0',
});

console.log('=== Welcome Screen Output ===');
console.log(welcome);
console.log('\n=== Validation Results ===');

const results = ANSIFrameValidator.validateMultiple(welcome);
console.log(`Found ${results.length} frames`);

results.forEach((result, index) => {
  console.log(`\nFrame ${index + 1}:`);
  console.log(`  Valid: ${result.valid}`);
  console.log(`  Width: ${result.width}`);
  console.log(`  Height: ${result.height}`);
  if (!result.valid) {
    console.log(`  Issues:`);
    result.issues.forEach(issue => console.log(`    - ${issue}`));
  }
});
