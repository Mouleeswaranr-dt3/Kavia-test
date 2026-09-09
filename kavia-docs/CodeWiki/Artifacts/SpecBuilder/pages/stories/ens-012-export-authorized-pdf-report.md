---
id: "spec_builder.spec_builder.user_story.As a Commercial Account Manager, I want to export an authorized PDF consumption report for an assigned site and date range so that I can support customer conversations."
type: "spec_builder.user_story"
title: "As a Commercial Account Manager, I want to export an authorized PDF consumption report for an assigned site and date range so that I can support customer conversations."
source_json: "Artifacts/SpecBuilder/json/stories/ens-012-export-authorized-pdf-report.json"
generated: true
---


# As a Commercial Account Manager, I want to export an authorized PDF consumption report for an assigned site and date range so that I can support customer conversations.

This FR-8 story supplies a PDF report for an account manager's assigned customer site and selected date range only when the requested data is authorized and available.

<meta name="sb-artifact-type" content="spec_builder.user_story">
<meta name="sb-artifact-id" content="As a Commercial Account Manager, I want to export an authorized PDF consumption report for an assigned site and date range so that I can support customer conversations.">

<div id="sb-page-root" class="sb-page sb-page-spec-builder-user-story" data-loading="true"></div>

<script type="application/json" id="sb-page-data">
{
  "id": "ens-012-export-authorized-pdf-report",
  "type": "spec_builder.user_story",
  "title": "As a Commercial Account Manager, I want to export an authorized PDF consumption report for an assigned site and date range so that I can support customer conversations.",
  "description": "This FR-8 story supplies a PDF report for an account manager's assigned customer site and selected date range only when the requested data is authorized and available.",
  "status": "draft",
  "priority": "high",
  "parent_epic": "ens-fr8-report-export",
  "persona": "Commercial Account Manager",
  "goal": "export an authorized PDF consumption report for an assigned site and date range",
  "benefit": "I can support customer conversations",
  "acceptance_criteria": [
    "Given an authorized account manager selects an assigned customer site, a date range with accepted consumption data, and PDF as the format, when the account manager requests an export, then the system provides a PDF consumption report for that authorized site and date range.",
    "Given a user requests an export for a site or date range that the user is not authorized to access, when the request is evaluated, then the system denies the request and does not expose report data.",
    "Given no accepted consumption data exists for the authorized selection and date range, when a user requests an export, then the system informs the user that no exportable data is available."
  ],
  "dependencies": [
    "Accepted consumption data from FR-1.",
    "Approved account-manager assignments and authorization source.",
    "Approved PDF report template, charts, branding, limits, retention, and processing behavior."
  ],
  "release": "MVP",
  "product_priority": "P0",
  "estimated_effort": "M",
  "links": [
    {
      "type": "epic",
      "id": "ens-fr8-report-export"
    }
  ],
  "tags": [
    "FR-8",
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
