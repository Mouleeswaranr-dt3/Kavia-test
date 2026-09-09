# Commercial Energy Analytics Product and Business Analysis

[CodeWiki](../../index.md) / [Specs](../index.md) / [Other Specifications](index.md)

## Purpose and Scope

This analysis translates the existing Commercial Energy Consumption Analytics and Anomaly Alerts feature specification into product-management and business-analysis context. It does not add business requirements. Where the feature specification leaves a decision open, this document records it as an assumption, constraint, risk, or discovery question for resolution before architecture and development.

## Personas

### Maya Patel, Commercial Account Manager

**Role.** Maya manages a portfolio of commercial energy customers and uses the account-manager dashboard to prepare customer conversations, identify sites requiring attention, and support quarterly business reviews.

**Goals.** Maya wants to identify the assigned customers and sites with the most material consumption changes, understand the anomaly details before contacting a customer, and prioritize her limited follow-up time using a clear ranking view.

**Pain Points.** Monthly billing information arrives too late to support timely conversations about unusual usage. Maya currently lacks a consolidated view of consumption anomalies across her assigned customers and cannot easily distinguish a material deviation from a normal pattern without the proposed analytics.

**Responsibilities.** Maya is responsible for reviewing customers assigned to her, using anomaly information to guide customer outreach, and ensuring that her follow-up discussions are based on the authorized customer-site context. She is not responsible for altering source meter readings, issuing bills, or automatically remediating energy usage.

**Success Metrics.** Maya succeeds when she can view only her assigned customers, rank them by anomaly count or deviation severity, open an alert that identifies the customer, site, date, deviation percentage, and suggested action, and navigate to the associated authorized consumption context.

**Features Used.** Maya uses the account-manager customer ranking, anomaly alerts, customer-site consumption views, daily baseline and anomaly chart information, and CSV or PDF consumption report exports for authorized assigned sites.

### Daniel Brooks, Commercial Customer Operations Lead

**Role.** Daniel is an authorized customer user responsible for monitoring energy consumption across the commercial organization's sites and preparing information for operational or management review.

**Goals.** Daniel wants to understand site consumption over time, compare actual daily consumption with a rolling baseline, recognize anomaly days before monthly billing information is received, and export selected consumption data for a date range.

**Pain Points.** Daniel currently receives monthly billing information without a customer-facing view into the interval consumption data that contributes to the bill. This prevents him from readily identifying usage trends or material changes at a site.

**Responsibilities.** Daniel is responsible for selecting authorized customer sites, reviewing consumption trends and available peer benchmarks, and requesting exports for authorized data. He must use the product within the customer organization and site access granted to him.

**Success Metrics.** Daniel succeeds when he can select an authorized site, understand daily, weekly, and monthly consumption views, see a valid rolling baseline alongside daily actual consumption, identify highlighted anomaly days, understand when a peer benchmark is unavailable, and obtain an authorized CSV or PDF export for the selected date range.

**Features Used.** Daniel uses the customer consumption dashboard, aggregation controls, rolling four-week baseline, anomaly chart highlighting, peer benchmarking when available, explicit no-data and benchmark-unavailable states, and CSV or PDF report exports.

### Sofia Nguyen, Meter Data Operations Specialist

**Role.** Sofia is an authorized operational user who prepares and uploads CSV meter-reading data for a selected customer site so that the analytics feature can produce usable consumption information.

**Goals.** Sofia wants to upload valid meter-reading files successfully, receive clear processing outcomes, quickly correct invalid files, and maintain confidence that accepted readings remain associated with the intended customer site.

**Pain Points.** CSV format details, timestamp interpretation, size limits, row limits, duplicate-reading policy, and partial-validity handling are not yet finalized. Without these decisions and clear feedback, Sofia may not know how to prepare an acceptable file or how to remediate a failed upload.

**Responsibilities.** Sofia is responsible for selecting the appropriate customer site, submitting CSV files containing the required timestamp and kWh information, and responding to reported validation or processing outcomes. She is not responsible for changing accepted readings through the analytics feature or exposing uploaded data to unauthorized users.

