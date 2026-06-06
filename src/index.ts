import { readFile } from "node:fs/promises";

export type DriftTier = "CONTROLLED" | "WATCH" | "ESCALATE" | "LOCKDOWN";

export interface PolicyLane {
  name: string;
  owner: string;
  audience: string;
  appCount: number;
  privilegedAppCount: number;
  mfaCoverage: number;
  staleExceptionCount: number;
  dormantUserCount: number;
  riskySignInRate: number;
  policyAgeDays: number;
  groupSprawlScore: number;
  evidenceCompleteness: number;
  businessCriticality: number;
  narrative: string;
  nextAction: string;
}

export interface PolicyInput {
  generatedAt: string;
  organization: string;
  lanes: PolicyLane[];
}

export interface ScoredPolicyLane extends PolicyLane {
  driftScore: number;
  tier: DriftTier;
  route: string;
}

export interface DriftMonitor {
  generatedAt: string;
  organization: string;
  lanes: ScoredPolicyLane[];
  summary: {
    laneCount: number;
    highestDriftLane: string;
    meanDriftScore: number;
    totalPrivilegedApps: number;
    totalStaleExceptions: number;
    primaryRecommendation: string;
  };
}

const clamp = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value));

export function classifyTier(score: number): DriftTier {
  if (score >= 78) return "LOCKDOWN";
  if (score >= 62) return "ESCALATE";
  if (score >= 42) return "WATCH";
  return "CONTROLLED";
}

export function scoreLane(lane: PolicyLane): ScoredPolicyLane {
  const mfaGap = 100 - lane.mfaCoverage;
  const exceptionPressure = clamp(lane.staleExceptionCount * 5);
  const dormantPressure = clamp(lane.dormantUserCount * 1.4);
  const privilegedPressure = clamp((lane.privilegedAppCount / Math.max(lane.appCount, 1)) * 160);
  const riskySignInPressure = clamp(lane.riskySignInRate * 6);
  const policyAgePressure = clamp(lane.policyAgeDays / 3.65);
  const evidenceGap = 100 - lane.evidenceCompleteness;

  const driftScore = Math.round(
    clamp(
      mfaGap * 0.18 +
        exceptionPressure * 0.17 +
        dormantPressure * 0.12 +
        privilegedPressure * 0.16 +
        riskySignInPressure * 0.14 +
        policyAgePressure * 0.08 +
        lane.groupSprawlScore * 0.08 +
        evidenceGap * 0.04 +
        lane.businessCriticality * 0.03
    )
  );

  const tier = classifyTier(driftScore);
  const route =
    tier === "LOCKDOWN"
      ? "Lockdown route: freeze new exceptions, rotate ownership, and require executive approval for privileged app access."
      : tier === "ESCALATE"
        ? "Escalation route: remove stale exceptions, force MFA closure, and attach evidence to each privileged policy."
        : tier === "WATCH"
          ? "Watch route: keep policy drift and exception aging visible in the weekly identity-risk review."
          : "Controlled route: monitor trend and maintain evidence freshness.";

  return { ...lane, driftScore, tier, route };
}

export function buildMonitor(input: PolicyInput): DriftMonitor {
  const lanes = input.lanes.map(scoreLane).sort((a, b) => b.driftScore - a.driftScore);
  const highestDriftLane = lanes[0]?.name ?? "No lanes";
  const meanDriftScore = Math.round(lanes.reduce((sum, lane) => sum + lane.driftScore, 0) / Math.max(lanes.length, 1));
  const totalPrivilegedApps = lanes.reduce((sum, lane) => sum + lane.privilegedAppCount, 0);
  const totalStaleExceptions = lanes.reduce((sum, lane) => sum + lane.staleExceptionCount, 0);

  return {
    generatedAt: input.generatedAt,
    organization: input.organization,
    lanes,
    summary: {
      laneCount: lanes.length,
      highestDriftLane,
      meanDriftScore,
      totalPrivilegedApps,
      totalStaleExceptions,
      primaryRecommendation: `Stabilize ${highestDriftLane} first; it has the strongest mix of stale exceptions, privileged access, MFA gaps, and risky sign-in pressure.`
    }
  };
}

export async function loadMonitor(path: string): Promise<DriftMonitor> {
  return buildMonitor(JSON.parse(await readFile(path, "utf8")) as PolicyInput);
}

export function renderMarkdown(monitor: DriftMonitor): string {
  const rows = monitor.lanes
    .map((lane) => `| ${lane.name} | ${lane.tier} | ${lane.driftScore} | ${lane.mfaCoverage}% | ${lane.staleExceptionCount} | ${lane.privilegedAppCount} | ${lane.nextAction} |`)
    .join("\n");

  return [
    "# Okta Access Policy Drift Monitor",
    "",
    `Organization: ${monitor.organization}`,
    "",
    `Primary recommendation: ${monitor.summary.primaryRecommendation}`,
    "",
    "| Lane | Tier | Drift score | MFA coverage | Stale exceptions | Privileged apps | Next action |",
    "| --- | --- | ---: | ---: | ---: | ---: | --- |",
    rows
  ].join("\n");
}
