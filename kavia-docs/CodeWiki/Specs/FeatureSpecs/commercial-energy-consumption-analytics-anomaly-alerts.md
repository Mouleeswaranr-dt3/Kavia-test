---
id: "commercial-energy-consumption-analytics-anomaly-alerts"
type: "feature-spec"
title: "Commercial Energy Consumption Analytics and Anomaly Alerts"
status: "draft"
owner: "TBD"
tags:
  - "energy-analytics"
  - "consumption"
  - "anomaly-detection"
  - "commercial-customers"
version: "1.0"
---

[CodeWiki](../../index.md) / [Specs](../index.md) / [Feature Specs](index.md)

# Commercial Energy Consumption Analytics and Anomaly Alerts

## Problem Statement

Commercial energy customers receive monthly billing information but do not have a customer-facing way to examine the interval consumption data that contributes to those bills. As a result, customers cannot readily identify trends, compare a site with similar businesses, or detect material consumption changes before a bill is received. Account managers likewise lack a consolidated view of assigned customers that identifies sites with unusual consumption and provides information for customer conversations.

This feature will provide an analytics and alerting layer for uploaded meter-reading data. It will show consumption trends, calculate a per-site rolling baseline, identify daily consumption that exceeds that baseline by a configurable threshold, present peer-comparison information when it is available, and make anomaly information available to account managers and customers according to their roles.

## Goals & Non-goals

### Goals

The product must accept a CSV upload containing timestamped meter readings and energy-consumption values, validate and parse the data into a usable dataset, and associate the dataset with a customer site. The product must provide daily, weekly, and monthly consumption visualizations; display actual consumption with a rolling four-week baseline; and visually identify anomaly days.

The product must create an account-manager alert for each detected anomaly that includes the customer, site, date, deviation percentage, and a suggested action. It must also provide account managers with a ranked view of their assigned customers and allow both supported user roles to export consumption data for a selected date range in CSV or PDF format.

### Non-goals

This release will not generate or issue customer energy bills, replace the back-office billing system, or alter source meter readings. It will not control customer equipment, automatically remediate high usage, or guarantee that an anomaly represents energy waste. It will not define the data-provider integration method, customer-to-account-manager assignment source, peer-category taxonomy, or the content of recommended actions; these are listed as TBDs.

## Target Users & Context

### Account Manager

An account manager needs to review the commercial customers assigned to them, prioritize follow-up using anomaly count or deviation severity, and review the details of an anomaly before a customer discussion or quarterly business review. Account managers use the account-manager dashboard and must not see customers who are not assigned to them.

### Commercial Customer

A commercial customer needs to understand consumption for a site over time, compare actual usage with a baseline, see anomaly days, review an available peer benchmark, and export a report for a chosen date range. Customer access must be restricted to the customer organization and sites that the authenticated user is authorized to view; the authorization model is otherwise TBD.

## Scope (MoSCoW)

### Must

The first release must support CSV meter-data uploads, consumption trend dashboards with daily, weekly, and monthly views, a rolling four-week baseline per site, configurable-threshold anomaly detection with a default threshold of 20 percent, account-manager anomaly alerts, account-manager customer ranking, peer benchmarking when valid comparison data exists, and PDF and CSV report exports.

### Should

The product should make empty, incomplete, invalid, and unavailable data states clear to users. It should retain upload-processing outcomes and alert-generation outcomes in telemetry so operational and product issues can be diagnosed. It should ensure that an uploaded file is not exposed to users who lack access to its customer site.

### Could

A later release could provide in-product configuration controls for the anomaly threshold, additional benchmark segmentation, alert acknowledgement or workflow management, scheduled exports, or notifications outside the application. These capabilities are not required for the first release.

### Won't

The first release will not automate remediation, calculate billing charges, modify meter readings, make operational decisions for customers, or support non-CSV upload formats.

## Functional Requirements

### FR-1: Meter Reading Data Ingestion

