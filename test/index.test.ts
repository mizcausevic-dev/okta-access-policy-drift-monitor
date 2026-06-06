import { describe, expect, it } from "vitest";
import sample from "../fixtures/okta-policy-sample.json" with { type: "json" };
import { buildMonitor, classifyTier, renderMarkdown, scoreLane } from "../src/index.js";

describe("okta access policy drift monitor", () => {
  it("classifies drift tiers", () => {
    expect(classifyTier(84)).toBe("LOCKDOWN");
    expect(classifyTier(70)).toBe("ESCALATE");
    expect(classifyTier(50)).toBe("WATCH");
    expect(classifyTier(20)).toBe("CONTROLLED");
  });

  it("scores access policy drift", () => {
    const lane = scoreLane(sample.lanes[0]);
    expect(lane.driftScore).toBeGreaterThan(50);
    expect(lane.route).toContain("exception");
  });

  it("builds a sorted monitor", () => {
    const monitor = buildMonitor(sample);
    expect(monitor.summary.laneCount).toBe(4);
    expect(monitor.lanes[0].driftScore).toBeGreaterThanOrEqual(monitor.lanes[1].driftScore);
    expect(monitor.summary.primaryRecommendation).toContain(monitor.summary.highestDriftLane);
  });

  it("renders markdown output", () => {
    const markdown = renderMarkdown(buildMonitor(sample));
    expect(markdown).toContain("| Lane | Tier | Drift score |");
    expect(markdown).toContain("Privileged finance applications");
  });
});