**Success Metrics.** Sofia succeeds when a valid upload results in a usable site-associated dataset and a clear success outcome, while an invalid upload identifies missing required columns or invalid values and never becomes available as a consumption dataset.

**Features Used.** Sofia uses CSV meter-data upload, customer-site selection, upload validation and processing outcomes, and the resulting telemetry-supported processing status information.

## Business Assumptions

The analysis assumes that commercial customers have a business need to understand consumption before the monthly billing cycle and that account managers can improve customer engagement by focusing on assigned customers with unusual consumption patterns. It assumes that daily consumption trends, a rolling four-week baseline, and anomaly indicators are understandable and useful decision-support information, while not representing proof of energy waste.

The analysis also assumes that customer-site records, customer names, account-manager assignments, and business-category information either exist or can be made available to the feature. The first release assumes CSV upload is an acceptable intake mechanism for meter-reading data because direct integration with the back-office billing system is explicitly not defined for the release.

Peer benchmarking assumes that a valid anonymized comparison dataset may be available for some sites and periods. The product must remain useful when a comparison cannot be calculated and must communicate benchmark unavailability rather than fabricate a comparison.

## Technical Assumptions

The feature assumes that accepted CSV data can be parsed into timestamped kWh readings and associated with one selected customer site. It further assumes that the accepted readings can be aggregated into daily, weekly, and monthly consumption values, with enough historical daily data to calculate a rolling four-week baseline where the final minimum-data rule is met.

The analysis assumes that the system can derive daily anomaly flags and deviation percentages from accepted readings and the active threshold. It assumes that the authorization layer can determine both customer organization and site access for customer users, as well as customer assignments for account managers, before returning dashboard data, alerts, benchmarks, or exports.

The feature also assumes that the delivery solution can provide charting, CSV export, PDF export, telemetry, feature-flag control, and a persistent store for upload provenance and derived analytics. These assumptions do not select any particular technology, interface, or source system.

## Constraints

The first release is constrained to CSV uploads containing timestamp and kWh information. It must not generate bills, replace the back-office billing system, alter source meter readings, control customer equipment, automatically remediate high usage, or support non-CSV uploads.

Access is constrained by role and authorization boundaries. Customer users may access only authorized customer organizations and sites, while account managers may access only their assigned customers. Uploaded files, dashboard results, alerts, benchmarks, and exports must observe those boundaries.

Anomaly detection is constrained to days with a valid baseline. The baseline uses the 28 calendar days preceding the evaluated day and excludes the evaluated day. At the default 20 percent threshold, a deviation must be greater than 20 percent to be flagged; a deviation exactly equal to 20 percent is not an anomaly.

Peer comparison is constrained by the availability of valid anonymized comparison data. The product must not display identifiable consumption information for another customer or site, and it must state that a benchmark is unavailable when a valid comparison cannot be calculated.

## Risks

### Incomplete or Inconsistent Meter Data

**Risk Level.** High.

**Impact.** Missing readings, invalid timestamps, non-numeric kWh values, duplicates, incomplete days, or insufficient history can prevent reliable aggregation, baselines, anomaly detection, and reports. If handling rules are unclear, users may misunderstand whether displayed results are complete and trustworthy.

**Mitigation.** Finalize file format, timezone, unit validation, duplicate, partial-validity, missing-reading, and minimum-data decisions before implementation. Provide explicit validation outcomes and no-data or unavailable-baseline states when accepted data cannot support a valid calculation.

### Authorization Source and Assignment Ambiguity

**Risk Level.** High.

**Impact.** If the source of truth for customer-site access and account-manager assignments is not defined, the feature could expose customer data, alerts, or exports outside the permitted authorization boundary.

**Mitigation.** Identify the identity provider and authorization sources of truth before finalizing interfaces. Validate role- and assignment-based access for ingestion, dashboards, alerts, benchmarks, and exports with representative test data before rollout.

### Benchmark Privacy and Data Availability

**Risk Level.** High.

**Impact.** Undefined cohort eligibility, minimum cohort size, comparison-period rules, or suppression behavior may lead to misleading comparisons or expose information about other customers or sites.