The system must allow an authorized user to upload a CSV file for a selected customer site. The file must include a timestamp column and a kWh column. The exact column names, timestamp format, timezone handling, permitted file size, maximum row count, duplicate-reading policy, and required customer-site selection workflow are TBD.

The ingestion process must validate that the required columns are present and that each accepted data row has a parseable timestamp and numeric kWh value. The system must report whether processing succeeded or failed and must not make an invalid upload available as a consumption dataset. The handling of partially valid files is TBD.

#### Acceptance Criteria

- **Given** an authorized user selects a customer site and uploads a CSV containing the configured timestamp and kWh columns with valid values, **when** processing completes, **then** the system stores a usable consumption dataset associated with that site and displays a successful upload outcome.
- **Given** an authorized user uploads a CSV that does not contain the required timestamp column or kWh column, **when** validation runs, **then** the system rejects the upload, identifies the missing required column or columns, and does not create a usable consumption dataset.
- **Given** an authorized user uploads a CSV containing a non-parseable timestamp or non-numeric kWh value, **when** validation runs, **then** the system reports the invalid data and does not mark the upload as successfully processed.
- **Given** a valid processed dataset exists for a site, **when** an authorized user opens the site consumption view, **then** the dataset is available for trend, baseline, anomaly, and export calculations for dates represented in the dataset.

### FR-2: Consumption Dashboard and Period Aggregation

The customer-facing consumption dashboard must display a consumption trend chart for a selected site and must offer daily, weekly, and monthly aggregation views. The displayed consumption values must be calculated from accepted meter-reading data for the selected date range. The default date range and the expected treatment of incomplete aggregation periods are TBD.

The dashboard must identify the selected aggregation period and date range. It must communicate when no accepted consumption data exists for the selected site and date range rather than displaying a chart that implies zero consumption.

#### Acceptance Criteria

- **Given** a selected site has accepted meter readings for a selected date range, **when** a user selects the daily view, **then** the dashboard displays one consumption value per calendar day derived from readings in that range.
- **Given** a selected site has accepted meter readings for a selected date range, **when** a user selects the weekly or monthly view, **then** the dashboard displays consumption aggregated into the selected calendar period and labels the selected period and date range.
- **Given** a user changes between daily, weekly, and monthly views, **when** the new view is selected, **then** the dashboard recalculates or retrieves the displayed aggregation for the same selected site and date range.
- **Given** no accepted consumption data exists for a selected site and date range, **when** a user opens or changes the dashboard view, **then** the dashboard displays an explicit no-data state and does not represent the absence of data as zero consumption.

### FR-3: Rolling Four-Week Baseline

For each customer site, the system must calculate a rolling four-week average consumption baseline using the accepted data preceding the day being evaluated. For a daily actual-consumption value, the rolling window must contain the 28 calendar days immediately before that day and must exclude the evaluated day. The business rule for days with missing readings, incomplete history, and non-daily display views is TBD.

The dashboard must display the daily baseline alongside daily actual consumption whenever a baseline can be calculated. A baseline must not be displayed as available when the site does not meet the final TBD minimum-data rule.

#### Acceptance Criteria

- **Given** a site has accepted daily consumption values for the 28 calendar days immediately before an evaluated day, **when** the system calculates the baseline for that day, **then** the baseline equals the arithmetic average of those 28 preceding daily consumption values and excludes the evaluated day.
- **Given** a site has sufficient data for an evaluated day, **when** an authorized user views the daily consumption dashboard, **then** the chart displays both the actual consumption value and the calculated rolling four-week baseline for that day.
- **Given** a site does not satisfy the approved minimum-data rule for an evaluated day, **when** the dashboard is displayed, **then** the system does not present a baseline value for that day as a valid calculation.

### FR-4: Anomaly Detection and Chart Highlighting

