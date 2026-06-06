# okta-access-policy-drift-monitor

Board-readable drift monitor for Okta access policies, MFA gaps, stale exceptions, dormant users, privileged applications, risky sign-ins, and identity-risk remediation posture.

[![ci](https://github.com/mizcausevic-dev/okta-access-policy-drift-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/okta-access-policy-drift-monitor/actions/workflows/ci.yml)
[![pages](https://github.com/mizcausevic-dev/okta-access-policy-drift-monitor/actions/workflows/pages.yml/badge.svg)](https://github.com/mizcausevic-dev/okta-access-policy-drift-monitor/actions/workflows/pages.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)

## Why this exists

Identity risk gets dangerous when access exceptions age quietly. Leaders need a simple answer:

- Which Okta policy lanes have the highest drift?
- Where are MFA gaps, stale exceptions, dormant users, and privileged apps compounding?
- Which remediation route should move before the next audit, board review, or incident?

This repo turns synthetic Okta-style policy telemetry into a board-readable identity-risk register.

## Local run

```bash
npm install
npm run verify
npm run demo
```

## CLI

```bash
npx okta-access-policy-drift-monitor fixtures/okta-policy-sample.json --format markdown
npx okta-access-policy-drift-monitor fixtures/okta-policy-sample.json --format json
```

## Data contract

Each lane tracks MFA coverage, stale exceptions, dormant users, risky sign-ins, privileged app counts, group sprawl, evidence completeness, and business criticality.

## Kinetic Gain fit

This strengthens the identity/security lane with an Okta-specific signal: access policy drift translated into board-ready remediation sequencing.
