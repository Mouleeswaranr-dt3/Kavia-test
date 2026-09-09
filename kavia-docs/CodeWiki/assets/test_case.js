/**
 * Spec Builder test-case renderer for MkDocs Material.
 *
 * Renders a test case JSON artifact as a compact validation hub with a hero
 * summary, metadata pills, execution steps, expected results, coverage links,
 * evidence, and provenance. The renderer is tolerant of partial payloads and
 * mirrors the roadmap/roadmap-item visual language.
 */

/* global SpecBuilderRendererRegistry */

(function () {
  "use strict";

  const registry = globalThis.SpecBuilderRendererRegistry;
  if (!registry || typeof registry.register !== "function") {
    return;
  }

  const u = registry.utils || {};

  function asString(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  function titleCase(value) {
    if (u.titleCase) return u.titleCase(value);
    return asString(value)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, function (char) {
        return char.toUpperCase();
      });
  }

  function slugToLabel(value) {
    if (u.slugToLabel) return u.slugToLabel(value);
    return titleCase(value);
  }

  function el(tagName, className, text) {
    if (u.el) return u.el(tagName, className, text);
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function badge(value, className) {
    if (u.badge) return u.badge(value, className);
    const node = el("span", className || "sb-status-badge", titleCase(value));
    node.setAttribute("data-value", asString(value).toLowerCase());
    return node;
  }

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeList(value) {
    if (Array.isArray(value)) return value.filter(function (item) {
      return item !== null && item !== undefined && asString(item) !== "";
    });
    if (asString(value)) return [value];
    return [];
  }

  function normalizeSteps(data) {
    const candidates = data.steps || data.test_steps || data.procedure || data.execution_steps;
    return normalizeList(candidates).map(function (step, index) {
      if (isObject(step)) {
        return {
          order: step.order || step.step || index + 1,
          action: asString(step.action || step.description || step.name || step.title),
          expected: asString(step.expected || step.expected_result || step.result || step.outcome),
          notes: asString(step.notes || step.detail || step.details)
        };
      }

      return {
        order: index + 1,
        action: asString(step),
        expected: "",
        notes: ""
      };
    }).filter(function (step) {
      return step.action || step.expected || step.notes;
    });
  }

  function normalizeLinks(value) {
    return normalizeList(value).map(function (item) {
      if (isObject(item)) {
        return {
          label: asString(item.title || item.label || item.name || item.id || item.href || item.url || item.path),
          href: asString(item.href || item.url || item.path || item.link),
          description: asString(item.description || item.summary || item.notes)
        };
      }

      return {
        label: asString(item),
        href: "",
        description: ""
      };
    }).filter(function (item) {
      return item.label || item.href;
    });
  }

  function appendMetaPill(container, label, value, className) {
    const text = asString(value);
    if (!text) return;

    const pill = el("span", className || "sb-test-case-meta-pill");
    pill.appendChild(el("span", "sb-test-case-meta-label", label + ":"));
    pill.appendChild(el("span", "sb-test-case-meta-value", text));
    container.appendChild(pill);
  }

  function appendBadgePill(container, label, value, className) {
    const text = asString(value);
    if (!text) return;

    const wrapper = el("span", "sb-test-case-meta-pill sb-test-case-meta-pill-badge");
    wrapper.appendChild(el("span", "sb-test-case-meta-label", label + ":"));
    wrapper.appendChild(badge(text, className));
    container.appendChild(wrapper);
  }

  function buildHero(data) {
    const hero = el("section", "sb-test-case-hero");
    hero.setAttribute("aria-label", "Test case summary");

    hero.appendChild(el("div", "sb-test-case-eyebrow", "Test Case"));

    const title = asString(data.title || data.name) || slugToLabel(data.id || data.test_case_id) || "Untitled test case";
    hero.appendChild(el("h1", "sb-test-case-title", title));

    const description = asString(data.description || data.summary || data.objective);
    if (description) {
      hero.appendChild(el("p", "sb-test-case-hero-summary", description));
    }

    const meta = el("div", "sb-test-case-meta");
    appendBadgePill(meta, "Status", data.status || data.state, "sb-status-badge");
    appendBadgePill(meta, "Priority", data.priority, "sb-priority-indicator");
    appendMetaPill(meta, "Type", data.type || data.test_type || data.category);
    appendMetaPill(meta, "Owner", data.owner || data.assignee);
    appendMetaPill(meta, "Updated", data.updated_at || data.modified_at);
    if (meta.childNodes.length > 0) {
      hero.appendChild(meta);
    }

    return hero;
  }

  function buildMetricGrid(viewModel) {
    const grid = el("section", "sb-test-case-kpi-grid");
    grid.setAttribute("aria-label", "Test case metrics");

    [
      ["Steps", viewModel.steps.length],
      ["Expected Results", viewModel.expectedResults.length],
      ["Coverage Links", viewModel.coverageLinks.length],
      ["Evidence Items", viewModel.evidence.length]
    ].forEach(function (metric) {
      const card = el("div", "sb-test-case-kpi-card");
      card.appendChild(el("div", "sb-test-case-kpi-value", String(metric[1] || 0)));
      card.appendChild(el("div", "sb-test-case-kpi-label", metric[0]));
      grid.appendChild(card);
    });

    return grid;
  }

  function buildTags(tags) {
    const normalized = normalizeList(tags);
    if (normalized.length === 0) return null;

    const container = el("div", "sb-tags-container");
    normalized.forEach(function (tag) {
      container.appendChild(el("span", "spec-builder-tag", asString(tag)));
    });
    return container;
  }

  function buildOverview(data) {
    const preconditions = normalizeList(data.preconditions || data.given);
    const assumptions = normalizeList(data.assumptions);
    const tagsNode = buildTags(data.tags || data.labels);
    const hasContent = preconditions.length > 0 || assumptions.length > 0 || tagsNode;

    if (!hasContent) return null;

    const section = el("section", "sb-test-case-section sb-test-case-overview");
    section.appendChild(el("h2", "", "Validation Overview"));

    const grid = el("div", "sb-test-case-card-grid");

    if (preconditions.length > 0) {
      const card = el("div", "sb-test-case-card");
      card.appendChild(el("h3", "", "Preconditions"));
      const list = el("ul", "sb-test-case-checklist");
      preconditions.forEach(function (item) {
        const li = el("li", "");
        li.appendChild(el("span", "sb-test-case-check", "✓"));
        li.appendChild(el("span", "", asString(item)));
        list.appendChild(li);
      });
      card.appendChild(list);
      grid.appendChild(card);
    }

    if (assumptions.length > 0) {
      const card = el("div", "sb-test-case-card");
      card.appendChild(el("h3", "", "Assumptions"));
      const list = el("ul", "sb-test-case-list");
      assumptions.forEach(function (item) {
        list.appendChild(el("li", "", asString(item)));
      });
      card.appendChild(list);
      grid.appendChild(card);
    }

    if (tagsNode) {
      const card = el("div", "sb-test-case-card");
      card.appendChild(el("h3", "", "Tags"));
      card.appendChild(tagsNode);
      grid.appendChild(card);
    }

    section.appendChild(grid);
    return section;
  }

  function buildStepsSection(steps) {
    const section = el("section", "sb-test-case-section");
    section.appendChild(el("h2", "", "Execution Steps"));

    if (steps.length === 0) {
      section.appendChild(el("div", "sb-empty-state", "No execution steps are defined for this test case."));
      return section;
    }

    const wrapper = el("div", "sb-test-case-table-wrap");
    const table = document.createElement("table");
    table.className = "sb-test-case-table";
    table.setAttribute("aria-label", "Execution steps");

    const thead = table.createTHead();
    const headRow = thead.insertRow();
    headRow.appendChild(el("th", "sb-test-case-step-num", "#"));
    headRow.appendChild(el("th", "", "Action"));
    headRow.appendChild(el("th", "", "Expected result"));
    headRow.appendChild(el("th", "", "Notes"));

    const tbody = table.createTBody();
    steps.forEach(function (step) {
      const row = tbody.insertRow();
      row.insertCell().textContent = asString(step.order);
      row.cells[0].className = "sb-test-case-step-num";
      row.insertCell().textContent = step.action || "—";
      row.insertCell().textContent = step.expected || "—";
      row.insertCell().textContent = step.notes || "—";
    });

    wrapper.appendChild(table);
    section.appendChild(wrapper);
    return section;
  }

  function buildExpectedResultsSection(results) {
    if (results.length === 0) return null;

    const section = el("section", "sb-test-case-section");
    section.appendChild(el("h2", "", "Expected Results"));

    const card = el("div", "sb-test-case-card");
    const list = el("ul", "sb-test-case-checklist");
    results.forEach(function (result) {
      const li = el("li", "");
      li.appendChild(el("span", "sb-test-case-check", "✓"));
      li.appendChild(el("span", "", asString(result)));
      list.appendChild(li);
    });
    card.appendChild(list);
    section.appendChild(card);
    return section;
  }

  function buildLinkCards(title, intro, links) {
    if (links.length === 0) return null;

    const section = el("section", "sb-test-case-section");
    section.appendChild(el("h2", "", title));
    if (intro) {
      section.appendChild(el("p", "sb-test-case-section-intro", intro));
    }

    const grid = el("div", "sb-test-case-link-grid");
    links.forEach(function (item) {
      const card = el("div", "sb-test-case-card sb-test-case-link-card");
      const heading = el("h3", "", "");

      if (item.href) {
        const link = document.createElement("a");
        link.href = item.href;
        link.textContent = item.label || item.href;
        heading.appendChild(link);
      } else {
        heading.textContent = item.label;
      }

      card.appendChild(heading);
      if (item.description) {
        card.appendChild(el("p", "sb-test-case-link-description", item.description));
      }
      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  function buildSummaryTable(data) {
    const rows = [
      ["ID", data.id || data.test_case_id],
      ["Type", data.type || data.test_type || data.category],
      ["Status", data.status || data.state],
      ["Priority", data.priority],
      ["Owner", data.owner || data.assignee],
      ["Coverage Target", data.coverage_target || data.target || data.story_id || data.epic_id || data.acceptance_criterion],
      ["Created", data.created_at],
      ["Updated", data.updated_at || data.modified_at],
      ["Source", data.source_json_path]
    ].filter(function (row) {
      return asString(row[1]);
    });

    const table = document.createElement("table");
    table.className = "sb-summary-table";
    table.setAttribute("aria-label", "Test case metadata");

    const tbody = table.createTBody();
    rows.forEach(function (rowData) {
      const row = tbody.insertRow();
      const keyCell = row.insertCell();
      keyCell.className = "sb-summary-key";
      keyCell.textContent = rowData[0];

      const valueCell = row.insertCell();
      if (rowData[0] === "Status") {
        valueCell.appendChild(badge(rowData[1], "sb-status-badge"));
      } else if (rowData[0] === "Priority") {
        valueCell.appendChild(badge(rowData[1], "sb-priority-indicator"));
      } else {
        valueCell.textContent = String(rowData[1]);
      }
    });

    return table;
  }

  function buildMetadataDetails(data) {
    const details = el("details", "sb-test-case-metadata-details");
    const summary = document.createElement("summary");
    summary.textContent = "Metadata and provenance";
    details.appendChild(summary);

    const body = el("div", "sb-test-case-metadata-body");
    body.appendChild(buildSummaryTable(data));

    if (isObject(data.provenance)) {
      body.appendChild(el("h3", "", "Provenance"));
      const table = document.createElement("table");
      table.className = "sb-summary-table";
      table.setAttribute("aria-label", "Test case provenance");
      const tbody = table.createTBody();

      Object.keys(data.provenance).forEach(function (key) {
        const value = data.provenance[key];
        if (!asString(value) && !Array.isArray(value)) return;

        const row = tbody.insertRow();
        const keyCell = row.insertCell();
        keyCell.className = "sb-summary-key";
        keyCell.textContent = titleCase(key);
        row.insertCell().textContent = Array.isArray(value) ? value.join(", ") : String(value);
      });

      if (tbody.childNodes.length > 0) {
        body.appendChild(table);
      }
    }

    details.appendChild(body);
    return details;
  }

  function buildViewModel(data) {
    const steps = normalizeSteps(data);
    const expectedResults = normalizeList(data.expected_results || data.expected_result || data.then);
    const coverageLinks = normalizeLinks(
      data.coverage_links ||
      data.related_artifacts ||
      data.traceability ||
      data.links ||
      data.story_ids ||
      data.epic_ids
    );
    const evidence = normalizeLinks(data.evidence || data.attachments || data.references);

    return {
      steps: steps,
      expectedResults: expectedResults,
      coverageLinks: coverageLinks,
      evidence: evidence
    };
  }

  // PUBLIC_INTERFACE
  function renderTestCasePage(root, data) {
    /**
     * Render a test case artifact as a styled validation hub.
     *
     * Parameters:
     *   root: The target DOM element receiving generated test-case sections.
     *   data: The embedded test case JSON payload.
     *
     * Returns:
     *   Nothing. The function mutates the supplied root element.
     */
    if (!data || typeof data !== "object") {
      root.innerHTML = "<div class=\"sb-empty-state\">No test case data available.</div>";
      return;
    }

    const viewModel = buildViewModel(data);

    root.appendChild(buildHero(data));
    root.appendChild(buildMetricGrid(viewModel));

    const overview = buildOverview(data);
    if (overview) root.appendChild(overview);

    root.appendChild(buildStepsSection(viewModel.steps));

    const expected = buildExpectedResultsSection(viewModel.expectedResults);
    if (expected) root.appendChild(expected);

    const coverage = buildLinkCards(
      "Coverage and Traceability",
      "Requirements, stories, epics, or acceptance criteria validated by this test case.",
      viewModel.coverageLinks
    );
    if (coverage) root.appendChild(coverage);

    const evidence = buildLinkCards(
      "Evidence and References",
      "Execution evidence, attachments, or supporting references for this validation path.",
      viewModel.evidence
    );
    if (evidence) root.appendChild(evidence);

    root.appendChild(buildMetadataDetails(data));
  }

  registry.register("test_case", renderTestCasePage);
})();
