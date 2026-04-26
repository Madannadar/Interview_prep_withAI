function behaviorConfidenceModifier(behavior) {
  const b = behavior && typeof behavior === "object" ? behavior : {};

  const typingSpeed = typeof b.typingSpeed === "number" ? b.typingSpeed : 0;
  const pauseCount = typeof b.pauseCount === "number" ? b.pauseCount : 0;
  const tabSwitches = typeof b.tabSwitches === "number" ? b.tabSwitches : 0;

  let modifier = 0;
  if (typingSpeed > 50) modifier += 0.1;
  if (pauseCount > 5) modifier -= 0.1;
  if (tabSwitches > 2) modifier -= 0.2;

  return {
    modifier,
    details: { typingSpeed, pauseCount, tabSwitches },
  };
}

module.exports = { behaviorConfidenceModifier };

