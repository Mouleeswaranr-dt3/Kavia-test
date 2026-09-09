---
id: "spec_builder.spec_builder.epic.FR-3 Rolling Four-Week Baseline"
type: "spec_builder.epic"
title: "FR-3 Rolling Four-Week Baseline"
source_json: "Artifacts/SpecBuilder/json/epics/ens-fr3-rolling-baseline.json"
generated: true
---


# FR-3 Rolling Four-Week Baseline

Calculate a per-site rolling average baseline from the 28 calendar days preceding each evaluated day and display it only when valid.

<meta name="sb-artifact-type" content="spec_builder.epic">
<meta name="sb-artifact-id" content="FR-3 Rolling Four-Week Baseline">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-epic" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "ens-fr3-rolling-baseline",
  "type": "spec_builder.epic",
  "title": "FR-3 Rolling Four-Week Baseline",
  "description": "Calculate a per-site rolling average baseline from the 28 calendar days preceding each evaluated day and display it only when valid.",
  "status": "draft",
  "priority": "high",
  "parent_roadmap_item": "enersight-analytics-mvp",
  "story_ids": [
    "ens-005-view-rolling-four-week-baseline"
  ],
  "estimated_effort": "M",
  "links": [
    {
      "type": "roadmap_item",
      "id": "enersight-analytics-mvp"
    },
    {
      "type": "story",
      "id": "ens-005-view-rolling-four-week-baseline"
    }
  ],
  "tags": [
    "FR-3",
    "MVP",
    "P0"
  ],
  "acceptance_criteria": [
    "A valid baseline is the arithmetic average of the 28 preceding daily consumption values and excludes the evaluated day.",
    "The product does not present a baseline as valid when the approved minimum-data rule is not met."
  ],
  "provenance": {
    "created_at": "2026-09-07T06:59:32Z",
    "updated_at": "2026-09-07T06:59:32Z",
    "source": "spec_builder",
    "external_refs": [
      "kavia-docs/CodeWiki/Specs/FeatureSpecs/commercial-energy-consumption-analytics-anomaly-alerts.md#fr-3-rolling-four-week-baseline"
    ]
  }
}
</script>