**Mitigation.** Establish peer-data governance, anonymization, eligibility, and suppression rules before enabling benchmarking. Treat unavailable or insufficient comparison data as an explicit benchmark-unavailable state.

### Threshold Ownership and Historical Recalculation

**Risk Level.** Medium.

**Impact.** Without an agreed configuration owner, scope, range, and historical-recalculation policy, anomaly flags and account-manager alerts may be inconsistent or difficult to explain over time.

**Mitigation.** Define threshold governance and change-management rules before implementing configuration. Specify whether a threshold change affects historical anomalies, alerts, rankings, and exports.

### Alert Usefulness and Repetition

**Risk Level.** Medium.

**Impact.** Undefined suggested-action content, duplicate-alert handling, and alert lifecycle may produce repetitive or low-value alerts that account managers do not trust or use.

**Mitigation.** Agree on suggested-action ownership, alert deduplication, historical behavior, and lifecycle expectations. Validate the resulting alert content and ranking behavior with account-manager representatives during controlled rollout.

### Export Expectations and Operational Limits

**Risk Level.** Medium.

**Impact.** Unresolved report content, branding, file-size limits, asynchronous behavior, and retention may produce exports that do not meet user needs or cannot be reliably delivered at expected volumes.

**Mitigation.** Define report templates, required data and charts, export limits, retention, and completion expectations before implementation. Show clear progress, success, and actionable failure states for export requests.

### Performance and Accessibility Targets Are Unspecified

**Risk Level.** Medium.

**Impact.** Without measurable processing, dashboard, export, accessibility, and browser-support targets, the delivery team cannot objectively assess release readiness or usability for visualized information.

**Mitigation.** Set measurable targets before release and validate them with representative input volumes. Define accessible labels, keyboard interactions, text alternatives, and non-color-only anomaly indicators before acceptance.

### Future Back-Office Data Integration

**Risk Level.** Low.

**Impact.** A future direct integration with the back-office billing system may require data mapping, reconciliation, and historical backfill decisions that differ from the CSV-based first release.

**Mitigation.** Keep direct integration out of scope for this release. If it is later approved, create a separate migration and integration plan covering ownership, interface contracts, historical quality rules, reconciliation, and rollback.

## Discovery Questions

1. What exact CSV headers, timestamp formats, timezone rules, kWh unit validation rules, file-size limits, row limits, and duplicate-reading policies are required?

2. Must each CSV represent one selected customer site, or can a file contain readings for more than one site?

3. How should the system handle partially valid CSV files, missing readings, incomplete days, and fewer than 28 days of consumption history?

4. Which users are authorized to upload meter data, and what customer-site selection workflow ensures that a dataset is associated with the correct site?

5. Who owns anomaly-threshold configuration, at what scope may it be changed, what range is permitted, and do changes recalculate historical anomalies, alerts, rankings, or reports?

6. What suggested actions should account-manager alerts contain, who approves and maintains that content, and how should repeated alerts for the same condition be handled?

7. Which source systems define customer identity, site identity, customer-user authorization, and account-manager assignments?

8. What dashboard date range should be selected by default, what date range drives account-manager ranking, and how is deviation severity defined?

9. What source and governance rules define business category, site size, peer cohort eligibility, minimum anonymized cohort size, comparison period, and peer-average calculation?

10. What fields, charts, branding, size limits, retention period, and synchronous or asynchronous behavior are required for CSV and PDF exports?

11. What performance, availability, processing-volume, security, privacy, audit, retention, accessibility, and browser-support targets must be met before release?

12. Is a direct integration with the back-office billing system planned after the CSV-based release, and if so, what interface, ownership, backfill, reconciliation, and rollback contract will be required?

## Traceability

This analysis is derived exclusively from the feature specification [Commercial Energy Consumption Analytics and Anomaly Alerts](../FeatureSpecs/commercial-energy-consumption-analytics-anomaly-alerts.md). The personas, assumptions, constraints, risks, and questions restate or organize information already present in that specification and do not approve or introduce additional business scope.
