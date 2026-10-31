// Syntax-check every inline <script> in index.html with new Function (GAME_CANON_SPEC tech rule).
// Usage: node tests/check-inline.js [file]
const fs = require("fs");
const file = process.argv[2] || require("path").join(__dirname, "..", "index.html");
const html = fs.readFileSync(file, "utf8");
const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
let m, n = 0, bad = 0;
while ((m = re.exec(html))) {
  const attrs = m[1] || "";
  if (/\bsrc=/.test(attrs) || /type=["']?(module|application\/ld\+json|text\/template)/.test(attrs)) continue;
  n++;
  try { new Function(m[2]); } catch (e) { bad++; console.log("script #" + n + " at char " + m.index + ": " + e.message); }
}
console.log(n + " inline scripts checked, " + bad + " with syntax errors");
process.exit(bad ? 1 : 0);