The system must evaluate each day with a valid baseline and flag the day as an anomaly when actual daily consumption exceeds the baseline by more than the active anomaly threshold. The default threshold must be 20 percent. The threshold must be configurable, but the configuration owner, scope, permitted range, change-management controls, and whether changes recalculate historical anomalies are TBD.

The deviation percentage must be calculated as `(actual daily consumption - baseline) / baseline * 100`. A day whose deviation equals the threshold exactly must not be flagged because the requirement is “more than” the threshold. Flagged days must be visually distinguishable on the consumption chart.

#### Acceptance Criteria

- **Given** a site has an actual daily consumption value of 121 kWh, a valid baseline of 100 kWh, and the active threshold is 20 percent, **when** anomaly detection runs, **then** the system flags that day as an anomaly with a deviation of 21 percent.
- **Given** a site has an actual daily consumption value of 120 kWh, a valid baseline of 100 kWh, and the active threshold is 20 percent, **when** anomaly detection runs, **then** the system does not flag that day as an anomaly.
- **Given** an actual daily consumption value is lower than or equal to its valid baseline, **when** anomaly detection runs, **then** the system does not flag that day as an anomaly.
- **Given** a day is flagged as an anomaly, **when** a user views a chart that includes that day, **then** the chart visually highlights the flagged day in addition to showing the actual consumption data.
- **Given** a day has no valid baseline, **when** anomaly detection runs, **then** the system does not classify that day as an anomaly.

### FR-5: Account Manager Alerts

When the system detects an anomaly for a customer site, it must create an alert visible in the dashboard of the account manager assigned to that customer. Each alert must include the customer name, site, anomaly date, calculated deviation percentage, and a suggested action. The rules for suggested-action content, alert deduplication, historical recalculation behavior, alert lifecycle, and notification channels are TBD.

The alert must link or otherwise navigate the account manager to the corresponding customer-site consumption context, subject to authorization.

#### Acceptance Criteria

- **Given** anomaly detection flags a day for a site belonging to a customer with an assigned account manager, **when** alert generation completes, **then** the assigned account manager has an alert containing the customer name, site, flagged date, deviation percentage, and suggested action.
- **Given** an anomaly alert is shown to an account manager, **when** the account manager opens the alert, **then** the account manager can navigate to the associated authorized customer-site consumption context.
- **Given** an account manager is not assigned to a customer, **when** that customer’s site produces an anomaly, **then** the account manager does not receive or see an alert for that customer.

### FR-6: Peer Benchmarking

The customer view must show a comparison between the selected site's consumption and an anonymized average for its business category when the required category and comparison dataset are available. The comparison must communicate the relative percentage, such as whether the site uses more or less than the comparison average. The definition of “similar-sized,” the business-category source, eligibility criteria, minimum cohort size, comparison period, calculation method, and suppression behavior required to preserve anonymity are TBD.

When a valid anonymized comparison cannot be calculated, the customer view must state that a benchmark is unavailable and must not infer a comparison from missing data.

#### Acceptance Criteria

- **Given** a selected site has a business category and a valid anonymized comparison average for the selected comparison period, **when** an authorized customer user views the site dashboard, **then** the view displays whether the site’s consumption is above or below the comparison average and the calculated percentage difference.
- **Given** a valid anonymized comparison average is unavailable for the selected site or comparison period, **when** an authorized customer user views the site dashboard, **then** the view displays a benchmark-unavailable state and does not display a peer average.
- **Given** the customer view displays peer benchmarking, **when** a user reviews the comparison, **then** no identifiable consumption data for another customer or site is displayed.

### FR-7: Account Manager Customer Ranking

The account-manager dashboard must list only customers assigned to the authenticated account manager and must support ranking the list by anomaly count or deviation severity. The ranking period, definition of deviation severity, tie-breaking rules, default ranking, and treatment of customers with no data are TBD.

The displayed ranking must make clear which ranking criterion is active and allow the account manager to select the available criterion.

#### Acceptance Criteria

