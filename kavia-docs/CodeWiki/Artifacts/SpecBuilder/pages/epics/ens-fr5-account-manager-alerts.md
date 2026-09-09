---
id: "spec_builder.spec_builder.epic.FR-5 Account Manager Alerts"
type: "spec_builder.epic"
title: "FR-5 Account Manager Alerts"
source_json: "Artifacts/SpecBuilder/json/epics/ens-fr5-account-manager-alerts.json"
generated: true
---


# FR-5 Account Manager Alerts

Create alerts for anomalies at sites belonging to customers assigned to an account manager and enable authorized navigation to the related context.

<meta name="sb-artifact-type" content="spec_builder.epic">
<meta name="sb-artifact-id" content="FR-5 Account Manager Alerts">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-epic" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "ens-fr5-account-manager-alerts",
  "type": "spec_builder.epic",
  "title": "FR-5 Account Manager Alerts",
  "description": "Create alerts for anomalies at sites belonging to customers assigned to an account manager and enable authorized navigation to the related context.",
  "status": "draft",
  "priority": "high",
  "parent_roadmap_item": "enersight-analytics-mvp",
  "story_ids": [
    "ens-008-review-assigned-anomaly-alerts"
  ],
  "estimated_effort": "M",
  "links": [
    {
      "type": "roadmap_item",
      "id": "enersight-analytics-mvp"
    },
    {
      "type": "story",
      "id": "ens-008-review-assigned-anomaly-alerts"
    }
  ],
  "tags": [
    "FR-5",
    "MVP",
    "P0"
  ],
  "acceptance_criteria": [
    "An alert contains the approved customer, site, date, deviation percentage, and suggested-action fields.",
    "An account manager cannot see alerts for customers outside their assignments."
  ],
  "provenance": {
    "created_at": "2026-09-07T06:59:32Z",
    "updated_at": "2026-09-07T06:59:32Z",
    "source": "spec_builder",
    "external_refs": [
      "kavia-docs/CodeWiki/Specs/FeatureSpecs/commercial-energy-consumption-analytics-anomaly-alerts.md#fr-5-account-manager-alerts"
    ]
  }
}
</script>
