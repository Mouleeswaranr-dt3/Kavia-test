---
id: "spec_builder.spec_builder.epic.FR-8 Consumption Report Export"
type: "spec_builder.epic"
title: "FR-8 Consumption Report Export"
source_json: "Artifacts/SpecBuilder/json/epics/ens-fr8-report-export.json"
generated: true
---


# FR-8 Consumption Report Export

Allow authorized customer users and account managers to export selected consumption data in CSV or PDF format.

<meta name="sb-artifact-type" content="spec_builder.epic">
<meta name="sb-artifact-id" content="FR-8 Consumption Report Export">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-epic" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "ens-fr8-report-export",
  "type": "spec_builder.epic",
  "title": "FR-8 Consumption Report Export",
  "description": "Allow authorized customer users and account managers to export selected consumption data in CSV or PDF format.",
  "status": "draft",
  "priority": "high",
  "parent_roadmap_item": "enersight-analytics-mvp",
  "story_ids": [
    "ens-011-export-authorized-csv-report",
    "ens-012-export-authorized-pdf-report"
  ],
  "estimated_effort": "L",
  "links": [
    {
      "type": "roadmap_item",
      "id": "enersight-analytics-mvp"
    },
    {
      "type": "story",
      "id": "ens-011-export-authorized-csv-report"
    },
    {
      "type": "story",
      "id": "ens-012-export-authorized-pdf-report"
    }
  ],
  "tags": [
    "FR-8",
    "MVP",
    "P0"
  ],
  "acceptance_criteria": [
    "Authorized users can receive CSV or PDF consumption reports for an authorized selection containing accepted data.",
    "Unauthorized or no-data export requests do not expose data and provide the approved outcome."
  ],
  "provenance": {
    "created_at": "2026-09-07T06:59:32Z",
    "updated_at": "2026-09-07T06:59:32Z",
    "source": "spec_builder",
    "external_refs": [
      "kavia-docs/CodeWiki/Specs/FeatureSpecs/commercial-energy-consumption-analytics-anomaly-alerts.md#fr-8-consumption-report-export"
    ]
  }
}
</script>
