---
id: "spec_builder.spec_builder.roadmap.EnerSight Analytics Product Roadmap"
type: "spec_builder.roadmap"
title: "EnerSight Analytics Product Roadmap"
source_json: "Artifacts/SpecBuilder/json/roadmap.json"
generated: true
---


# EnerSight Analytics Product Roadmap

This roadmap contains the approved MVP backlog for Commercial Energy Consumption Analytics and Anomaly Alerts. Its scope is limited to the approved PRD and the associated persona analysis.

<meta name="sb-artifact-type" content="spec_builder.roadmap">
<meta name="sb-artifact-id" content="EnerSight Analytics Product Roadmap">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-roadmap" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "roadmap",
  "type": "spec_builder.roadmap",
  "title": "EnerSight Analytics Product Roadmap",
  "summary": "The MVP roadmap delivers approved CSV-based commercial energy consumption analytics and anomaly alerts without extending scope into billing, equipment control, or direct back-office integration.",
  "description": "This roadmap contains the approved MVP backlog for Commercial Energy Consumption Analytics and Anomaly Alerts. Its scope is limited to the approved PRD and the associated persona analysis.",
  "status": "active",
  "owner": "Product Owner",
  "horizon": "MVP",
  "grouping": {
    "mode": "milestone",
    "past_statuses": [
      "done",
      "completed",
      "shipped",
      "cancelled"
    ],
    "current_statuses": [
      "in_progress",
      "blocked",
      "in_review",
      "active"
    ],
    "upcoming_statuses": [
      "draft",
      "approved",
      "planned",
      "todo"
    ]
  },
  "presentation": {
    "show_kpis": true,
    "show_timeline": true,
    "show_current_focus": true,
    "show_past_work": true,
    "default_grouping": "milestone",
    "past_section_title": "Completed Work",
    "upcoming_section_title": "MVP Backlog"
  },
  "items": [
    "enersight-analytics-mvp"
  ],
  "milestones": [
    {
      "id": "enersight-mvp",
      "title": "Commercial Energy Analytics and Anomaly Alerts MVP",
      "description": "Deliver the PRD-approved CSV ingestion, consumption analytics, anomaly alerts, peer benchmark availability states, account-manager ranking, and authorized exports.",
      "status": "draft",
      "confidence": "medium",
      "theme": "MVP",
      "item_ids": [
        "enersight-analytics-mvp"
      ],
      "sprint_ids": []
    }
  ],
  "sprints": [],
  "risks": [
    {
      "title": "Unresolved data and authorization decisions",
      "description": "CSV rules, authorization sources, assignment data, benchmark governance, and export details must be resolved before the affected backlog items can be delivered.",
      "status": "open",
      "owner": "Product Owner"
    }
  ],
  "dependencies": [
    {
      "title": "Approved customer-site and authorization data",
      "description": "MVP capabilities require an approved source of truth for customer sites, customer-user access, and account-manager assignments.",
      "status": "required"
    }
  ],
  "assumptions": [
    "The CSV upload path is the approved first-release intake method.",
    "Direct integration with the back-office billing system is not part of this MVP."
  ],
  "notes": "The backlog preserves PRD TBDs as delivery dependencies. It does not approve threshold-management controls, external notifications, scheduled exports, non-CSV ingestion, billing, or automated remediation.",
  "provenance": {
    "created_at": "2026-09-07T06:59:32Z",
    "updated_at": "2026-09-07T06:59:32Z",
    "source": "spec_builder"
  }
}
</script>