- **Given** an account manager has assigned customers with detected anomalies, **when** the account manager selects ranking by anomaly count, **then** the system orders the assigned-customer list from the highest anomaly count to the lowest for the configured ranking period.
- **Given** an account manager has assigned customers with detected anomalies, **when** the account manager selects ranking by deviation severity, **then** the system orders the assigned-customer list according to the approved deviation-severity rule for the configured ranking period.
- **Given** an account manager views the assigned-customer list, **when** the list is displayed, **then** customers not assigned to that account manager are not included.
- **Given** an account manager changes the ranking criterion, **when** the selection is applied, **then** the dashboard identifies the active criterion and refreshes the list ordering accordingly.

### FR-8: Consumption Report Export

An authorized customer user and an authorized account manager must be able to export a consumption report for a selected date range in CSV or PDF format. Exports must contain data only for sites that the requesting user is authorized to access. The report template, required columns and chart content, export size limits, asynchronous-processing behavior, and download-retention period are TBD.

The exported report must represent the selected date range and selected site or sites. If no data is available, the product must clearly report that no exportable data exists rather than produce a report that implies zero consumption.

#### Acceptance Criteria

- **Given** an authorized customer user selects an accessible site, a date range with accepted consumption data, and CSV as the format, **when** the user requests an export, **then** the system provides a CSV report containing consumption information for that selected site and date range.
- **Given** an authorized account manager selects an assigned customer site, a date range with accepted consumption data, and PDF as the format, **when** the account manager requests an export, **then** the system provides a PDF consumption report for that authorized site and date range.
- **Given** a user requests an export for a site or date range that the user is not authorized to access, **when** the request is evaluated, **then** the system denies the request and does not expose report data.
- **Given** no accepted consumption data exists for the authorized selection and date range, **when** a user requests an export, **then** the system informs the user that no exportable data is available.

## Non-functional Requirements

### Security and Authorization

The system must enforce role- and assignment-based access control for all dashboard, alert, ingestion, benchmark, and export requests. It must prevent a customer user from accessing another customer’s sites and prevent an account manager from accessing customers outside their assignments. The identity provider, authorization source of truth, retention requirements, encryption standards, audit requirements, and applicable regulatory obligations are TBD.

### Performance and Availability

Measurable performance targets for dashboard loading, CSV processing, anomaly detection, alert creation, and export completion are TBD. Engineering must define targets before release and validate them with representative input volumes. Until these targets are approved, the feature must provide visible progress or outcome states for processing operations and actionable error messages when a request cannot be completed.

### Accessibility and Usability

Charts, anomaly indicators, ranking controls, upload outcomes, benchmark states, and exports must be usable without relying solely on color. The final accessibility conformance target and supported browsers are TBD. Design must define labels, keyboard interactions, and text alternatives for visualized information before implementation is accepted.

### Reliability and Data Quality

Processing must preserve the association between accepted readings, the customer site, and upload provenance. The system must prevent failed validation from being represented as successfully processed data. Reprocessing, correction, retention, and reconciliation procedures are TBD.

## Data & Integrations

### Required Data

The required input is a CSV meter-reading file with timestamp and kWh fields. Each upload must be associated with a customer site. The product also requires customer names, customer-site records, account-manager assignments, and business-category information to deliver all scoped functionality.

The system derives daily consumption, rolling baselines, anomaly flags, deviation percentages, alert records, ranking inputs, and exportable report data from accepted readings and authorization data. It may require a peer-comparison dataset to calculate anonymized category averages.

### Integration Boundaries

The first-release intake path is CSV upload. The original requirements identify existing smart-meter data in back-office billing systems but do not specify an API, file transfer, data warehouse, or other integration. Direct back-office billing-system integration is therefore out of scope unless separately approved.

The source systems and contracts for customer identity, site identity, account-manager assignment, business category, peer-comparison data, and authentication/authorization must be defined before engineering finalizes interfaces.

## Analytics / Telemetry Events

