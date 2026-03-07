# Vendedor AI Architecture Foundation

## Objective

Transform the existing Vendedor AI codebase into a professional autonomous revenue engine without breaking the current operating flow.

## Current interpretation

The current system already has enough modules to support prospecting, analysis, copy generation, review, tracking, dashboarding and continuous learning. The immediate gap is not missing AI capability; it is lack of explicit contracts, naming clarity and status governance.

## Canonical agent roles

- `scout` / `scout-auto`: discover and capture leads.
- `analyzer`: enrich psychographic and commercial context.
- `copywriter`: generate first-contact messaging.
- `copy-reviewer`: improve one specific outbound message before use.
- `message-qa`: approve or reject message batches in the operating queue.
- `followup`: execute recovery and continuation logic.
- `tracker`: register pipeline movement and outcomes.
- `learner`: learn from outcomes and refine rules.
- `orchestrator` / `autopilot`: coordinate the end-to-end revenue loop.
- `dashboard-api`: expose operational visibility.
- `notion-sync`: synchronize CRM data externally.

## Canonical lead statuses

- `discovered`
- `enriched`
- `qualified`
- `message_ready`
- `qa_approved`
- `sent`
- `engaged`
- `followup_due`
- `opportunity`
- `won`
- `lost`
- `blocked`

## First refactor decisions

1. Preserve legacy files during the foundation phase.
2. Introduce `src/` as the new professional application structure.
3. Route entrypoints through wrappers first, then migrate internals safely.
4. Rename ambiguous reviewers by responsibility, not by module number.
5. Centralize status and transition rules under `src/domain/`.

## Legacy to professional map

- `1-analyzer.js` -> `src/agents/analyzer.js`
- `2-copywriter.js` -> `src/agents/copywriter.js`
- `3-cataloger.js` -> `src/agents/cataloger.js`
- `4-followup.js` -> `src/agents/followup.js`
- `4-reviewer.js` -> `src/agents/message-qa.js`
- `5-orchestrator.js` -> `src/core/orchestrator.js`
- `6-scout.js` -> `src/agents/scout.js`
- `6-scout-auto.js` -> `src/agents/scout-auto.js`
- `7-reviewer.js` -> `src/agents/copy-reviewer.js`
- `8-dashboard.js` -> `src/services/dashboard-api.js`
- `9-notion-sync.js` -> `src/services/notion-sync.js`
- `10-autopilot.js` -> `src/core/autopilot.js`
- `11-learner.js` -> `src/agents/learner.js`
- `12-tracker.js` -> `src/core/tracker.js`

## Next implementation steps

1. Move agent files into `src/` with compatibility wrappers.
2. Refactor data access into shared utilities.
3. Make tracker the single authority for pipeline transitions.
4. Align dashboard KPIs with canonical statuses.
5. Feed learner with outcome events rather than ad hoc file reads.
