# Sentinel-In: Executive & Analyst Dashboard

Sentinel-In is a React-based frontend application that serves as a read-only materialized view into the Security AI's established graph (the "Blackboard"). It provides distinct, persona-driven interfaces for Executives, On-Call Leads, and Security Analysts to investigate security incidents, assess asset impacts, and review raw evidence.

## Architecture

This frontend relies strictly on the **Blackboard state** (as defined in `SPEC-002`). It does not compute risk directly, but rather renders the orchestration layer's consensus:

* **Materialized Blackboard:** UI components consume from `useBlackboardStore`, avoiding deeply nested prop drilling and ensuring a single source of truth.
* **Role-Gated Interface:** Using `useRoleStore` and `<RoleGate>`, the application seamlessly pivots data density and available tabs based on the user's role:
  * **Executive:** High-level dashboard, coverage metrics, and PDF exports.
  * **On-Call Lead:** Asset-impact focus, remediation planning, and phase progression.
  * **Analyst:** Deep evidence exploration, raw HTTP/artifact views, and contradiction analysis.

## Key Features

- **Executive Dashboard:** Visualizes investigation coverage, evidence authority, and closure readiness using `recharts`.
- **Asset Impact Report:** Detailed view of affected assets, missing tenant configurations, and suppression-aware remediation plans.
- **Evidence Explorer:** Raw, tabbed tables of claims, sources, artifacts, and contradictions. Click any `ProvenanceChip` to view exact extraction origins.
- **Provenance System:** A unified side-drawer that displays raw text excerpts, locator URLs, and SHA-256 hashes verifying AI claims.

## Development

The project is built with React 19, TypeScript, Vite, and Zustand for state management.

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Recent Updates

- Migrated away from the legacy Elasticsearch/ES|QL mock backend in favor of the static `blackboard.json` data ledger.
- Cleaned up rendering loops via strict Zustand shallow-selector mapping.
- Established consistent GitHub configurations and ignore rules.
