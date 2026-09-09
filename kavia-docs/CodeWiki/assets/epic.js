/**
 * Spec Builder epic renderer for MkDocs Material.
 *
 * Renders an epic JSON artifact as a professional planning hub that matches the
 * roadmap and roadmap item visual language: hero header, KPI cards, overview
 * cards, semantic tables for child stories and validation coverage, supporting
 * links, and metadata/provenance details.
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

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeList(value) {
    if (Array.isArray(value)) {
      return value.filter(function (item) {
        return item !== null && item !== undefined && (isObject(item) || asString(item));
      });
    }
    if (isObject(value) || asString(value)) return [value];
    return [];
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
    const text = asString(value);
    const slug = text.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "-");
    const node = el("span", className || "sb-status-badge", text);
    node.setAttribute("data-value", slug);
    return node;
  }

  function inferArtifactHref(kind, id) {
    const slug = asString(id);
    if (!slug) return "#";
    const folder = u.artifactPageFolder ? u.artifactPageFolder(kind) : kind;
    if (u.relativeSpecBuilderHref) {
      return u.relativeSpecBuilderHref(folder + "/" + slug + ".html");
    }
    return "../" + folder + "/" + slug + ".html";
  }

  function isExternalHref(href) {
    const value = asString(href).toLowerCase();
    return value.indexOf("http://") === 0 || value.indexOf("https://") === 0 || value.indexOf("mailto:") === 0;
  }

  function normalizeHref(pathOrUrl) {
    const value = asString(pathOrUrl);
    if (!value) return "#";
    if (isExternalHref(value) || value.charAt(0) === "#") return value;
    if (u.normalizeLink && value.indexOf("kavia-docs/CodeWiki/") === 0) return u.normalizeLink(value);
    return value.replace(/\.md$/i, ".html");
  }

  function documentTitleFromPath(pathOrUrl) {
    const value = asString(pathOrUrl);
    if (!value) return "Untitled document";
    const cleaned = value.split("#")[0].split("?")[0];
    const parts = cleaned.split("/");
    return slugToLabel((parts[parts.length - 1] || cleaned).replace(/\.(md|html|json)$/i, ""));
  }

  function appendMetaPill(container, label, value, className) {
    const text = asString(value);
    if (!text) return;

    const pill = el("span", className || "sb-epic-meta-pill");
    pill.appendChild(el("span", "sb-epic-meta-label", label + ":"));
    pill.appendChild(el("span", "sb-epic-meta-value", text));
    container.appendChild(pill);
  }

  function appendBadgePill(container, label, value, className) {
    const text = asString(value);
    if (!text) return;

    const pill = el("span", "sb-epic-meta-pill sb-epic-meta-pill-badge");
    pill.appendChild(el("span", "sb-epic-meta-label", label + ":"));
    pill.appendChild(badge(text, className));
    container.appendChild(pill);
  }

  function appendBadgeOrMuted(cell, value, className, emptyText) {
    const text = asString(value);
    if (text) {
      cell.appendChild(badge(text, className));
    } else {
      cell.appendChild(el("span", "sb-muted", emptyText || "Not set"));
    }
  }

  function normalizeStory(storyLike, resolvedMap) {
    if (isObject(storyLike)) return storyLike;

    const id = asString(storyLike);
    if (id && resolvedMap && isObject(resolvedMap[id])) return resolvedMap[id];

    return {
      id: id,
      title: id ? slugToLabel(id) : "Untitled user story"
    };
  }

  function normalizeStories(data) {
    const resolvedMap = isObject(data._resolved) ? data._resolved : {};
    const explicitStories = normalizeList(data.stories || data.user_stories || data.linked_stories);
    const storyIds = normalizeList(data.story_ids || data.user_story_ids);

    const seen = {};
    return explicitStories.concat(storyIds).map(function (storyLike) {
      return normalizeStory(storyLike, resolvedMap);
    }).filter(function (story) {
      const id = asString(story.id || story.story_id || story.user_story_id || story.title);
      if (!id || seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function normalizeTestCase(testCaseLike, resolvedMap) {
    if (isObject(testCaseLike)) return testCaseLike;

    const id = asString(testCaseLike);
    if (id && resolvedMap && isObject(resolvedMap[id])) return resolvedMap[id];

    return {
      id: id,
      title: id ? slugToLabel(id) : "Untitled test case"
    };
  }

  function normalizeTestCases(data) {
    const resolvedMap = isObject(data._resolved) ? data._resolved : {};
    const explicit = normalizeList(data.test_cases || data.tests || data.validation);
    const ids = normalizeList(data.test_case_ids || data.validation_ids);
    const seen = {};

    return explicit.concat(ids).map(function (item) {
      return normalizeTestCase(item, resolvedMap);
    }).filter(function (item) {
      const id = asString(item.id || item.test_case_id || item.slug || item.title);
      if (!id || seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function normalizeLinks(value) {
    const groups = [];

    if (isObject(value) && !Array.isArray(value)) {
      Object.keys(value).forEach(function (groupKey) {
        const items = normalizeList(value[groupKey]).map(normalizeLinkItem).filter(Boolean);
        if (items.length > 0) {
          groups.push({
            key: groupKey,
            label: titleCase(groupKey),
            items: items
          });
        }
      });
    } else {
      const items = normalizeList(value).map(normalizeLinkItem).filter(Boolean);
      if (items.length > 0) {
        groups.push({
          key: "links",
          label: "Supporting Links",
          items: items
        });
      }
    }

    return groups;
  }

  function normalizeLinkItem(item) {
    if (isObject(item)) {
      const href = asString(item.href || item.url || item.path || item.file || item.link);
      const label = asString(item.title || item.label || item.name || item.id) || documentTitleFromPath(href);
      if (!label && !href) return null;
      return {
        label: label || href,
        href: normalizeHref(href),
        description: asString(item.description || item.summary || item.notes)
      };
    }

    const href = asString(item);
    if (!href) return null;
    return {
      label: documentTitleFromPath(href),
      href: normalizeHref(href),
      description: ""
    };
  }

  function hasAnyValue(items, keys) {
    return items.some(function (item) {
      return keys.some(function (key) {
        const value = item[key];
        return value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
      });
    });
  }

  function buildViewModel(data) {
    const stories = normalizeStories(data);
    const testCases = normalizeTestCases(data);
    const linkGroups = normalizeLinks(data.links || data.supporting_documents || data.references);

    const acceptanceCriteria = normalizeList(data.acceptance_criteria || data.acceptanceCriteria || data.criteria);
    const risks = normalizeList(data.risks);
    const dependencies = normalizeList(data.dependencies);
    const tags = normalizeList(data.tags || data.labels);

    return {
      stories: stories,
      testCases: testCases,
      linkGroups: linkGroups,
      acceptanceCriteria: acceptanceCriteria,
      risks: risks,
      dependencies: dependencies,
      tags: tags,
      counts: {
        stories: stories.length,
        testCases: testCases.length,
        acceptanceCriteria: acceptanceCriteria.length,
        risks: risks.length,
        dependencies: dependencies.length,
        supportingDocs: linkGroups.reduce(function (total, group) {
          return total + group.items.length;
        }, 0)
      },
      optionalColumns: {
        storyStatus: hasAnyValue(stories, ["status", "state"]),
        storyPriority: hasAnyValue(stories, ["priority"]),
        storyOwner: hasAnyValue(stories, ["owner", "assignee"]),
        storyCoverage: hasAnyValue(stories, ["test_case_ids", "test_cases", "coverage"]),
        testType: hasAnyValue(testCases, ["type", "test_type", "category"]),
        testStatus: hasAnyValue(testCases, ["status", "state"]),
        testCoverage: hasAnyValue(testCases, ["coverage_target", "target", "story_id", "acceptance_criterion"])
      }
    };
  }

  function buildHero(data) {
    const hero = el("section", "sb-epic-hero");
    hero.setAttribute("aria-label", "Epic summary");

    hero.appendChild(el("div", "sb-epic-eyebrow", "Epic"));

    const title = asString(data.title || data.name) || slugToLabel(data.id || data.epic_id) || "Untitled epic";
    hero.appendChild(el("h1", "sb-epic-title", title));

    const description = asString(data.description || data.summary || data.goal);
    if (description) {
      hero.appendChild(el("p", "sb-epic-hero-summary", description));
    }

    const meta = el("div", "sb-epic-meta");
    appendBadgePill(meta, "Status", data.status || data.state, "sb-status-badge");
    appendBadgePill(meta, "Priority", data.priority, "sb-priority-indicator");
    appendMetaPill(meta, "Owner", data.owner || data.assignee);
    appendMetaPill(meta, "Roadmap Item", data.roadmap_item_id || data.parent_roadmap_item_id);
    appendMetaPill(meta, "Target", data.target_date || data.due_date);
    appendMetaPill(meta, "Updated", data.updated_at || data.modified_at);

    if (meta.childNodes.length > 0) {
      hero.appendChild(meta);
    }

    return hero;
  }

  function buildMetricGrid(viewModel) {
    const grid = el("section", "sb-epic-kpi-grid");
    grid.setAttribute("aria-label", "Epic relationship metrics");

    [
      ["User Stories", viewModel.counts.stories],
      ["Test Cases", viewModel.counts.testCases],
      ["Acceptance Criteria", viewModel.counts.acceptanceCriteria],
      ["Risks", viewModel.counts.risks],
      ["Dependencies", viewModel.counts.dependencies],
      ["Supporting Docs", viewModel.counts.supportingDocs]
    ].forEach(function (metric) {
      const card = el("div", "sb-epic-kpi-card");
      card.appendChild(el("div", "sb-epic-kpi-value", String(metric[1] || 0)));
      card.appendChild(el("div", "sb-epic-kpi-label", metric[0]));
      grid.appendChild(card);
    });

    return grid;
  }

  function buildTagsNode(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return null;
    const container = el("div", "sb-tags-container");
    tags.forEach(function (tag) {
      const text = asString(tag);
      if (text) container.appendChild(el("span", "spec-builder-tag", text));
    });
    return container.childNodes.length > 0 ? container : null;
  }

  function buildChecklistCard(title, values) {
    if (!Array.isArray(values) || values.length === 0) return null;

    const card = el("div", "sb-epic-card");
    card.appendChild(el("h3", "", title));
    const list = el("ul", "sb-epic-checklist");

    values.forEach(function (value) {
      const text = isObject(value)
        ? asString(value.title || value.name || value.description || value.summary || value.id)
        : asString(value);
      if (!text) return;

      const item = el("li", "");
      item.appendChild(el("span", "sb-epic-check", "✓"));
      item.appendChild(el("span", "", text));
      list.appendChild(item);
    });

    if (list.childNodes.length === 0) return null;
    card.appendChild(list);
    return card;
  }

  function buildOverview(data, viewModel) {
    const tagsNode = buildTagsNode(viewModel.tags);
    const notes = asString(data.notes);
    const hasOverview =
      viewModel.acceptanceCriteria.length > 0 ||
      viewModel.risks.length > 0 ||
      viewModel.dependencies.length > 0 ||
      tagsNode ||
      notes;

    if (!hasOverview) return null;

    const section = el("section", "sb-epic-section sb-epic-overview");
    section.appendChild(el("h2", "", "Planning Overview"));

    const grid = el("div", "sb-epic-card-grid");

    const criteria = buildChecklistCard("Acceptance Criteria", viewModel.acceptanceCriteria);
    if (criteria) grid.appendChild(criteria);

    const risks = buildChecklistCard("Risks", viewModel.risks);
    if (risks) grid.appendChild(risks);

    const dependencies = buildChecklistCard("Dependencies", viewModel.dependencies);
    if (dependencies) grid.appendChild(dependencies);

    if (notes) {
      const card = el("div", "sb-epic-card");
      card.appendChild(el("h3", "", "Notes"));
      card.appendChild(el("p", "", notes));
      grid.appendChild(card);
    }

    if (tagsNode) {
      const card = el("div", "sb-epic-card");
      card.appendChild(el("h3", "", "Tags"));
      card.appendChild(tagsNode);
      grid.appendChild(card);
    }

    section.appendChild(grid);
    return section;
  }

  function appendTitleCell(cell, kind, id, title, keyClass, linkClass) {
    const normalizedId = asString(id);
    cell.appendChild(el("span", keyClass, normalizedId || "—"));

    const displayTitle = asString(title) || (normalizedId ? slugToLabel(normalizedId) : "Untitled");
    if (normalizedId) {
      const link = document.createElement("a");
      link.className = linkClass;
      link.href = inferArtifactHref(kind, normalizedId);
      link.textContent = displayTitle;
      cell.appendChild(link);
    } else {
      cell.appendChild(el("span", linkClass, displayTitle));
    }
  }

  function buildStoriesSection(viewModel) {
    const section = el("section", "sb-epic-section");
    const header = el("div", "sb-epic-section-header");
    const headerText = el("div", "");
    headerText.appendChild(el("h2", "", "User Stories"));
    headerText.appendChild(el("p", "sb-epic-section-intro", "Child user stories that implement this epic, with ownership, priority, and validation coverage where available."));
    header.appendChild(headerText);

    const summary = el("div", "sb-epic-table-summary");
    summary.appendChild(el("span", "sb-epic-table-summary-chip", viewModel.counts.stories + " stories"));
    section.appendChild(header);
    header.appendChild(summary);

    if (viewModel.stories.length === 0) {
      section.appendChild(el("div", "sb-empty-state", "No user stories are linked to this epic yet."));
      return section;
    }

    const wrapper = el("div", "sb-epic-table-wrap");
    const table = document.createElement("table");
    table.className = "sb-epic-table";
    table.setAttribute("aria-label", "Epic user stories");

    const thead = table.createTHead();
    const headRow = thead.insertRow();
    headRow.appendChild(el("th", "sb-epic-work-cell", "Story"));
    headRow.appendChild(el("th", "sb-epic-description-cell", "Description"));
    if (viewModel.optionalColumns.storyStatus) headRow.appendChild(el("th", "sb-epic-compact-cell", "Status"));
    if (viewModel.optionalColumns.storyPriority) headRow.appendChild(el("th", "sb-epic-compact-cell", "Priority"));
    if (viewModel.optionalColumns.storyCoverage) headRow.appendChild(el("th", "sb-epic-compact-cell", "Test coverage"));
    if (viewModel.optionalColumns.storyOwner) headRow.appendChild(el("th", "sb-epic-compact-cell", "Owner"));

    const tbody = table.createTBody();
    viewModel.stories.forEach(function (story) {
      const row = tbody.insertRow();
      row.className = "sb-epic-story-row";

      const storyCell = row.insertCell();
      storyCell.className = "sb-epic-work-cell";
      storyCell.appendChild(el("span", "sb-epic-level-label sb-epic-level-label-story", "Story"));
      appendTitleCell(
        storyCell,
        "user_stories",
        story.id || story.story_id || story.user_story_id,
        story.title || story.name,
        "sb-issue-key sb-issue-key-story",
        "sb-issue-link sb-issue-link-story"
      );

      const descriptionCell = row.insertCell();
      descriptionCell.className = "sb-epic-description-cell";
      descriptionCell.textContent = asString(story.description || story.summary || story.value) || "—";

      if (viewModel.optionalColumns.storyStatus) {
        const statusCell = row.insertCell();
        statusCell.className = "sb-epic-compact-cell";
        appendBadgeOrMuted(statusCell, story.status || story.state, "sb-status-badge", "Not set");
      }

      if (viewModel.optionalColumns.storyPriority) {
        const priorityCell = row.insertCell();
        priorityCell.className = "sb-epic-compact-cell";
        appendBadgeOrMuted(priorityCell, story.priority, "sb-priority-indicator", "Not set");
      }

      if (viewModel.optionalColumns.storyCoverage) {
        const coverageCell = row.insertCell();
        coverageCell.className = "sb-epic-compact-cell";
        const count = Array.isArray(story.test_case_ids)
          ? story.test_case_ids.length
          : (Array.isArray(story.test_cases) ? story.test_cases.length : 0);
        if (count > 0) {
          coverageCell.appendChild(el("span", "sb-coverage-pill", count + " linked"));
        } else {
          coverageCell.appendChild(el("span", "sb-muted", asString(story.coverage) || "Not linked"));
        }
      }

      if (viewModel.optionalColumns.storyOwner) {
        const ownerCell = row.insertCell();
        ownerCell.className = "sb-epic-compact-cell";
        ownerCell.textContent = asString(story.owner || story.assignee) || "—";
      }
    });

    wrapper.appendChild(table);
    section.appendChild(wrapper);
    return section;
  }

  function buildTestCasesSection(viewModel) {
    const section = el("section", "sb-epic-section");
    section.appendChild(el("h2", "", "Test Cases"));

    if (viewModel.testCases.length === 0) {
      section.appendChild(el("div", "sb-empty-state", "No linked test cases yet. Add test_case_ids to make validation coverage visible for this epic."));
      return section;
    }

    const wrapper = el("div", "sb-epic-table-wrap");
    const table = document.createElement("table");
    table.className = "sb-epic-table";
    table.setAttribute("aria-label", "Epic test cases");

    const thead = table.createTHead();
    const headRow = thead.insertRow();
    headRow.appendChild(el("th", "sb-epic-work-cell", "Test case"));
    if (viewModel.optionalColumns.testType) headRow.appendChild(el("th", "sb-epic-compact-cell", "Type"));
    if (viewModel.optionalColumns.testStatus) headRow.appendChild(el("th", "sb-epic-compact-cell", "Status"));
    if (viewModel.optionalColumns.testCoverage) headRow.appendChild(el("th", "", "Coverage target"));

    const tbody = table.createTBody();
    viewModel.testCases.forEach(function (testCase) {
      const row = tbody.insertRow();
      const id = asString(testCase.id || testCase.test_case_id || testCase.slug);

      const testCell = row.insertCell();
      testCell.className = "sb-epic-work-cell";
      appendTitleCell(testCell, "test_cases", id, testCase.title || testCase.name, "sb-issue-key", "sb-issue-link");

      const description = asString(testCase.description || testCase.summary);
      if (description) {
        testCell.appendChild(el("div", "sb-epic-inline-description", description));
      }

      if (viewModel.optionalColumns.testType) {
        const typeCell = row.insertCell();
        typeCell.className = "sb-epic-compact-cell";
        typeCell.textContent = asString(testCase.type || testCase.test_type || testCase.category) || "—";
      }

      if (viewModel.optionalColumns.testStatus) {
        const statusCell = row.insertCell();
        statusCell.className = "sb-epic-compact-cell";
        appendBadgeOrMuted(statusCell, testCase.status || testCase.state, "sb-status-badge", "Not set");
      }

      if (viewModel.optionalColumns.testCoverage) {
        row.insertCell().textContent = asString(testCase.coverage_target || testCase.target || testCase.story_id || testCase.acceptance_criterion) || "—";
      }
    });

    wrapper.appendChild(table);
    section.appendChild(wrapper);
    return section;
  }

  function buildSupportingDocsSection(viewModel) {
    if (viewModel.linkGroups.length === 0) return null;

    const section = el("section", "sb-epic-section");
    section.appendChild(el("h2", "", "Supporting Documents"));
    section.appendChild(el("p", "sb-epic-section-intro", "Linked specifications, designs, decisions, and references that support this epic."));

    const grid = el("div", "sb-epic-link-grid");
    viewModel.linkGroups.forEach(function (group) {
      const card = el("div", "sb-epic-card sb-epic-link-card");
      card.appendChild(el("h3", "", group.label));

      const list = el("ul", "sb-epic-link-list");
      group.items.forEach(function (item) {
        const li = el("li", "");
        if (item.href && item.href !== "#") {
          const link = document.createElement("a");
          link.href = item.href;
          link.textContent = item.label;
          li.appendChild(link);
        } else {
          li.appendChild(el("span", "", item.label));
        }

        if (item.description) {
          li.appendChild(el("div", "sb-epic-link-description", item.description));
        }
        list.appendChild(li);
      });

      card.appendChild(list);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  function buildSummaryTable(data) {
    const rows = [
      ["ID", data.id || data.epic_id],
      ["Type", data.type],
      ["Status", data.status || data.state],
      ["Priority", data.priority],
      ["Owner", data.owner || data.assignee],
      ["Roadmap Item", data.roadmap_item_id || data.parent_roadmap_item_id],
      ["Target", data.target_date || data.due_date],
      ["Created", data.created_at],
      ["Updated", data.updated_at || data.modified_at],
      ["Source", data.source_json_path]
    ].filter(function (row) {
      return asString(row[1]);
    });

    const table = document.createElement("table");
    table.className = "sb-summary-table";
    table.setAttribute("aria-label", "Epic metadata");

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
    const details = el("details", "sb-epic-metadata-details");
    details.appendChild(el("summary", "", "Metadata and provenance"));

    const body = el("div", "sb-epic-metadata-body");
    body.appendChild(buildSummaryTable(data));

    if (isObject(data.provenance)) {
      body.appendChild(el("h3", "", "Provenance"));
      const table = document.createElement("table");
      table.className = "sb-summary-table";
      table.setAttribute("aria-label", "Epic provenance");
      const tbody = table.createTBody();

      Object.keys(data.provenance).forEach(function (key) {
        const value = data.provenance[key];
        if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return;

        const row = tbody.insertRow();
        const keyCell = row.insertCell();
        keyCell.className = "sb-summary-key";
        keyCell.textContent = titleCase(key);
        row.insertCell().textContent = Array.isArray(value) ? value.join(", ") : String(value);
      });

      if (tbody.childNodes.length > 0) body.appendChild(table);
    }

    details.appendChild(body);
    return details;
  }

  // PUBLIC_INTERFACE
  function renderEpicPage(root, data) {
    /**
     * Render an epic artifact as a styled planning hub.
     *
     * Parameters:
     *   root: The target DOM element receiving generated epic sections.
     *   data: The embedded epic JSON payload.
     *
     * Returns:
     *   Nothing. The function mutates the supplied root element.
     */
    if (!data || typeof data !== "object") {
      root.innerHTML = "<div class=\"sb-empty-state\">No epic data available.</div>";
      return;
    }

    const viewModel = buildViewModel(data);

    root.appendChild(buildHero(data));
    root.appendChild(buildMetricGrid(viewModel));

    const overview = buildOverview(data, viewModel);
    if (overview) root.appendChild(overview);

    root.appendChild(buildStoriesSection(viewModel));
    root.appendChild(buildTestCasesSection(viewModel));

    const docs = buildSupportingDocsSection(viewModel);
    if (docs) root.appendChild(docs);

    root.appendChild(buildMetadataDetails(data));
  }

  registry.register("epic", renderEpicPage);
})();
