// Builds index.html from src/: minifies the CSS and inlines it, minifies the JS.
// Usage: node build.mjs   (no dependencies)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const minCss = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>~])\s*/g, '$1')
  .replace(/;}/g, '}')
  .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
  .trim();

// Calc/clamp need spaces around + and -, which the rules above leave intact.
const css = minCss(readFileSync('src/styles.css', 'utf8')).replaceAll('../assets/', 'assets/');

const minJs = (js) => js
  .replace(/^\s*\/\/.*$/gm, '')
  .split('\n').map((l) => l.trim()).filter(Boolean).join('\n');

mkdirSync('assets/js', { recursive: true });
writeFileSync('assets/js/main.min.js', minJs(readFileSync('src/main.js', 'utf8')));

const html = readFileSync('src/index.html', 'utf8')
  .replace('<!--INLINE_CSS-->', css)
  .replace(/<!--(?!\[)[\s\S]*?-->\n?/g, '');
writeFileSync('index.html', html);
console.log(`index.html written · css ${(css.length / 1024).toFixed(1)} KB inline`);
