function fuseSignals({ nlp, code, behavior }) {
  const codeConfidence = toNumber(code?.confidence, 0.5);
  const nlpConfidence = toNumber(nlp?.confidence, 0.5);
  const behaviorModifier = toNumber(behavior?.modifier, 0);

  let confidence = 0.5 * codeConfidence + 0.4 * nlpConfidence + behaviorModifier;
  confidence = clamp(confidence, 0, 1);

  const approach =
    (code?.approach && code.approach !== "Unknown" ? code.approach : null) ??
    (nlp?.approach && nlp.approach !== "Unknown" ? nlp.approach : "Unknown");

  return { approach, confidence };
}

function toNumber(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

module.exports = { fuseSignals };

