function pickApproachFromText(text) {
  const t = String(text || "").toLowerCase();

  const rules = [
    { keywords: ["loop", "nested"], approach: "Brute Force" },
    { keywords: ["window", "expand", "shrink"], approach: "Sliding Window" },
    { keywords: ["recursion", "backtrack"], approach: "Recursion" },
    { keywords: ["dp", "memo"], approach: "Dynamic Programming" },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((k) => t.includes(k))) {
      // Simple heuristic: more keyword hits => higher confidence
      const hits = rule.keywords.reduce((acc, k) => acc + (t.includes(k) ? 1 : 0), 0);
      const confidence = clamp(0.5 + 0.2 * hits, 0.5, 0.9);
      return { approach: rule.approach, confidence };
    }
  }

  return { approach: "Unknown", confidence: 0.5 };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

module.exports = { pickApproachFromText };

