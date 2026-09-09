/**
 * Spec Builder user-story renderer for MkDocs Material.
 *
 * Renders a user story JSON artifact as a professional hub page aligned with
 * roadmap and roadmap item pages: hero summary, story statement, KPI cards,
 * acceptance criteria, validation coverage, relationship links, supporting
 * references, and metadata/provenance details.
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

    const pill = el("span", className || "sb-user-story-meta-pill");
    pill.appendChild(el("span", "sb-user-story-meta-label", label + ":"));
    pill.appendChild(el("span", "sb-user-story-meta-value", text));
    container.appendChild(pill);
  }

  function appendBadgePill(container, label, value, className) {
    const text = asString(value);
    if (!text) return;

    const pill = el("span", "sb-user-story-meta-pill sb-user-story-meta-pill-badge");
    pill.appendChild(el("span", "sb-user-story-meta-label", label + ":"));
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

  function storyStatement(data) {
    const explicit = asString(data.story || data.user_story || data.statement);
    if (explicit) return explicit;

    const persona = asString(data.persona || data.role || data.as_a);
    const goal = asString(data.goal || data.want || data.i_want);
    const benefit = asString(data.benefit || data.so_that || data.value);

    if (persona || goal || benefit) {
      return "As a " + (persona || "user") + ", I want " + (goal || "this capability") + (benefit ? ", so that " + benefit : ".");
    }

    return "";
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
    const acceptanceCriteria = normalizeList(data.acceptance_criteria || data.acceptanceCriteria || data.criteria);
    const testCases = normalizeTestCases(data);
    const relationships = normalizeRelationshipItems(data);
    const linkGroups = normalizeLinks(data.links || data.supporting_documents || data.references);
    const notes = normalizeList(data.notes || data.assumptions || data.constraints);
    const tags = normalizeList(data.tags || data.labels);

    return {
      storyStatement: storyStatement(data),
      acceptanceCriteria: acceptanceCriteria,
      testCases: testCases,
      relationships: relationships,
      linkGroups: linkGroups,
      notes: notes,
      tags: tags,
      counts: {
        acceptanceCriteria: acceptanceCriteria.length,
        testCases: testCases.length,
        relationships: relationships.length,
        supportingDocs: linkGroups.reduce(function (total, group) {
          return total + group.items.length;
        }, 0),
        notes: notes.length
      },
      optionalColumns: {
        testType: hasAnyValue(testCases, ["type", "test_type", "category"]),
        testStatus: hasAnyValue(testCases, ["status", "state"]),
        testCoverage: hasAnyValue(testCases, ["coverage_target", "target", "acceptance_criterion"]),
        relationshipStatus: hasAnyValue(relationships, ["status", "state"]),
        relationshipType: hasAnyValue(relationships, ["type", "kind"])
      }
    };
  }

  function normalizeRelationshipItems(data) {
    const items = [];

    function addRelationship(kind, idOrObject) {
      if (isObject(idOrObject)) {
        items.push(Object.assign({ kind: kind }, idOrObject));
        return;
      }

      const id = asString(idOrObject);
      if (!id) return;
      const resolved = isObject(data._resolved) && isObject(data._resolved[id]) ? data._resolved[id] : {};
      items.push(Object.assign({ kind: kind, id: id, title: slugToLabel(id) }, resolved));
    }

    normalizeList(data.epic_ids || data.parent_epic_ids || data.epics).forEach(function (item) {
      addRelationship("epics", item);
    });

    normalizeList(data.roadmap_item_ids || data.parent_roadmap_item_ids || data.roadmap_items).forEach(function (item) {
      addRelationship("roadmap_items", item);
    });

    normalizeList(data.related_story_ids || data.related_stories).forEach(function (item) {
      addRelationship("user_stories", item);
    });

    const seen = {};
    return items.filter(function (item) {
      const id = asString(item.id || item.story_id || item.epic_id || item.roadmap_item_id || item.title);
      const key = asString(item.kind) + ":" + id;
      if (!id || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function buildHero(data, viewModel) {
    const hero = el("section", "sb-user-story-hero");
    hero.setAttribute("aria-label", "User story summary");

    hero.appendChild(el("div", "sb-user-story-eyebrow", "User Story"));

    const title = asString(data.title || data.name) || slugToLabel(data.id || data.story_id) || "Untitled user story";
    hero.appendChild(el("h1", "sb-user-story-title", title));

    const description = asString(data.description || data.summary || data.value);
    if (description) {
      hero.appendChild(el("p", "sb-user-story-hero-summary", description));
    }

    if (viewModel.storyStatement) {
      const statement = el("blockquote", "sb-user-story-statement");
      statement.appendChild(el("p", "", viewModel.storyStatement));
      hero.appendChild(statement);
    }

    const meta = el("div", "sb-user-story-meta");
    appendBadgePill(meta, "Status", data.status || data.state, "sb-status-badge");
    appendBadgePill(meta, "Priority", data.priority, "sb-priority-indicator");
    appendMetaPill(meta, "Persona", data.persona || data.role || data.as_a);
    appendMetaPill(meta, "Epic", data.epic_id || data.parent_epic_id);
    appendMetaPill(meta, "Owner", data.owner || data.assignee);
    appendMetaPill(meta, "Updated", data.updated_at || data.modified_at);

    if (meta.childNodes.length > 0) {
      hero.appendChild(meta);
    }

    return hero;
  }

  function buildMetricGrid(viewModel) {
    const grid = el("section", "sb-user-story-kpi-grid");
    grid.setAttribute("aria-label", "User story relationship metrics");

    [
      ["Acceptance Criteria", viewModel.counts.acceptanceCriteria],
      ["Test Cases", viewModel.counts.testCases],
      ["Relationships", viewModel.counts.relationships],
      ["Supporting Docs", viewModel.counts.supportingDocs],
      ["Notes", viewModel.counts.notes]
    ].forEach(function (metric) {
      const card = el("div", "sb-user-story-kpi-card");
      card.appendChild(el("div", "sb-user-story-kpi-value", String(metric[1] || 0)));
      card.appendChild(el("div", "sb-user-story-kpi-label", metric[0]));
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

  function buildOverview(viewModel) {
    const tagsNode = buildTagsNode(viewModel.tags);
    if (viewModel.acceptanceCriteria.length === 0 && viewModel.notes.length === 0 && !tagsNode) return null;

    const section = el("section", "sb-user-story-section sb-user-story-overview");
    section.appendChild(el("h2", "", "Story Overview"));

    const grid = el("div", "sb-user-story-card-grid");

    if (viewModel.acceptanceCriteria.length > 0) {
      const card = el("div", "sb-user-story-card");
      card.appendChild(el("h3", "", "Acceptance Criteria"));
      const list = el("ul", "sb-user-story-checklist");

      viewModel.acceptanceCriteria.forEach(function (criterion) {
        const text = isObject(criterion)
          ? asString(criterion.title || criterion.description || criterion.summary || criterion.id)
          : asString(criterion);
        if (!text) return;

        const item = el("li", "");
        item.appendChild(el("span", "sb-user-story-check", "✓"));
        item.appendChild(el("span", "", text));
        list.appendChild(item);
      });

      card.appendChild(list);
      grid.appendChild(card);
    }

    if (viewModel.notes.length > 0) {
      const card = el("div", "sb-user-story-card");
      card.appendChild(el("h3", "", "Notes and Constraints"));
      const list = el("ul", "sb-user-story-list");
      viewModel.notes.forEach(function (note) {
        const text = isObject(note)
          ? asString(note.title || note.description || note.summary || note.id)
          : asString(note);
        if (text) list.appendChild(el("li", "", text));
      });
      card.appendChild(list);
      grid.appendChild(card);
    }

    if (tagsNode) {
      const card = el("div", "sb-user-story-card");
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

  function buildTestCasesSection(viewModel) {
    const section = el("section", "sb-user-story-section");
    section.appendChild(el("h2", "", "Test Cases"));

    if (viewModel.testCases.length === 0) {
      section.appendChild(el("div", "sb-empty-state", "No linked test cases yet. Add test_case_ids to make validation coverage visible for this user story."));
      return section;
    }

    const wrapper = el("div", "sb-user-story-table-wrap");
    const table = document.createElement("table");
    table.className = "sb-user-story-table";
    table.setAttribute("aria-label", "User story test cases");

    const thead = table.createTHead();
    const headRow = thead.insertRow();
    headRow.appendChild(el("th", "sb-user-story-work-cell", "Test case"));
    if (viewModel.optionalColumns.testType) headRow.appendChild(el("th", "sb-user-story-compact-cell", "Type"));
    if (viewModel.optionalColumns.testStatus) headRow.appendChild(el("th", "sb-user-story-compact-cell", "Status"));
    if (viewModel.optionalColumns.testCoverage) headRow.appendChild(el("th", "", "Coverage target"));

    const tbody = table.createTBody();
    viewModel.testCases.forEach(function (testCase) {
      const row = tbody.insertRow();
      const id = asString(testCase.id || testCase.test_case_id || testCase.slug);

      const testCell = row.insertCell();
      testCell.className = "sb-user-story-work-cell";
      appendTitleCell(testCell, "test_cases", id, testCase.title || testCase.name, "sb-issue-key", "sb-issue-link");

      const description = asString(testCase.description || testCase.summary);
      if (description) {
        testCell.appendChild(el("div", "sb-user-story-inline-description", description));
      }

      if (viewModel.optionalColumns.testType) {
        const typeCell = row.insertCell();
        typeCell.className = "sb-user-story-compact-cell";
        typeCell.textContent = asString(testCase.type || testCase.test_type || testCase.category) || "—";
      }

      if (viewModel.optionalColumns.testStatus) {
        const statusCell = row.insertCell();
        statusCell.className = "sb-user-story-compact-cell";
        appendBadgeOrMuted(statusCell, testCase.status || testCase.state, "sb-status-badge", "Not set");
      }

      if (viewModel.optionalColumns.testCoverage) {
        row.insertCell().textContent = asString(testCase.coverage_target || testCase.target || testCase.acceptance_criterion) || "—";
      }
    });

    wrapper.appendChild(table);
    section.appendChild(wrapper);
    return section;
  }

  function buildRelationshipsSection(viewModel) {
    if (viewModel.relationships.length === 0) return null;

    const section = el("section", "sb-user-story-section");
    section.appendChild(el("h2", "", "Planning Relationships"));
    section.appendChild(el("p", "sb-user-story-section-intro", "Parent epics, roadmap items, and related stories connected to this user story."));

    const wrapper = el("div", "sb-user-story-table-wrap");
    const table = document.createElement("table");
    table.className = "sb-user-story-table";
    table.setAttribute("aria-label", "User story planning relationships");

    const thead = table.createTHead();
    const headRow = thead.insertRow();
    headRow.appendChild(el("th", "sb-user-story-work-cell", "Artifact"));
    if (viewModel.optionalColumns.relationshipType) headRow.appendChild(el("th", "sb-user-story-compact-cell", "Type"));
    if (viewModel.optionalColumns.relationshipStatus) headRow.appendChild(el("th", "sb-user-story-compact-cell", "Status"));
    headRow.appendChild(el("th", "", "Description"));

    const tbody = table.createTBody();
    viewModel.relationships.forEach(function (item) {
      const row = tbody.insertRow();
      row.className = "sb-user-story-relationship-row";
      const kind = asString(item.kind || item.type || "artifacts");
      const id = asString(item.id || item.story_id || item.epic_id || item.roadmap_item_id);

      const artifactCell = row.insertCell();
      artifactCell.className = "sb-user-story-work-cell";
      artifactCell.appendChild(el("span", "sb-user-story-level-label", titleCase(kind.replace(/s$/, ""))));
      appendTitleCell(
        artifactCell,
        kind,
        id,
        item.title || item.name,
        "sb-issue-key",
        "sb-issue-link"
      );

      if (viewModel.optionalColumns.relationshipType) {
        const typeCell = row.insertCell();
        typeCell.className = "sb-user-story-compact-cell";
        typeCell.textContent = titleCase(item.type || item.kind || kind);
      }

      if (viewModel.optionalColumns.relationshipStatus) {
        const statusCell = row.insertCell();
        statusCell.className = "sb-user-story-compact-cell";
        appendBadgeOrMuted(statusCell, item.status || item.state, "sb-status-badge", "Not set");
      }

      row.insertCell().textContent = asString(item.description || item.summary) || "—";
    });

    wrapper.appendChild(table);
    section.appendChild(wrapper);
    return section;
  }

  function buildSupportingDocsSection(viewModel) {
    if (viewModel.linkGroups.length === 0) return null;

    const section = el("section", "sb-user-story-section");
    section.appendChild(el("h2", "", "Supporting Documents"));
    section.appendChild(el("p", "sb-user-story-section-intro", "Linked specifications, references, designs, or implementation notes that support this story."));

    const grid = el("div", "sb-user-story-link-grid");
    viewModel.linkGroups.forEach(function (group) {
      const card = el("div", "sb-user-story-card sb-user-story-link-card");
      card.appendChild(el("h3", "", group.label));

      const list = el("ul", "sb-user-story-link-list");
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
          li.appendChild(el("div", "sb-user-story-link-description", item.description));
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
      ["ID", data.id || data.story_id || data.user_story_id],
      ["Type", data.type],
      ["Status", data.status || data.state],
      ["Priority", data.priority],
      ["Persona", data.persona || data.role || data.as_a],
      ["Epic", data.epic_id || data.parent_epic_id],
      ["Owner", data.owner || data.assignee],
      ["Created", data.created_at],
      ["Updated", data.updated_at || data.modified_at],
      ["Source", data.source_json_path]
    ].filter(function (row) {
      return asString(row[1]);
    });

    const table = document.createElement("table");
    table.className = "sb-summary-table";
    table.setAttribute("aria-label", "User story metadata");

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
    const details = el("details", "sb-user-story-metadata-details");
    details.appendChild(el("summary", "", "Metadata and provenance"));

    const body = el("div", "sb-user-story-metadata-body");
    body.appendChild(buildSummaryTable(data));

    if (isObject(data.provenance)) {
      body.appendChild(el("h3", "", "Provenance"));
      const table = document.createElement("table");
      table.className = "sb-summary-table";
      table.setAttribute("aria-label", "User story provenance");
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
  function renderUserStoryPage(root, data) {
    /**
     * Render a user story artifact as a styled planning hub.
     *
     * Parameters:
     *   root: The target DOM element receiving generated user-story sections.
     *   data: The embedded user story JSON payload.
     *
     * Returns:
     *   Nothing. The function mutates the supplied root element.
     */
    if (!data || typeof data !== "object") {
      root.innerHTML = "<div class=\"sb-empty-state\">No user story data available.</div>";
      return;
    }

    const viewModel = buildViewModel(data);

    root.appendChild(buildHero(data, viewModel));
    root.appendChild(buildMetricGrid(viewModel));

    const overview = buildOverview(viewModel);
    if (overview) root.appendChild(overview);

    root.appendChild(buildTestCasesSection(viewModel));

    const relationships = buildRelationshipsSection(viewModel);
    if (relationships) root.appendChild(relationships);

    const docs = buildSupportingDocsSection(viewModel);
    if (docs) root.appendChild(docs);

    root.appendChild(buildMetadataDetails(data));
  }

  registry.register("user_story", renderUserStoryPage);
})();
