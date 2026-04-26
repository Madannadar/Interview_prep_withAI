const express = require("express");

const { pickApproachFromText } = require("./modules/nlpAnalysis");
const { analyzeCodePatterns } = require("./modules/codeAnalysis");
const { behaviorConfidenceModifier } = require("./modules/behaviorAnalysis");
const { fuseSignals } = require("./fusion");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  return res.json({
    status: "ok",
    message: "Cognitive analysis API is running.",
    endpoints: {
      cognitiveAnalysis: {
        method: "POST",
        path: "/cognitive-analysis",
      },
    },
  });
});

app.post("/cognitive-analysis", (req, res) => {
  try {
    console.log("[/cognitive-analysis] request body:", req.body);

    const { text, code, behavior } = req.body || {};
    if (typeof text !== "string" || typeof code !== "string" || typeof behavior !== "object" || behavior === null) {
      return res.status(400).json({
        error: "Invalid input. Expected { text: string, code: string, behavior: { typingSpeed:number, pauseCount:number, tabSwitches:number } }",
      });
    }

    const nlp = pickApproachFromText(text);
    const codeSignal = analyzeCodePatterns(code);
    const behaviorSignal = behaviorConfidenceModifier(behavior);

    const fused = fuseSignals({ nlp, code: codeSignal, behavior: behaviorSignal });

    const response = {
      approach: fused.approach,
      confidence: round2(fused.confidence),
      signals: {
        nlp,
        code: codeSignal,
        behavior: behaviorSignal,
      },
    };

    console.log("[/cognitive-analysis] response:", response);
    return res.json(response);
  } catch (err) {
    console.error("[/cognitive-analysis] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Express API listening on http://localhost:${PORT}`);
});

function round2(n) {
  return Math.round(n * 100) / 100;
}

