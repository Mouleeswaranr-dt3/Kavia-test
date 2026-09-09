---
id: "spec_builder.spec_builder.epic.FR-6 Peer Benchmarking"
type: "spec_builder.epic"
title: "FR-6 Peer Benchmarking"
source_json: "Artifacts/SpecBuilder/json/epics/ens-fr6-peer-benchmarking.json"
generated: true
---


# FR-6 Peer Benchmarking

Show an anonymized business-category comparison when valid peer data is available and an explicit unavailable state when it is not.

<meta name="sb-artifact-type" content="spec_builder.epic">
<meta name="sb-artifact-id" content="FR-6 Peer Benchmarking">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-epic" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "ens-fr6-peer-benchmarking",
  "type": "spec_builder.epic",
  "title": "FR-6 Peer Benchmarking",
  "description": "Show an anonymized business-category comparison when valid peer data is available and an explicit unavailable state when it is not.",
  "status": "draft",
  "priority": "medium",
  "parent_roadmap_item": "enersight-analytics-mvp",
  "story_ids": [
    "ens-009-view-anonymized-peer-benchmark"
  ],
  "estimated_effort": "L",
  "links": [
    {
      "type": "roadmap_item",
      "id": "enersight-analytics-mvp"
    },
    {
      "type": "story",
      "id": "ens-009-view-anonymized-peer-benchmark"
    }
  ],
  "tags": [
    "FR-6",
    "MVP",
    "P1"
  ],
  "acceptance_criteria": [
    "A valid comparison communicates whether the selected site is above or below the anonymized average and its percentage difference.",
    "Unavailable comparison data produces a benchmark-unavailable state without showing a peer average or identifiable peer data."
  ],
  "provenance": {
    "created_at": "2026-09-07T06:59:32Z",
    "updated_at": "2026-09-07T06:59:32Z",
    "source": "spec_builder",
    "external_refs": [
      "kavia-docs/CodeWiki/Specs/FeatureSpecs/commercial-energy-consumption-analytics-anomaly-alerts.md#fr-6-peer-benchmarking"
    ]
  }
}
</script>
