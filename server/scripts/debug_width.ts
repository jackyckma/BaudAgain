
import { ANSIWidthCalculator } from '../src/ansi/ANSIWidthCalculator.js';

const text = '🎨 A cute dragon';
const icon = '🎨';
const iconCode = icon.codePointAt(0)?.toString(16);

console.log(`Testing string: "${text}"`);
console.log(`Icon code point: U+${iconCode}`);
console.log(`Calculated width of icon: ${ANSIWidthCalculator.calculate(icon)}`);
console.log(`Calculated width of full text: ${ANSIWidthCalculator.calculate(text)}`);

const segments = Array.from(new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text));
console.log('Segments:');
segments.forEach((s, i) => {
    const code = s.segment.codePointAt(0)?.toString(16);
    console.log(`  ${i}: "${s.segment}" (U+${code}) - Width: ${ANSIWidthCalculator.calculate(s.segment)}`);
});

