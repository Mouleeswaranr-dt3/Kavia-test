---
id: "spec_builder.spec_builder.user_story.As a Commercial Customer Operations Lead, I want to switch between weekly and monthly consumption views so that I can understand longer-term usage trends."
type: "spec_builder.user_story"
title: "As a Commercial Customer Operations Lead, I want to switch between weekly and monthly consumption views so that I can understand longer-term usage trends."
source_json: "Artifacts/SpecBuilder/json/stories/ens-004-view-weekly-monthly-consumption.json"
generated: true
---


# As a Commercial Customer Operations Lead, I want to switch between weekly and monthly consumption views so that I can understand longer-term usage trends.

This FR-2 story enables weekly and monthly aggregation for the same authorized site and selected date range while clearly identifying the active period and range.

<meta name="sb-artifact-type" content="spec_builder.user_story">
<meta name="sb-artifact-id" content="As a Commercial Customer Operations Lead, I want to switch between weekly and monthly consumption views so that I can understand longer-term usage trends.">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-user-story" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "ens-004-view-weekly-monthly-consumption",
  "type": "spec_builder.user_story",
  "title": "As a Commercial Customer Operations Lead, I want to switch between weekly and monthly consumption views so that I can understand longer-term usage trends.",
  "description": "This FR-2 story enables weekly and monthly aggregation for the same authorized site and selected date range while clearly identifying the active period and range.",
  "status": "draft",
  "priority": "high",
  "parent_epic": "ens-fr2-consumption-dashboard",
  "persona": "Commercial Customer Operations Lead",
  "goal": "switch between weekly and monthly consumption views",
  "benefit": "I can understand longer-term usage trends",
  "acceptance_criteria": [
    "Given a selected site has accepted meter readings for a selected date range, when a user selects the weekly or monthly view, then the dashboard displays consumption aggregated into the selected calendar period and labels the selected period and date range.",
    "Given a user changes between daily, weekly, and monthly views, when the new view is selected, then the dashboard recalculates or retrieves the displayed aggregation for the same selected site and date range."
  ],
  "dependencies": [
    "Accepted site-associated meter-reading dataset from FR-1.",
    "Approved treatment of incomplete aggregation periods and default date range."
  ],
  "release": "MVP",
  "product_priority": "P0",
  "estimated_effort": "M",
  "links": [
    {
      "type": "epic",
      "id": "ens-fr2-consumption-dashboard"
    }
  ],
  "tags": [
    "FR-2",
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
