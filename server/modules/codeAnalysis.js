function analyzeCodePatterns(code) {
  const c = String(code || "");

  const hasNestedForLoops = /for\s*\([^)]*\)\s*\{[\s\S]*?\bfor\s*\([^)]*\)/m.test(c);
  if (hasNestedForLoops) return { approach: "Brute Force", confidence: 0.85 };

  const hasWhile = /\bwhile\s*\(/m.test(c);
  const mentionsWindowVars = /\b(left|right|start|end|l|r)\b/m.test(c);
  if (hasWhile && mentionsWindowVars) return { approach: "Sliding Window", confidence: 0.8 };

  const recursive = detectRecursion(c);
  if (recursive.isRecursive) return { approach: "Recursion", confidence: 0.8 };

  return { approach: "Unknown", confidence: 0.5 };
}

function detectRecursion(code) {
  // Heuristic: look for "function name(" then later "name(" inside its body.
  // Works for common JS function declarations / function expressions.
  const fnDecl = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let match;
  while ((match = fnDecl.exec(code)) !== null) {
    const name = match[1];
    const startIdx = match.index;
    const bodyStart = code.indexOf("{", fnDecl.lastIndex);
    if (bodyStart === -1) continue;

    const bodyEnd = findMatchingBrace(code, bodyStart);
    if (bodyEnd === -1) continue;

    const body = code.slice(bodyStart, bodyEnd + 1);
    const callRe = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "m");
    if (callRe.test(body)) return { isRecursive: true, name, at: startIdx };
  }

  // Also handle arrow functions assigned to const/let/var:
  // const foo = (...) => { ... foo(...) ... }
  const arrowDecl = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/g;
  while ((match = arrowDecl.exec(code)) !== null) {
    const name = match[1];
    const startIdx = match.index;
    const bodyStart = code.indexOf("{", arrowDecl.lastIndex - 1);
    if (bodyStart === -1) continue;

    const bodyEnd = findMatchingBrace(code, bodyStart);
    if (bodyEnd === -1) continue;

    const body = code.slice(bodyStart, bodyEnd + 1);
    const callRe = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "m");
    if (callRe.test(body)) return { isRecursive: true, name, at: startIdx };
  }

  return { isRecursive: false };
}

function findMatchingBrace(str, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    const ch = str[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { analyzeCodePatterns };

