---
id: "spec_builder.spec_builder.epic.FR-2 Consumption Dashboard and Period Aggregation"
type: "spec_builder.epic"
title: "FR-2 Consumption Dashboard and Period Aggregation"
source_json: "Artifacts/SpecBuilder/json/epics/ens-fr2-consumption-dashboard.json"
generated: true
---


# FR-2 Consumption Dashboard and Period Aggregation

Present accepted meter-reading data for an authorized selected site in daily, weekly, and monthly consumption views with clear selected-range and no-data states.

<meta name="sb-artifact-type" content="spec_builder.epic">
<meta name="sb-artifact-id" content="FR-2 Consumption Dashboard and Period Aggregation">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-epic" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "ens-fr2-consumption-dashboard",
  "type": "spec_builder.epic",
  "title": "FR-2 Consumption Dashboard and Period Aggregation",
  "description": "Present accepted meter-reading data for an authorized selected site in daily, weekly, and monthly consumption views with clear selected-range and no-data states.",
  "status": "draft",
  "priority": "high",
  "parent_roadmap_item": "enersight-analytics-mvp",
  "story_ids": [
    "ens-003-view-daily-consumption",
    "ens-004-view-weekly-monthly-consumption"
  ],
  "estimated_effort": "L",
  "links": [
    {
      "type": "roadmap_item",
      "id": "enersight-analytics-mvp"
    },
    {
      "type": "story",
      "id": "ens-003-view-daily-consumption"
    },
    {
      "type": "story",
      "id": "ens-004-view-weekly-monthly-consumption"
    }
  ],
  "tags": [
    "FR-2",
    "MVP",
    "P0"
  ],
  "acceptance_criteria": [
    "The dashboard displays approved daily, weekly, and monthly aggregations for accepted data.",
    "The dashboard communicates an explicit no-data state instead of treating unavailable data as zero."
  ],
  "provenance": {
    "created_at": "2026-09-07T06:59:32Z",
    "updated_at": "2026-09-07T06:59:32Z",
    "source": "spec_builder",
    "external_refs": [
      "kavia-docs/CodeWiki/Specs/FeatureSpecs/commercial-energy-consumption-analytics-anomaly-alerts.md#fr-2-consumption-dashboard-and-period-aggregation"
    ]
  }
}
</script>
