/**
 * postinstall.js
 * 
 * Patches buffer-equal-constant-time for Node.js v22+ compatibility.
 * SlowBuffer.prototype was removed in Node 22 — this script guards it.
 * 
 * Run automatically via "postinstall" in package.json scripts.
 */

const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  'node_modules',
  'buffer-equal-constant-time',
  'index.js'
);

if (!fs.existsSync(target)) {
  console.log('[postinstall] buffer-equal-constant-time not found, skipping patch.');
  process.exit(0);
}

const original = fs.readFileSync(target, 'utf8');

// Check if already patched
if (original.includes('SlowBuffer || Buffer')) {
  console.log('[postinstall] buffer-equal-constant-time already patched ✓');
  process.exit(0);
}

const patched = original
  // Guard the SlowBuffer declaration
  .replace(
    "var SlowBuffer = require('buffer').SlowBuffer;",
    "// Node.js v22+ removed SlowBuffer — fall back to Buffer\nvar SlowBuffer = require('buffer').SlowBuffer || Buffer;"
  )
  // Fix install() — don't access SlowBuffer.prototype directly
  .replace(
    "Buffer.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {\n    return bufferEq(this, that);\n  };",
    [
      "Buffer.prototype.equal = function equal(that) {",
      "    return bufferEq(this, that);",
      "  };",
      "  if (SlowBuffer !== Buffer && SlowBuffer && SlowBuffer.prototype) {",
      "    SlowBuffer.prototype.equal = Buffer.prototype.equal;",
      "  }",
    ].join('\n')
  )
  // Fix the origSlowBufEqual assignment
  .replace(
    "var origSlowBufEqual = SlowBuffer.prototype.equal;",
    "var origSlowBufEqual = (SlowBuffer && SlowBuffer !== Buffer && SlowBuffer.prototype)\n  ? SlowBuffer.prototype.equal : undefined;"
  )
  // Fix restore()
  .replace(
    "SlowBuffer.prototype.equal = origSlowBufEqual;",
    "if (origSlowBufEqual !== undefined && SlowBuffer && SlowBuffer.prototype) {\n    SlowBuffer.prototype.equal = origSlowBufEqual;\n  }"
  );

fs.writeFileSync(target, patched, 'utf8');
console.log('[postinstall] Patched buffer-equal-constant-time for Node.js v22+ ✓');
