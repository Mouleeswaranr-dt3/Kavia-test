/**
 * Spec Builder roadmap-item renderer for MkDocs Material.
 *
 * Renders a roadmap item page from its embedded JSON payload as a professional
 * planning hub with a hero summary, relationship metrics, acceptance criteria,
 * nested epics/stories, test coverage, supporting documents, and metadata.
 *
 * The renderer is intentionally tolerant of partial JSON. When embedded objects
 * are unavailable it falls back to ids, generated labels, and Spec Builder
 * artifact links so existing roadmap item artifacts continue to render.
 */

/* global SpecBuilderRendererRegistry */

(function () {
  "use strict";

  var u = SpecBuilderRendererRegistry.utils;

  var SUMMARY_KEYS = [
    "status",
    "priority",
    "owner",
    "estimated_effort",
    "target_date",
    "created_at",
    "updated_at"
  ];

  var METADATA_KEYS = [
    "id",
    "type",
    "status",
    "priority",
    "owner",
    "estimated_effort",
    "target_date",
    "created_at",
    "updated_at",
    "jira_link",
    "source_json_path",
    "generated_page_path"
  ];

  var LINK_GROUP_LABELS = {
    feature_specs: "Feature Specifications",
    architecture_specs: "Architecture Specifications",
    detailed_designs: "Detailed Designs",
    decisions: "Decisions",
    research: "Research and Discovery",
    execution_blueprints: "Execution Blueprints",
    external: "External References"
  };

  var LINK_GROUP_ORDER = [
    "feature_specs",
    "architecture_specs",
    "detailed_designs",
    "decisions",
    "research",
    "execution_blueprints",
    "external"
  ];

  function _asNonEmptyString(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  function _slugToLabel(id) {
    return u.slugToLabel(id);
  }

  function _titleCase(value) {
    return u.titleCase(value);
  }

  function _isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function _isExternalHref(href) {
    var value = _asNonEmptyString(href).toLowerCase();
    return value.indexOf("http://") === 0 || value.indexOf("https://") === 0 || value.indexOf("mailto:") === 0;
  }

  function _inferArtifactHref(kind, id) {
    var slug = _asNonEmptyString(id);
    if (!slug) return "#";
    return u.relativeSpecBuilderHref(kind + "/" + slug + ".html");
  }

  function _inferCodeWikiHref(pathOrUrl) {
    var value = _asNonEmptyString(pathOrUrl);
    if (!value) return "#";
    if (_isExternalHref(value) || value.charAt(0) === "#") return value;

    var codeWikiPrefix = "kavia-docs/CodeWiki/";
    if (value.indexOf(codeWikiPrefix) === 0) {
      return u.normalizeLink(value);
    }

    if (/\.md$/i.test(value)) {
      return value.replace(/\.md$/i, ".html");
    }

    return value;
  }

  function _documentTitleFromPath(pathOrUrl) {
    var value = _asNonEmptyString(pathOrUrl);
    if (!value) return "Untitled document";

    var cleaned = value.split("#")[0].split("?")[0];
    var parts = cleaned.split("/");
    var fileName = parts[parts.length - 1] || cleaned;
    fileName = fileName.replace(/\.(md|html|json)$/i, "");
    return _slugToLabel(fileName);
  }

  function _buildSectionHeading(title) {
    return u.el("h2", "", title);
  }

  function _appendMuted(cell, text) {
    cell.appendChild(u.el("span", "sb-muted", text || "Not set"));
  }

  function _appendBadgeOrMuted(cell, value, className, emptyText) {
    var text = _asNonEmptyString(value);
    if (text) {
      cell.appendChild(u.badge(text, className));
    } else {
      _appendMuted(cell, emptyText || "Not set");
    }
  }

  function _buildMetaPill(label, value, className) {
    var text = _asNonEmptyString(value);
    if (!text) return null;

    var pill = u.el("span", className || "sb-roadmap-item-meta-pill");
    pill.appendChild(u.el("span", "sb-roadmap-item-meta-label", label + ":"));
    pill.appendChild(u.el("span", "sb-roadmap-item-meta-value", text));
    return pill;
  }

  function _appendTitleCellContent(cell, kind, id, title, keyClass, linkClass, prefixNode) {
    if (prefixNode) {
      cell.appendChild(prefixNode);
    }

    var normalizedId = _asNonEmptyString(id);
    var issueKey = u.el("span", keyClass, normalizedId || "—");
    cell.appendChild(issueKey);

    var displayTitle = _asNonEmptyString(title) || (normalizedId ? _slugToLabel(normalizedId) : "Untitled");
    if (normalizedId) {
      var link = document.createElement("a");
      link.className = linkClass;
      link.href = _inferArtifactHref(kind, normalizedId);
      link.textContent = displayTitle;
      cell.appendChild(link);
    } else {
      cell.appendChild(u.el("span", linkClass, displayTitle));
    }
  }

  function _normalizeStory(storyLike) {
    if (_isObject(storyLike)) {
      return storyLike;
    }

    var storyId = _asNonEmptyString(storyLike);
    return {
      id: storyId,
      title: storyId ? _slugToLabel(storyId) : "Untitled story"
    };
  }

  function _resolveStoriesFromMap(storyIds, resolvedMap) {
    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      return [];
    }

    var map = _isObject(resolvedMap) ? resolvedMap : {};
    return storyIds.map(function (storyId) {
      var normalizedId = _asNonEmptyString(storyId);
      if (!normalizedId) {
        return _normalizeStory(storyId);
      }
      return _normalizeStory(map[normalizedId] || storyId);
    });
  }

  function _extractEpicStories(epicLike, pageResolvedMap) {
    if (!_isObject(epicLike)) {
      return [];
    }

    if (Array.isArray(epicLike.stories) && epicLike.stories.length > 0) {
      return epicLike.stories.map(_normalizeStory);
    }

    if (Array.isArray(epicLike.linked_stories) && epicLike.linked_stories.length > 0) {
      return epicLike.linked_stories.map(_normalizeStory);
    }

    var localResolved = _isObject(epicLike._resolved) ? epicLike._resolved : null;

    if (Array.isArray(epicLike.story_ids) && epicLike.story_ids.length > 0) {
      return _resolveStoriesFromMap(epicLike.story_ids, localResolved || pageResolvedMap);
    }

    if (localResolved) {
      var localStories = Object.keys(localResolved).map(function (key) {
        return localResolved[key];
      }).filter(function (item) {
        if (!_isObject(item)) return false;
        var itemType = _asNonEmptyString(item.type).toLowerCase();
        return itemType.indexOf("story") !== -1;
      });

      if (localStories.length > 0) {
        return localStories.map(_normalizeStory);
      }
    }

    return [];
  }

  function _normalizeEpic(epicLike, pageResolvedMap) {
    if (_isObject(epicLike)) {
      var clone = Object.assign({}, epicLike);
      clone.stories = _extractEpicStories(clone, pageResolvedMap);
      return clone;
    }

    var epicId = _asNonEmptyString(epicLike);
    return {
      id: epicId,
      title: epicId ? _slugToLabel(epicId) : "Untitled epic",
      stories: []
    };
  }

  function _normalizeEpics(data) {
    var pageResolvedMap = data && _isObject(data._resolved) ? data._resolved : null;

    if (Array.isArray(data.epics) && data.epics.length > 0) {
      return data.epics.map(function (epicLike) {
        return _normalizeEpic(epicLike, pageResolvedMap);
      });
    }

    var epicIds = Array.isArray(data.epic_ids) ? data.epic_ids : [];
    var storyIds = Array.isArray(data.story_ids) ? data.story_ids : [];
    if (epicIds.length === 0) return [];

    return epicIds.map(function (epicId, index) {
      var resolvedEpic = pageResolvedMap && pageResolvedMap[epicId] ? pageResolvedMap[epicId] : epicId;
      var epic = _normalizeEpic(resolvedEpic, pageResolvedMap);
      if (epic.stories.length === 0 && index === 0 && storyIds.length > 0) {
        epic.stories = _resolveStoriesFromMap(storyIds, pageResolvedMap);
      }
      return epic;
    });
  }

  function _normalizeTestCase(testCaseLike, resolvedMap) {
    if (_isObject(testCaseLike)) {
      return testCaseLike;
    }

    var id = _asNonEmptyString(testCaseLike);
    var resolved = resolvedMap && resolvedMap[id] ? resolvedMap[id] : null;
    if (_isObject(resolved)) {
      return resolved;
    }

    return {
      id: id,
      title: id ? _slugToLabel(id) : "Untitled test case"
    };
  }

  function _normalizeTestCases(data) {
    var resolvedMap = data && _isObject(data._resolved) ? data._resolved : {};
    var explicit = Array.isArray(data.test_cases) ? data.test_cases : [];
    var ids = Array.isArray(data.test_case_ids) ? data.test_case_ids : [];
    var seen = {};

    return explicit.concat(ids).map(function (item) {
      return _normalizeTestCase(item, resolvedMap);
    }).filter(function (item) {
      var id = _asNonEmptyString(item.id || item.test_case_id || item.slug || item.title);
      if (!id) return false;
      if (seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function _normalizeLinks(links) {
    if (!_isObject(links)) {
      return [];
    }

    var orderedKeys = LINK_GROUP_ORDER.slice();
    Object.keys(links).forEach(function (key) {
      if (orderedKeys.indexOf(key) === -1) {
        orderedKeys.push(key);
      }
    });

    return orderedKeys.map(function (key) {
      var rawItems = links[key];
      if (!Array.isArray(rawItems) || rawItems.length === 0) return null;

      var items = rawItems.map(function (item) {
        if (_isObject(item)) {
          var href = _asNonEmptyString(item.href || item.url || item.path || item.file || item.link);
          return {
            title: _asNonEmptyString(item.title || item.label || item.name) || _documentTitleFromPath(href),
            href: _inferCodeWikiHref(href),
            description: _asNonEmptyString(item.description || item.summary || item.notes),
            raw: item
          };
        }

        var rawHref = _asNonEmptyString(item);
        return {
          title: _documentTitleFromPath(rawHref),
          href: _inferCodeWikiHref(rawHref),
          description: "",
          raw: item
        };
      }).filter(function (item) {
        return _asNonEmptyString(item.href) && item.href !== "#";
      });

      if (items.length === 0) return null;

      return {
        key: key,
        label: LINK_GROUP_LABELS[key] || "Other Supporting Documents",
        items: items
      };
    }).filter(Boolean);
  }

  function _buildViewModel(data) {
    var epics = _normalizeEpics(data);
    var nestedStoryIds = {};
    var storyById = {};

    epics.forEach(function (epic) {
      var stories = Array.isArray(epic.stories) ? epic.stories : [];
      stories.forEach(function (story) {
        var id = _asNonEmptyString(story.id || story.story_id || story.title);
        if (!id) return;
        nestedStoryIds[id] = true;
        storyById[id] = story;
      });
    });

    var pageResolvedMap = data && _isObject(data._resolved) ? data._resolved : null;
    var standaloneStories = _resolveStoriesFromMap(Array.isArray(data.story_ids) ? data.story_ids : [], pageResolvedMap).filter(function (story) {
      var id = _asNonEmptyString(story.id || story.story_id || story.title);
      if (!id || nestedStoryIds[id]) return false;
      storyById[id] = story;
      return true;
    });

    var testCases = _normalizeTestCases(data);
    var linkGroups = _normalizeLinks(data.links);
    var linkCount = linkGroups.reduce(function (sum, group) {
      return sum + group.items.length;
    }, 0);

    var childIds = Array.isArray(data.child_roadmap_item_ids) ? data.child_roadmap_item_ids : [];
    var allStories = Object.keys(storyById);

    return {
      epics: epics,
      standaloneStories: standaloneStories,
      testCases: testCases,
      linkGroups: linkGroups,
      counts: {
        epics: epics.length || (Array.isArray(data.epic_ids) ? data.epic_ids.length : 0),
        stories: allStories.length || (Array.isArray(data.story_ids) ? data.story_ids.length : 0),
        testCases: testCases.length || (Array.isArray(data.test_case_ids) ? data.test_case_ids.length : 0),
        childItems: childIds.length,
        supportingDocs: linkCount
      },
      optionalColumns: _detectOptionalColumns(epics, standaloneStories, testCases)
    };
  }

  function _hasAnyValue(items, keys) {
    return items.some(function (item) {
      return keys.some(function (key) {
        return !!_asNonEmptyString(item[key]);
      });
    });
  }

  function _detectOptionalColumns(epics, standaloneStories, testCases) {
    var epicAndStories = [];
    epics.forEach(function (epic) {
      epicAndStories.push(epic);
      (Array.isArray(epic.stories) ? epic.stories : []).forEach(function (story) {
        epicAndStories.push(story);
      });
    });
    standaloneStories.forEach(function (story) {
      epicAndStories.push(story);
    });

    return {
      workStatus: _hasAnyValue(epicAndStories, ["status", "state"]),
      workPriority: _hasAnyValue(epicAndStories, ["priority"]),
      workOwner: _hasAnyValue(epicAndStories, ["owner", "assignee"]),
      workCoverage: _hasAnyValue(epicAndStories, ["test_case_ids", "test_cases", "coverage"]),
      testType: _hasAnyValue(testCases, ["type", "test_type", "category"]),
      testStatus: _hasAnyValue(testCases, ["status", "state"]),
      testCoverage: _hasAnyValue(testCases, ["coverage_target", "target", "story_id", "epic_id", "acceptance_criterion"])
    };
  }

  function _buildHeroSection(data) {
    var hero = u.el("section", "sb-roadmap-item-hero");
    hero.setAttribute("aria-label", "Roadmap item summary");

    hero.appendChild(u.el("div", "sb-roadmap-item-eyebrow", "Roadmap Item"));

    var title = _asNonEmptyString(data.title) || _slugToLabel(data.id) || "Untitled roadmap item";
    hero.appendChild(u.el("h1", "sb-roadmap-item-title", title));

    var description = _asNonEmptyString(data.description || data.summary);
    if (description) {
      hero.appendChild(u.el("p", "sb-roadmap-item-hero-summary", description));
    }

    var meta = u.el("div", "sb-roadmap-item-meta");
    [
      ["Status", data.status],
      ["Priority", data.priority],
      ["Owner", data.owner],
      ["Effort", data.estimated_effort],
      ["Target", data.target_date],
      ["Updated", data.updated_at]
    ].forEach(function (pair) {
      var pill = _buildMetaPill(pair[0], pair[1]);
      if (pill) meta.appendChild(pill);
    });

    if (meta.childNodes.length > 0) {
      hero.appendChild(meta);
    }

    return hero;
  }

  function _buildMetricGrid(viewModel) {
    var grid = u.el("section", "sb-roadmap-item-kpi-grid");
    grid.setAttribute("aria-label", "Roadmap item relationship metrics");

    [
      ["Epics", viewModel.counts.epics],
      ["User Stories", viewModel.counts.stories],
      ["Test Cases", viewModel.counts.testCases],
      ["Child Items", viewModel.counts.childItems],
      ["Supporting Docs", viewModel.counts.supportingDocs]
    ].forEach(function (metric) {
      var card = u.el("div", "sb-roadmap-item-kpi-card");
      card.appendChild(u.el("div", "sb-roadmap-item-kpi-value", String(metric[1] || 0)));
      card.appendChild(u.el("div", "sb-roadmap-item-kpi-label", metric[0]));
      grid.appendChild(card);
    });

    return grid;
  }

  function _buildTagsNode(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return null;

    var container = u.el("div", "sb-tags-container");
    tags.forEach(function (tag) {
      var text = _asNonEmptyString(tag);
      if (text) {
        container.appendChild(u.el("span", "spec-builder-tag", text));
      }
    });

    return container.childNodes.length > 0 ? container : null;
  }

  function _buildAcceptanceCriteriaSection(criteria) {
    if (!Array.isArray(criteria) || criteria.length === 0) return null;

    var card = u.el("div", "sb-roadmap-item-card");
    card.appendChild(u.el("h3", "", "Acceptance Criteria"));

    var list = u.el("ul", "sb-roadmap-item-checklist");
    criteria.forEach(function (criterion) {
      var text = _asNonEmptyString(criterion);
      if (!text) return;
      var item = u.el("li", "");
      item.appendChild(u.el("span", "sb-roadmap-item-check", "✓"));
      item.appendChild(u.el("span", "", text));
      list.appendChild(item);
    });

    if (list.childNodes.length === 0) return null;
    card.appendChild(list);
    return card;
  }

  function _buildOverviewSection(data) {
    var hasCriteria = Array.isArray(data.acceptance_criteria) && data.acceptance_criteria.length > 0;
    var hasNotes = !!_asNonEmptyString(data.notes);
    var hasTags = Array.isArray(data.tags) && data.tags.length > 0;

    if (!hasCriteria && !hasNotes && !hasTags) return null;

    var section = u.el("section", "sb-roadmap-item-section sb-roadmap-item-overview");
    section.appendChild(_buildSectionHeading("Planning Overview"));

    var grid = u.el("div", "sb-roadmap-item-overview-grid");

    var criteriaCard = _buildAcceptanceCriteriaSection(data.acceptance_criteria);
    if (criteriaCard) grid.appendChild(criteriaCard);

    if (hasNotes) {
      var notesCard = u.el("div", "sb-roadmap-item-card");
      notesCard.appendChild(u.el("h3", "", "Notes"));
      notesCard.appendChild(u.el("p", "", _asNonEmptyString(data.notes)));
      grid.appendChild(notesCard);
    }

    var tagsNode = _buildTagsNode(data.tags);
    if (tagsNode) {
      var tagsCard = u.el("div", "sb-roadmap-item-card");
      tagsCard.appendChild(u.el("h3", "", "Tags"));
      tagsCard.appendChild(tagsNode);
      grid.appendChild(tagsCard);
    }

    if (grid.childNodes.length === 0) return null;
    section.appendChild(grid);
    return section;
  }

  function _appendWorkItemRow(tbody, item, options) {
    var row = tbody.insertRow();
    row.className = options.rowClass;

    var titleCell = row.insertCell();
    titleCell.className = "sb-rmi-work-cell";
    if (options.levelLabel) {
      titleCell.appendChild(u.el("span", options.levelClass || "sb-rmi-level-label", options.levelLabel));
    }
    _appendTitleCellContent(
      titleCell,
      options.kind,
      _asNonEmptyString(item.id || item.story_id || item.epic_id),
      item.title || item.name,
      options.keyClass,
      options.linkClass,
      options.prefixNode
    );

    if (options.count !== undefined) {
      titleCell.appendChild(u.el("span", "sb-count-pill", String(options.count)));
    }

    if (options.relationshipLabel) {
      titleCell.appendChild(u.el("span", "sb-rmi-relationship-label", options.relationshipLabel));
    }

    var descriptionCell = row.insertCell();
    descriptionCell.className = "sb-rmi-description-cell";
    descriptionCell.textContent = _asNonEmptyString(item.description || item.summary) || "—";

    if (options.columns.workStatus) {
      var statusCell = row.insertCell();
      statusCell.className = "sb-rmi-compact-cell";
      _appendBadgeOrMuted(statusCell, item.status || item.state, "sb-status-badge", "Not set");
    }

    if (options.columns.workPriority) {
      var priorityCell = row.insertCell();
      priorityCell.className = "sb-rmi-compact-cell";
      _appendBadgeOrMuted(priorityCell, item.priority, "sb-priority-indicator", "Not set");
    }

    if (options.columns.workCoverage) {
      var coverageCell = row.insertCell();
      coverageCell.className = "sb-rmi-compact-cell";
      var testCount = Array.isArray(item.test_case_ids)
        ? item.test_case_ids.length
        : (Array.isArray(item.test_cases) ? item.test_cases.length : 0);
      if (testCount > 0) {
        coverageCell.appendChild(u.el("span", "sb-coverage-pill", testCount + " linked"));
      } else {
        coverageCell.appendChild(u.el("span", "sb-muted", _asNonEmptyString(item.coverage) || "Not linked"));
      }
    }

    if (options.columns.workOwner) {
      var ownerCell = row.insertCell();
      ownerCell.className = "sb-rmi-compact-cell";
      ownerCell.textContent = _asNonEmptyString(item.owner || item.assignee) || "—";
    }
  }

  function _buildEnhancedEpicsSection(viewModel) {
    if (viewModel.epics.length === 0 && viewModel.standaloneStories.length === 0) {
      return null;
    }

    var section = u.el("section", "sb-roadmap-item-section");
    var header = u.el("div", "sb-roadmap-item-section-header");
    var headerText = u.el("div", "");
    headerText.appendChild(_buildSectionHeading("Epics and User Stories"));
    headerText.appendChild(u.el("p", "sb-roadmap-item-section-intro", "Implementation scope is grouped by epic, with child user stories shown directly underneath each parent item."));
    header.appendChild(headerText);

    var summary = u.el("div", "sb-rmi-table-summary");
    summary.appendChild(u.el("span", "sb-rmi-table-summary-chip", viewModel.counts.epics + " epics"));
    summary.appendChild(u.el("span", "sb-rmi-table-summary-chip", viewModel.counts.stories + " stories"));
    section.appendChild(header);
    header.appendChild(summary);

    var wrapper = u.el("div", "sb-epics-table");
    var table = document.createElement("table");
    table.setAttribute("aria-label", "Epics and user stories");

    var thead = table.createTHead();
    var headRow = thead.insertRow();
    headRow.appendChild(u.el("th", "sb-rmi-work-cell", "Work item"));
    headRow.appendChild(u.el("th", "sb-rmi-description-cell", "Description"));
    if (viewModel.optionalColumns.workStatus) headRow.appendChild(u.el("th", "sb-rmi-compact-cell", "Status"));
    if (viewModel.optionalColumns.workPriority) headRow.appendChild(u.el("th", "sb-rmi-compact-cell", "Priority"));
    if (viewModel.optionalColumns.workCoverage) headRow.appendChild(u.el("th", "sb-rmi-compact-cell", "Test coverage"));
    if (viewModel.optionalColumns.workOwner) headRow.appendChild(u.el("th", "sb-rmi-compact-cell", "Owner"));

    var tbody = table.createTBody();

    viewModel.epics.forEach(function (epic) {
      var stories = Array.isArray(epic.stories) ? epic.stories : [];
      _appendWorkItemRow(tbody, epic, {
        rowClass: "sb-epic-row",
        kind: "epics",
        keyClass: "sb-issue-key",
        linkClass: "sb-issue-link",
        levelLabel: "Epic",
        levelClass: "sb-rmi-level-label sb-rmi-level-label-epic",
        count: stories.length,
        columns: viewModel.optionalColumns
      });

      stories.forEach(function (story) {
        _appendWorkItemRow(tbody, story, {
          rowClass: "sb-story-row",
          kind: "user_stories",
          keyClass: "sb-issue-key sb-issue-key-story",
          linkClass: "sb-issue-link sb-issue-link-story",
          prefixNode: u.el("span", "sb-story-indent", ""),
          levelLabel: "Story",
          levelClass: "sb-rmi-level-label sb-rmi-level-label-story",
          relationshipLabel: "Story",
          columns: viewModel.optionalColumns
        });
      });
    });

    viewModel.standaloneStories.forEach(function (story) {
      _appendWorkItemRow(tbody, story, {
        rowClass: "sb-story-row sb-standalone-story-row",
        kind: "user_stories",
        keyClass: "sb-issue-key sb-issue-key-story",
        linkClass: "sb-issue-link sb-issue-link-story",
        prefixNode: u.el("span", "sb-story-indent", ""),
        levelLabel: "Story",
        levelClass: "sb-rmi-level-label sb-rmi-level-label-story",
        relationshipLabel: "Additional related story",
        columns: viewModel.optionalColumns
      });
    });

    wrapper.appendChild(table);
    section.appendChild(wrapper);
    return section;
  }

  function _buildTestCasesSection(viewModel) {
    var section = u.el("section", "sb-roadmap-item-section");
    section.appendChild(_buildSectionHeading("Test Cases"));

    if (viewModel.testCases.length === 0) {
      section.appendChild(u.el("div", "sb-empty-state", "No linked test cases yet. Add test case ids through test_case_ids to make validation coverage visible on this roadmap item."));
      return section;
    }

    var wrapper = u.el("div", "sb-roadmap-item-table-wrap");
    var table = document.createElement("table");
    table.className = "sb-roadmap-item-table";
    table.setAttribute("aria-label", "Linked test cases");

    var thead = table.createTHead();
    var headRow = thead.insertRow();
    headRow.appendChild(u.el("th", "", "Test case"));
    if (viewModel.optionalColumns.testType) headRow.appendChild(u.el("th", "sb-rmi-compact-cell", "Type"));
    if (viewModel.optionalColumns.testStatus) headRow.appendChild(u.el("th", "sb-rmi-compact-cell", "Status"));
    if (viewModel.optionalColumns.testCoverage) headRow.appendChild(u.el("th", "", "Coverage target"));

    var tbody = table.createTBody();

    viewModel.testCases.forEach(function (testCase) {
      var row = tbody.insertRow();
      var id = _asNonEmptyString(testCase.id || testCase.test_case_id || testCase.slug);

      var testCell = row.insertCell();
      testCell.className = "sb-rmi-work-cell";
      _appendTitleCellContent(
        testCell,
        "test_cases",
        id,
        testCase.title || testCase.name,
        "sb-issue-key",
        "sb-issue-link"
      );

      var description = _asNonEmptyString(testCase.description || testCase.summary);
      if (description) {
        testCell.appendChild(u.el("div", "sb-rmi-inline-description", description));
      }

      if (viewModel.optionalColumns.testType) {
        var typeCell = row.insertCell();
        typeCell.className = "sb-rmi-compact-cell";
        typeCell.textContent = _asNonEmptyString(testCase.type || testCase.test_type || testCase.category) || "—";
      }

      if (viewModel.optionalColumns.testStatus) {
        var statusCell = row.insertCell();
        statusCell.className = "sb-rmi-compact-cell";
        _appendBadgeOrMuted(statusCell, testCase.status || testCase.state, "sb-status-badge", "Not set");
      }

      if (viewModel.optionalColumns.testCoverage) {
        var coverageCell = row.insertCell();
        coverageCell.textContent = _asNonEmptyString(testCase.coverage_target || testCase.target || testCase.story_id || testCase.epic_id || testCase.acceptance_criterion) || "—";
      }
    });

    wrapper.appendChild(table);
    section.appendChild(wrapper);
    return section;
  }

  function _buildSupportingDocsSection(viewModel) {
    if (viewModel.linkGroups.length === 0) {
      return null;
    }

    var section = u.el("section", "sb-roadmap-item-section");
    section.appendChild(_buildSectionHeading("Supporting Documents"));
    section.appendChild(u.el("p", "sb-roadmap-item-section-intro", "Linked specifications, designs, decisions, and discovery notes that support this roadmap item."));

    var grid = u.el("div", "sb-doc-link-grid");

    viewModel.linkGroups.forEach(function (group) {
      var card = u.el("div", "sb-roadmap-item-card sb-doc-link-card");
      card.appendChild(u.el("h3", "", group.label));

      var list = u.el("ul", "sb-doc-link-list");
      group.items.forEach(function (item) {
        var li = u.el("li", "");
        var link = document.createElement("a");
        link.href = item.href;
        link.textContent = item.title;
        li.appendChild(link);

        if (item.description) {
          li.appendChild(u.el("div", "sb-doc-link-description", item.description));
        }

        list.appendChild(li);
      });

      card.appendChild(list);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  function _buildSummaryTable(data) {
    var table = u.el("table", "sb-summary-table");
    table.setAttribute("aria-label", "Roadmap item metadata summary");

    var thead = table.createTHead();
    var headRow = thead.insertRow();
    headRow.appendChild(u.el("th", "", "Field"));
    headRow.appendChild(u.el("th", "", "Value"));

    var tbody = table.createTBody();
    SUMMARY_KEYS.forEach(function (key) {
      if (!(key in data)) return;
      var val = data[key];
      if (val === null || val === undefined || val === "") return;

      var row = tbody.insertRow();
      var keyCell = row.insertCell();
      keyCell.className = "sb-summary-key";
      keyCell.textContent = _titleCase(key);
      var valCell = row.insertCell();

      if (key === "status") {
        valCell.appendChild(u.badge(val, "sb-status-badge"));
      } else if (key === "priority") {
        valCell.appendChild(u.badge(val, "sb-priority-indicator"));
      } else {
        valCell.textContent = String(val);
      }
    });

    return table;
  }

  function _buildMetadataDetails(data) {
    var details = u.el("details", "sb-roadmap-item-metadata-details");
    var summary = document.createElement("summary");
    summary.textContent = "Metadata and provenance";
    details.appendChild(summary);

    var metadataCard = u.el("div", "sb-roadmap-item-metadata-body");
    metadataCard.appendChild(_buildSummaryTable(data));

    if (_isObject(data.provenance)) {
      var provenanceTitle = u.el("h3", "", "Provenance");
      metadataCard.appendChild(provenanceTitle);

      var table = u.el("table", "sb-summary-table");
      table.setAttribute("aria-label", "Roadmap item provenance");
      var tbody = table.createTBody();

      Object.keys(data.provenance).forEach(function (key) {
        var value = data.provenance[key];
        if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
          return;
        }

        var row = tbody.insertRow();
        var keyCell = row.insertCell();
        keyCell.className = "sb-summary-key";
        keyCell.textContent = _titleCase(key);
        var valueCell = row.insertCell();
        valueCell.textContent = Array.isArray(value) ? value.join(", ") : String(value);
      });

      if (tbody.childNodes.length > 0) {
        metadataCard.appendChild(table);
      }
    }

    var extraTable = u.el("table", "sb-summary-table");
    extraTable.setAttribute("aria-label", "Roadmap item generated and external references");
    var extraBody = extraTable.createTBody();

    METADATA_KEYS.forEach(function (key) {
      if (!(key in data)) return;
      var value = data[key];
      if (value === null || value === undefined || value === "") return;

      var row = extraBody.insertRow();
      var keyCell = row.insertCell();
      keyCell.className = "sb-summary-key";
      keyCell.textContent = _titleCase(key);

      var valueCell = row.insertCell();
      if (key === "jira_link" && _asNonEmptyString(value)) {
        var link = document.createElement("a");
        link.href = _asNonEmptyString(value);
        link.textContent = _asNonEmptyString(value);
        valueCell.appendChild(link);
      } else {
        valueCell.textContent = Array.isArray(value) ? value.join(", ") : String(value);
      }
    });

    if (extraBody.childNodes.length > 0) {
      metadataCard.appendChild(extraTable);
    }

    details.appendChild(metadataCard);
    return details;
  }

  // PUBLIC_INTERFACE
  function renderRoadmapItemPage(root, data) {
    /**
     * Render a roadmap item artifact as a hub page.
     *
     * Parameters:
     *   root: The target DOM element that receives generated page sections.
     *   data: The embedded roadmap item JSON payload.
     *
     * Returns:
     *   Nothing. The function mutates the supplied root element.
     */
    if (!data || typeof data !== "object") {
      root.innerHTML = "<p><em>No roadmap item data available.</em></p>";
      return;
    }

    var viewModel = _buildViewModel(data);

    root.appendChild(_buildHeroSection(data));
    root.appendChild(_buildMetricGrid(viewModel));

    var overviewSection = _buildOverviewSection(data);
    if (overviewSection) root.appendChild(overviewSection);

    var epicsTableSection = _buildEnhancedEpicsSection(viewModel);
    if (epicsTableSection) root.appendChild(epicsTableSection);

    root.appendChild(_buildTestCasesSection(viewModel));

    var supportingDocsSection = _buildSupportingDocsSection(viewModel);
    if (supportingDocsSection) root.appendChild(supportingDocsSection);

    root.appendChild(_buildMetadataDetails(data));
  }

  SpecBuilderRendererRegistry.register("roadmap_item", renderRoadmapItemPage);
})();
