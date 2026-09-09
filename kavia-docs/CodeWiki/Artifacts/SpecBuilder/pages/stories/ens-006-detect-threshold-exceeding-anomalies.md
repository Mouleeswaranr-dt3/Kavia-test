---
id: "spec_builder.spec_builder.user_story.As a Commercial Customer Operations Lead, I want days exceeding the approved anomaly threshold to be identified accurately so that I can focus on unusual consumption."
type: "spec_builder.user_story"
title: "As a Commercial Customer Operations Lead, I want days exceeding the approved anomaly threshold to be identified accurately so that I can focus on unusual consumption."
source_json: "Artifacts/SpecBuilder/json/stories/ens-006-detect-threshold-exceeding-anomalies.json"
generated: true
---


# As a Commercial Customer Operations Lead, I want days exceeding the approved anomaly threshold to be identified accurately so that I can focus on unusual consumption.

This FR-4 story detects an anomaly only when actual daily consumption exceeds a valid baseline by more than the active threshold, which defaults to 20 percent.

<meta name="sb-artifact-type" content="spec_builder.user_story">
<meta name="sb-artifact-id" content="As a Commercial Customer Operations Lead, I want days exceeding the approved anomaly threshold to be identified accurately so that I can focus on unusual consumption.">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-user-story" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "ens-006-detect-threshold-exceeding-anomalies",
  "type": "spec_builder.user_story",
  "title": "As a Commercial Customer Operations Lead, I want days exceeding the approved anomaly threshold to be identified accurately so that I can focus on unusual consumption.",
  "description": "This FR-4 story detects an anomaly only when actual daily consumption exceeds a valid baseline by more than the active threshold, which defaults to 20 percent.",
  "status": "draft",
  "priority": "high",
  "parent_epic": "ens-fr4-anomaly-detection",
  "persona": "Commercial Customer Operations Lead",
  "goal": "have days exceeding the approved anomaly threshold identified accurately",
  "benefit": "I can focus on unusual consumption",
  "acceptance_criteria": [
    "Given a site has an actual daily consumption value of 121 kWh, a valid baseline of 100 kWh, and the active threshold is 20 percent, when anomaly detection runs, then the system flags that day as an anomaly with a deviation of 21 percent.",
    "Given a site has an actual daily consumption value of 120 kWh, a valid baseline of 100 kWh, and the active threshold is 20 percent, when anomaly detection runs, then the system does not flag that day as an anomaly.",
    "Given an actual daily consumption value is lower than or equal to its valid baseline, when anomaly detection runs, then the system does not flag that day as an anomaly.",
    "Given a day has no valid baseline, when anomaly detection runs, then the system does not classify that day as an anomaly."
  ],
  "dependencies": [
    "Valid daily baseline from FR-3.",
    "Approved threshold governance, scope, range, and historical-recalculation policy."
  ],
  "release": "MVP",
  "product_priority": "P0",
  "estimated_effort": "M",
  "links": [
    {
      "type": "epic",
      "id": "ens-fr4-anomaly-detection"
    }
  ],
  "tags": [
    "FR-4",
    "MVP",
    "P0"
  ],
  "provenance": {
    "created_at": "2026-09-07T06:59:32Z",
    "updated_at": "2026-09-07T06:59:32Z",
    "source": "spec_builder",
    "external_refs": []
  }
}
</script>
