---
id: "spec_builder.spec_builder.epic.FR-7 Account Manager Customer Ranking"
type: "spec_builder.epic"
title: "FR-7 Account Manager Customer Ranking"
source_json: "Artifacts/SpecBuilder/json/epics/ens-fr7-customer-ranking.json"
generated: true
---


# FR-7 Account Manager Customer Ranking

List only assigned customers and allow ranking by anomaly count or deviation severity.

<meta name="sb-artifact-type" content="spec_builder.epic">
<meta name="sb-artifact-id" content="FR-7 Account Manager Customer Ranking">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-epic" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "ens-fr7-customer-ranking",
  "type": "spec_builder.epic",
  "title": "FR-7 Account Manager Customer Ranking",
  "description": "List only assigned customers and allow ranking by anomaly count or deviation severity.",
  "status": "draft",
  "priority": "high",
  "parent_roadmap_item": "enersight-analytics-mvp",
  "story_ids": [
    "ens-010-rank-assigned-customers"
  ],
  "estimated_effort": "M",
  "links": [
    {
      "type": "roadmap_item",
      "id": "enersight-analytics-mvp"
    },
    {
      "type": "story",
      "id": "ens-010-rank-assigned-customers"
    }
  ],
  "tags": [
    "FR-7",
    "MVP",
    "P0"
  ],
  "acceptance_criteria": [
    "The account-manager list excludes customers outside the authenticated user's assignments.",
    "The active ranking criterion is displayed and controls the ordering."
  ],
  "provenance": {
    "created_at": "2026-09-07T06:59:32Z",
    "updated_at": "2026-09-07T06:59:32Z",
    "source": "spec_builder",
    "external_refs": [
      "kavia-docs/CodeWiki/Specs/FeatureSpecs/commercial-energy-consumption-analytics-anomaly-alerts.md#fr-7-account-manager-customer-ranking"
    ]
  }
}
</script>
