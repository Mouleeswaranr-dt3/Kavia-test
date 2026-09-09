[CodeWiki](../../index.md) / [Specs](../index.md) / [Architecture Decision Records](index.md)

# EnerSight Analytics MVP Architecture Decisions

## Overview

These Architecture Decision Records capture the durable MVP decisions derived from the approved EnerSight product scope and prescribed technology stack. They do not approve unresolved business policies or external system providers.

## ADR-001: Modular FastAPI Monolith

### Decision

EnerSight will use a modular FastAPI backend with bounded authorization, ingestion, analytics, alert, ranking, benchmark, export, and integration modules.

### Rationale

The MVP has a cohesive domain and requires consistent transactions between authorized uploads, derived analytics, alerts, and exports. A modular monolith minimizes initial operational complexity while preserving later extraction boundaries.

### Tradeoffs

The initial deployment does not independently scale every module. Future measured processing demand may require separating worker or API responsibilities.

## ADR-002: PostgreSQL and SQLAlchemy for Persistent State

### Decision

PostgreSQL is the core persistent store, and SQLAlchemy is the backend persistence abstraction.

### Rationale

The prescribed stack supports relational integrity, time-range querying, authorization joins, derived analytic facts, and auditability without adding a second data platform.

### Tradeoffs

High-volume readings require indexing, retention, and potential partitioning. A specialized analytical platform may be justified later but is not necessary for approved MVP scope.

## ADR-003: Versioned Derived Daily Analytics

### Decision

Daily consumption, baselines, deviations, anomalies, and alert inputs will be persisted with policy and calculation versions.

### Rationale

Versioned results make charts, alerts, rankings, and exports explainable and allow controlled recalculation after an approved threshold or quality-policy change.

### Tradeoffs

Derived data duplicates source readings and requires a supersession policy. The additional storage is accepted to avoid unexplained historical changes.

## ADR-004: Durable Jobs for Long-Running Processing

### Decision

CSV processing, analytics derivation, alert generation, and report generation will run through durable job records with observable statuses.

### Rationale

These activities can outlast a browser request. Durable jobs provide reliable progress, retry classification, and terminal outcome reporting.

### Tradeoffs

The Docker deployment needs worker execution and job operations. The final queue mechanism is intentionally deferred because it is not specified by the approved stack.

## ADR-005: Server-Side Authorization Enforcement

### Decision

FastAPI will enforce role, customer, site, assignment, and export authorization before all reads and writes, with constrained PostgreSQL queries.

### Rationale

Cross-customer and cross-portfolio access prevention is a mandatory product requirement. Client-side filtering cannot provide this security boundary.

### Tradeoffs

Every endpoint and integration requires careful policy evaluation. Delivery depends on approved external identity and assignment contracts.

## ADR-006: Governed Aggregate Peer Benchmark Integration

### Decision

Peer benchmarking will use only approved anonymized aggregate inputs and will report an unavailable state when cohort rules cannot be met.

### Rationale

The MVP requires useful peer comparison without disclosing another customer's or site's identifiable consumption information.

### Tradeoffs

Benchmark availability can be limited until category, cohort, suppression, and calculation policies are finalized. The product accepts this explicit limitation rather than showing unsafe or misleading comparisons.

## Related

The decisions are incorporated into the [EnerSight Analytics MVP Architecture](../ArchitectureSpecs/enersight-analytics-mvp-architecture.md).