The product must emit the following events without including raw meter readings or unnecessary personally identifiable information. Event schemas, retention, consent requirements, and analytics platform are TBD.

| Event | Trigger | Required properties |
| --- | --- | --- |
| `meter_upload_started` | A user submits a CSV upload. | user role, customer-site identifier, file size, requested timestamp |
| `meter_upload_completed` | CSV processing succeeds. | customer-site identifier, accepted row count, rejected row count if supported, processing duration |
| `meter_upload_failed` | CSV validation or processing fails. | customer-site identifier if selected, failure category, processing duration |
| `consumption_dashboard_viewed` | A user views a consumption dashboard. | user role, customer-site identifier, date range, aggregation period, data-availability state |
| `anomaly_detected` | A daily value exceeds the active threshold. | customer-site identifier, anomaly date, baseline value, actual value, deviation percentage, threshold |
| `anomaly_alert_created` | An anomaly alert is created. | alert identifier, customer identifier, customer-site identifier, anomaly date, deviation percentage |
| `customer_ranking_changed` | An account manager changes the ranking criterion. | account-manager identifier, ranking criterion, ranking period |
| `benchmark_viewed` | A user views a benchmark state. | customer-site identifier, benchmark availability, business category identifier if permitted |
| `report_export_requested` | A user requests CSV or PDF export. | user role, customer-site identifier, date range, requested format |
| `report_export_completed` | An export becomes available. | requested format, processing duration, result status |
| `report_export_failed` | An export cannot be completed. | requested format, failure category, processing duration |

## Rollout & Migration

The feature should be released behind a feature flag that can be enabled for a controlled set of users or customer sites. Before enabling the feature for a cohort, the delivery team must validate CSV ingestion, baseline calculations, anomaly detection at the active threshold, account-manager authorization boundaries, benchmark suppression behavior, and both export formats using representative non-production data.

No source-data migration is specified because the required first-release ingestion method is CSV upload. If existing back-office meter data is to be loaded, the data mapping, historical-data quality rules, backfill window, reconciliation process, and rollback approach must be defined in a separate approved migration plan. Rollback must disable feature access without deleting source meter readings or audit evidence.

## Open Questions / TBDs

1. What exact CSV headers, timestamp format, timezone, unit validation rules, file-size limit, row limit, and duplicate-reading policy are required?
2. Can one CSV contain readings for more than one site, or must each upload represent one selected site?
3. What is the approved handling for partially valid CSV files, missing readings, incomplete days, and less than 28 days of consumption history?
4. Who can configure the anomaly threshold, at what scope, within what permitted range, and do threshold changes recalculate historical anomalies and alerts?
5. What suggested actions should alerts use, who owns their content, and how are repeated alerts for the same condition handled?
6. What source system defines customer sites, account-manager assignments, authentication, and authorization?
7. What source and governance rules define business category, site size, peer cohort eligibility, minimum anonymized cohort size, comparison period, and peer-average calculation?
8. What date range is the dashboard default, what date range drives account-manager ranking, and how is deviation severity calculated?
9. What data fields, visualizations, branding, export limits, retention period, and asynchronous behavior are required for PDF and CSV reports?
10. What measurable service-level, processing-volume, accessibility, browser-support, security, privacy, audit, and retention requirements apply?
11. Is a direct integration with the back-office billing system planned after CSV upload, and if so, what interface, ownership, and reconciliation contract will be used?

## Dependencies

Delivery depends on approved customer-site identity and authorization data, account-manager assignment data, a data store for accepted meter readings and derived analytics, a charting interface, PDF and CSV export capability, and a source or process for peer benchmarking. It also depends on decisions recorded in the open questions before the affected requirements can be implemented and verified.

## Related

This feature specification is based exclusively on the uploaded requirements provided for the EnerSight Analytics work item. It has no identified roadmap item, epic, user story, test-case, or architecture-spec artifact at the time of authoring.
