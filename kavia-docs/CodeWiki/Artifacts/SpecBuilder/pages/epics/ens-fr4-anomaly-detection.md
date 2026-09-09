---
id: "spec_builder.spec_builder.epic.FR-4 Anomaly Detection and Chart Highlighting"
type: "spec_builder.epic"
title: "FR-4 Anomaly Detection and Chart Highlighting"
source_json: "Artifacts/SpecBuilder/json/epics/ens-fr4-anomaly-detection.json"
generated: true
---


# FR-4 Anomaly Detection and Chart Highlighting

Flag daily consumption only when it exceeds a valid baseline by more than the active threshold and distinguish flagged days in the chart.

<meta name="sb-artifact-type" content="spec_builder.epic">
<meta name="sb-artifact-id" content="FR-4 Anomaly Detection and Chart Highlighting">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-epic" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "ens-fr4-anomaly-detection",
  "type": "spec_builder.epic",
  "title": "FR-4 Anomaly Detection and Chart Highlighting",
  "description": "Flag daily consumption only when it exceeds a valid baseline by more than the active threshold and distinguish flagged days in the chart.",
  "status": "draft",
  "priority": "high",
  "parent_roadmap_item": "enersight-analytics-mvp",
  "story_ids": [
    "ens-006-detect-threshold-exceeding-anomalies",
    "ens-007-highlight-anomalies-on-chart"
  ],
  "estimated_effort": "M",
  "links": [
    {
      "type": "roadmap_item",
      "id": "enersight-analytics-mvp"
    },
    {
      "type": "story",
      "id": "ens-006-detect-threshold-exceeding-anomalies"
    },
    {
      "type": "story",
      "id": "ens-007-highlight-anomalies-on-chart"
    }
  ],
  "tags": [
    "FR-4",
    "MVP",
    "P0"
  ],
  "acceptance_criteria": [
    "At the default 20 percent threshold, a 21 percent deviation is flagged and a 20 percent deviation is not.",
    "Days without a valid baseline are not classified as anomalies."
  ],
  "provenance": {
    "created_at": "2026-09-07T06:59:32Z",
    "updated_at": "2026-09-07T06:59:32Z",
    "source": "spec_builder",
    "external_refs": [
      "kavia-docs/CodeWiki/Specs/FeatureSpecs/commercial-energy-consumption-analytics-anomaly-alerts.md#fr-4-anomaly-detection-and-chart-highlighting"
    ]
  }
}
</script>
