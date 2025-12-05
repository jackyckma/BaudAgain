
import { ANSIWidthCalculator } from '../src/ansi/ANSIWidthCalculator.js';

const chars = [
  { char: '✓', name: 'Check Mark' },
  { char: '💡', name: 'Light Bulb' },
  { char: '📬', name: 'Mailbox' },
  { char: '⚠', name: 'Warning' },
  { char: 'a', name: 'a' },
  { char: '中', name: 'Chinese char' },
];

console.log('Character Width Analysis:');
console.log('-------------------------');

chars.forEach(({ char, name }) => {
  const width = ANSIWidthCalculator.calculate(char);
  const codePoint = char.codePointAt(0)?.toString(16).toUpperCase();
  console.log(`Char: ${char} (U+${codePoint}) | Name: ${name.padEnd(15)} | Calculated Width: ${width}`);
});

