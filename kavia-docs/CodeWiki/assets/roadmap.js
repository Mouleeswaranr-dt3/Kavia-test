/**
 * Spec Builder Roadmap renderer for MkDocs Material.
 *
 * Renders the top-level roadmap container page from an embedded JSON payload.
 * The roadmap artifact is the planning container for roadmap items and optional
 * milestones, sprints, notes, risks, dependencies, and overview metadata.
 *
 * Registered with SpecBuilderRendererRegistry as "roadmap".
 */

/* global SpecBuilderRendererRegistry */

(function () {
  "use strict";

  var u = SpecBuilderRendererRegistry.utils;

  var DEFAULT_GROUPING = {
    mode: "milestone",
    past_statuses: ["done", "completed", "shipped", "cancelled"],
    current_statuses: ["in_progress", "blocked", "in_review", "active"],
    upcoming_statuses: ["draft", "approved", "planned", "todo"]
  };

  var DEFAULT_PRESENTATION = {
    show_kpis: true,
    show_timeline: true,
    show_current_focus: true,
    show_past_work: true,
    default_grouping: "milestone",
    current_section_title: "Current Focus",
    upcoming_section_title: "Upcoming Roadmap",
    past_section_title: "Recently Completed"
  };

  var SUMMARY_KEYS = [
    "status",
    "priority",
    "owner",
    "horizon",
    "current_milestone_id",
    "current_sprint_id",
    "created_at",
    "updated_at"
  ];

  var _RENDER_SKIP_KEYS = new Set([
    "id",
    "type",
    "title",
    "summary",
    "description",
    "status",
    "priority",
    "owner",
    "horizon",
    "created_at",
    "updated_at",
    "current_milestone_id",
    "current_sprint_id",
    "grouping",
    "presentation",
    "tags",
    "items",
    "roadmap_item_ids",
    "milestones",
    "sprints",
    "releases",
    "risks",
    "dependencies",
    "assumptions",
    "notes",
    "provenance",
    "_resolved",
    "_table_patterns"
  ]);

  function _normalizeData(raw) {
    var d = Object.assign({}, raw || {});
    if (raw && raw.provenance && typeof raw.provenance === "object") {
      if (!d.created_at && raw.provenance.created_at) {
        d.created_at = raw.provenance.created_at;
      }
      if (!d.updated_at && raw.provenance.updated_at) {
        d.updated_at = raw.provenance.updated_at;
      }
    }

    if (!Array.isArray(d.items) && Array.isArray(d.roadmap_item_ids)) {
      d.items = d.roadmap_item_ids.slice();
    }
    if (!Array.isArray(d.items)) {
      d.items = [];
    }
    if (!Array.isArray(d.milestones)) {
      d.milestones = [];
    }
    if (!Array.isArray(d.sprints)) {
      d.sprints = [];
    }
    if (!Array.isArray(d.releases)) {
      d.releases = [];
    }
    if (!Array.isArray(d.tags)) {
      d.tags = [];
    }

    d.grouping = _mergeConfig(DEFAULT_GROUPING, d.grouping);
    d.presentation = _mergeConfig(DEFAULT_PRESENTATION, d.presentation);
    if (!d.grouping.mode && d.presentation.default_grouping) {
      d.grouping.mode = d.presentation.default_grouping;
    }

    return d;
  }

  function _mergeConfig(defaults, candidate) {
    var merged = Object.assign({}, defaults);
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      Object.keys(candidate).forEach(function (key) {
        if (candidate[key] !== undefined && candidate[key] !== null) {
          merged[key] = candidate[key];
        }
      });
    }
    return merged;
  }

  function _asArray(value) {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === "") return [];
    return [value];
  }

  function _normalizeStatus(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
  }

  function _matchesStatus(value, statusList) {
    var normalized = _normalizeStatus(value);
    return normalized && _asArray(statusList).map(_normalizeStatus).indexOf(normalized) !== -1;
  }

  function _slugToLabel(id) {
    return String(id || "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function _formatLabel(value) {
    if (value === null || value === undefined || value === "") return "";
    return _slugToLabel(String(value));
  }

  function _formatDate(value) {
    if (!value) return "";
    return String(value).replace(/T.*$/, "");
  }

  function _formatDateRange(obj) {
    if (!obj || typeof obj !== "object") return "";
    var start = _formatDate(obj.starts_at || obj.start_date);
    var end = _formatDate(obj.ends_at || obj.end_date);
    var target = _formatDate(obj.target_date || obj.release_date);
    if (start && end) return start + " – " + end;
    return target || start || end;
  }

  function _inferRoadmapItemHref(id) {
    var slug = String(id || "").trim();
    if (!slug) return "#";
    return u.relativeSpecBuilderHref("roadmap_items/" + slug + ".html");
  }

  function _prepareRoadmapGroups(data) {
    var resolved = (data._resolved && typeof data._resolved === "object") ? data._resolved : {};
    var explicitIds = Array.isArray(data.items) ? data.items : [];
    var seen = new Set();

    var items = explicitIds.map(function (rawId) {
      var id = String(rawId || "").trim();
      seen.add(id);
      return Object.assign({ id: id }, resolved[id] || {});
    }).filter(function (item) {
      return item.id;
    });

    Object.keys(resolved).forEach(function (id) {
      if (!seen.has(id) && resolved[id] && typeof resolved[id] === "object") {
        items.push(Object.assign({ id: id }, resolved[id]));
      }
    });

    var past = [];
    var current = [];
    var upcoming = [];

    items.forEach(function (item) {
      if (_isPastItem(item, data)) {
        past.push(item);
      } else if (_isCurrentItem(item, data)) {
        current.push(item);
      } else {
        upcoming.push(item);
      }
    });

    return {
      all: items,
      current: current,
      upcoming: upcoming,
      past: past,
      blocked: items.filter(function (item) { return _normalizeStatus(item.status) === "blocked"; }),
      byMilestone: _groupItemsByField(items, "milestone_id"),
      bySprint: _groupItemsByField(items, "sprint_id"),
      upcomingByMilestone: _groupItemsByField(upcoming, "milestone_id"),
      upcomingBySprint: _groupItemsByField(upcoming, "sprint_id"),
      pastByMilestone: _groupItemsByField(past, "milestone_id"),
      milestonesById: _indexById(data.milestones),
      sprintsById: _indexById(data.sprints)
    };
  }

  function _isPastItem(item, data) {
    if (!item) return false;
    if (item.completed_at || item.shipped_at || item.release_date) return true;
    return _matchesStatus(item.status, data.grouping.past_statuses);
  }

  function _isCurrentItem(item, data) {
    if (!item) return false;
    if (data.current_milestone_id && item.milestone_id === data.current_milestone_id) return true;
    if (data.current_sprint_id && item.sprint_id === data.current_sprint_id) return true;
    return _matchesStatus(item.status, data.grouping.current_statuses);
  }

  function _groupItemsByField(items, field) {
    var grouped = {};
    items.forEach(function (item) {
      var key = item && item[field] ? String(item[field]) : "";
      if (!key) return;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  }

  function _indexById(entries) {
    var indexed = {};
    if (!Array.isArray(entries)) return indexed;
    entries.forEach(function (entry) {
      if (entry && typeof entry === "object" && entry.id) {
        indexed[String(entry.id)] = entry;
      }
    });
    return indexed;
  }

  function _buildHero(data, grouped) {
    var section = u.el("section", "sb-roadmap-hero");
    section.setAttribute("aria-label", "Roadmap overview");

    var eyebrow = u.el("div", "sb-roadmap-eyebrow", "Roadmap");
    section.appendChild(eyebrow);

    var title = u.el("h2", "sb-roadmap-title", data.title || "Roadmap");
    section.appendChild(title);

    var summaryText = data.summary || data.description;
    if (summaryText) {
      section.appendChild(u.el("p", "sb-roadmap-hero-summary", String(summaryText)));
    }

    var meta = u.el("div", "sb-roadmap-hero-meta");
    _appendMetaBadge(meta, "Status", data.status, "sb-status-badge");
    _appendMetaText(meta, "Owner", data.owner);
    _appendMetaText(meta, "Horizon", data.horizon);
    _appendMetaText(meta, "Updated", _formatDate(data.updated_at));

    if (meta.childNodes.length > 0) {
      section.appendChild(meta);
    }

    if (data.description && data.summary && data.description !== data.summary) {
      var details = u.el("p", "sb-roadmap-hero-description", String(data.description));
      section.appendChild(details);
    }

    if (grouped.all.length === 0) {
      section.appendChild(u.el("div", "sb-roadmap-empty-state", "This roadmap has not yet been populated with roadmap items."));
    }

    return section;
  }

  function _appendMetaBadge(container, label, value, className) {
    if (!value) return;
    var item = u.el("span", "sb-roadmap-meta-item");
    item.appendChild(u.el("span", "sb-roadmap-meta-label", label + ":"));
    item.appendChild(u.badge(value, className));
    container.appendChild(item);
  }

  function _appendMetaText(container, label, value) {
    if (!value) return;
    var item = u.el("span", "sb-roadmap-meta-item");
    item.appendChild(u.el("span", "sb-roadmap-meta-label", label + ":"));
    item.appendChild(u.el("span", "sb-roadmap-meta-value", String(value)));
    container.appendChild(item);
  }

  function _buildKpiCards(data, grouped) {
    if (data.presentation.show_kpis === false || grouped.all.length === 0) return null;

    var section = u.el("section", "sb-roadmap-kpi-grid");
    section.setAttribute("aria-label", "Roadmap summary metrics");

    var cards = [
      { label: "Total items", value: grouped.all.length },
      { label: "Current focus", value: grouped.current.length },
      { label: "Upcoming", value: grouped.upcoming.length },
      { label: "Completed", value: grouped.past.length },
      { label: "Blocked", value: grouped.blocked.length }
    ];

    cards.forEach(function (card) {
      var el = u.el("div", "sb-roadmap-kpi-card");
      el.appendChild(u.el("div", "sb-roadmap-kpi-value", String(card.value)));
      el.appendChild(u.el("div", "sb-roadmap-kpi-label", card.label));
      section.appendChild(el);
    });

    return section;
  }

  function _buildTimeline(data, grouped) {
    if (data.presentation.show_timeline === false) return null;
    if (!Array.isArray(data.milestones) || data.milestones.length === 0) return null;

    var section = u.el("section", "sb-roadmap-section sb-roadmap-timeline-section");
    section.appendChild(u.el("h2", "", "Timeline Overview"));

    var timeline = u.el("div", "sb-roadmap-timeline");
    data.milestones.forEach(function (milestone) {
      var card = _buildMilestoneCard(milestone, grouped);
      if (card) timeline.appendChild(card);
    });

    if (timeline.childNodes.length === 0) return null;
    section.appendChild(timeline);
    return section;
  }

  function _buildMilestoneCard(milestone, grouped) {
    if (!milestone) return null;

    if (typeof milestone === "string") {
      milestone = { id: milestone, title: milestone };
    }

    if (typeof milestone !== "object") {
      milestone = { title: String(milestone) };
    }

    var id = milestone.id ? String(milestone.id) : "";
    var itemCount = id && grouped.byMilestone[id] ? grouped.byMilestone[id].length : _asArray(milestone.item_ids).length;
    var card = u.el("article", "sb-roadmap-milestone-card");
    if (id) card.setAttribute("data-milestone-id", id);

    var heading = u.el("h3", "sb-roadmap-milestone-title", String(milestone.title || milestone.name || id || "Untitled milestone"));
    card.appendChild(heading);

    var meta = u.el("div", "sb-roadmap-milestone-meta");
    var dateRange = _formatDateRange(milestone);
    if (dateRange) {
      meta.appendChild(u.el("span", "sb-roadmap-milestone-date", dateRange));
    }
    if (milestone.status) {
      meta.appendChild(u.badge(milestone.status, "sb-status-badge"));
    }
    if (milestone.confidence) {
      meta.appendChild(u.badge(milestone.confidence, "sb-confidence-badge"));
    }
    if (meta.childNodes.length > 0) {
      card.appendChild(meta);
    }

    if (milestone.description) {
      card.appendChild(u.el("p", "sb-roadmap-milestone-description", String(milestone.description)));
    }

    var footer = u.el("div", "sb-roadmap-milestone-footer");
    footer.appendChild(u.el("span", "", itemCount + " item" + (itemCount === 1 ? "" : "s")));
    if (milestone.theme) {
      footer.appendChild(u.el("span", "", String(milestone.theme)));
    }
    card.appendChild(footer);

    return card;
  }

  function _buildCurrentFocus(data, grouped) {
    if (data.presentation.show_current_focus === false) return null;
    if (grouped.current.length === 0) return null;

    var section = u.el("section", "sb-roadmap-section sb-roadmap-current-focus");
    section.appendChild(u.el("h2", "", data.presentation.current_section_title || "Current Focus"));

    var context = _currentContextText(data, grouped);
    if (context) {
      section.appendChild(u.el("p", "sb-roadmap-section-intro", context));
    }

    section.appendChild(_buildItemsTable(grouped.current, {
      ariaLabel: "Current roadmap focus",
      includeDescription: true
    }));

    return section;
  }

  function _currentContextText(data, grouped) {
    if (data.current_milestone_id && grouped.milestonesById[data.current_milestone_id]) {
      var milestone = grouped.milestonesById[data.current_milestone_id];
      return "Active milestone: " + String(milestone.title || milestone.id);
    }
    if (data.current_sprint_id && grouped.sprintsById[data.current_sprint_id]) {
      var sprint = grouped.sprintsById[data.current_sprint_id];
      return "Active sprint: " + String(sprint.title || sprint.id);
    }
    return "Items currently in progress, blocked, or in review.";
  }

  function _buildUpcomingSection(data, grouped) {
    if (grouped.upcoming.length === 0) return null;

    var mode = data.grouping.mode || data.presentation.default_grouping || "milestone";
    var section = u.el("section", "sb-roadmap-section sb-roadmap-upcoming");
    section.appendChild(u.el("h2", "", data.presentation.upcoming_section_title || "Upcoming Roadmap"));

    if (mode === "flat") {
      section.appendChild(_buildItemsTable(grouped.upcoming, {
        ariaLabel: "Upcoming roadmap items",
        includeDescription: true
      }));
      return section;
    }

    var groups = _buildDisplayGroups(data, grouped, grouped.upcoming, mode);
    groups.forEach(function (group) {
      section.appendChild(_buildRoadmapGroup(group));
    });

    return section;
  }

  function _buildPastSection(data, grouped) {
    if (data.presentation.show_past_work === false || grouped.past.length === 0) return null;

    var section = u.el("section", "sb-roadmap-section sb-roadmap-past");
    section.appendChild(u.el("h2", "", data.presentation.past_section_title || "Recently Completed"));
    section.appendChild(_buildItemsTable(grouped.past, {
      ariaLabel: "Recently completed roadmap items",
      includeDescription: true,
      preferCompletedDate: true
    }));
    return section;
  }

  function _buildDisplayGroups(data, grouped, items, mode) {
    var itemIdsInGroups = new Set();
    var groups = [];

    if (mode === "sprint") {
      data.sprints.forEach(function (sprint) {
        var groupItems = _itemsForGroup(items, "sprint_id", sprint.id, sprint.item_ids);
        if (groupItems.length === 0) return;
        groupItems.forEach(function (item) { itemIdsInGroups.add(item.id); });
        groups.push({
          title: sprint.title || sprint.id || "Untitled sprint",
          description: sprint.goal || sprint.description,
          meta: [_formatDateRange(sprint), sprint.status].filter(Boolean),
          items: groupItems
        });
      });
    } else if (mode === "status" || mode === "priority") {
      var field = mode;
      var buckets = {};
      items.forEach(function (item) {
        var key = item[field] ? String(item[field]) : "unspecified";
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(item);
        itemIdsInGroups.add(item.id);
      });
      Object.keys(buckets).sort().forEach(function (key) {
        groups.push({
          title: _formatLabel(key || "unscheduled"),
          description: "",
          meta: [],
          items: buckets[key]
        });
      });
    } else {
      data.milestones.forEach(function (milestone) {
        var groupItems = _itemsForGroup(items, "milestone_id", milestone.id, milestone.item_ids);
        if (groupItems.length === 0) return;
        groupItems.forEach(function (item) { itemIdsInGroups.add(item.id); });
        groups.push({
          title: milestone.title || milestone.id || "Untitled milestone",
          description: milestone.description,
          meta: [_formatDateRange(milestone), milestone.status, milestone.confidence].filter(Boolean),
          items: groupItems
        });
      });
    }

    var unscheduled = items.filter(function (item) {
      return !itemIdsInGroups.has(item.id);
    });
    if (unscheduled.length > 0) {
      groups.push({
        title: mode === "sprint" ? "Unassigned Sprint Work" : "Unscheduled / Backlog",
        description: "Roadmap items that are not yet assigned to a visible " + (mode === "sprint" ? "sprint." : "milestone."),
        meta: [],
        items: unscheduled
      });
    }

    return groups;
  }

  function _itemsForGroup(items, field, id, explicitIds) {
    var explicit = new Set(_asArray(explicitIds).map(function (value) { return String(value); }));
    var groupId = id ? String(id) : "";
    return items.filter(function (item) {
      return (groupId && item[field] === groupId) || explicit.has(String(item.id));
    });
  }

  function _buildRoadmapGroup(group) {
    var wrapper = u.el("article", "sb-roadmap-group");
    var header = u.el("div", "sb-roadmap-group-header");

    var titleBlock = u.el("div", "sb-roadmap-group-title-block");
    titleBlock.appendChild(u.el("h3", "sb-roadmap-group-title", String(group.title || "Roadmap group")));
    if (group.description) {
      titleBlock.appendChild(u.el("p", "sb-roadmap-group-description", String(group.description)));
    }
    header.appendChild(titleBlock);

    if (group.meta && group.meta.length > 0) {
      var meta = u.el("div", "sb-roadmap-group-meta");
      group.meta.forEach(function (part) {
        meta.appendChild(u.el("span", "", String(part)));
      });
      header.appendChild(meta);
    }

    wrapper.appendChild(header);
    wrapper.appendChild(_buildItemsTable(group.items, {
      ariaLabel: String(group.title || "Roadmap group") + " items",
      includeDescription: true
    }));

    return wrapper;
  }

  function _buildItemsTable(items, options) {
    options = options || {};
    var table = u.el("table", "sb-roadmap-items-table");
    table.setAttribute("aria-label", options.ariaLabel || "Roadmap items");

    var columns = _tableColumnsForItems(items, options);
    var thead = table.createTHead();
    var header = thead.insertRow();
    columns.forEach(function (column) {
      header.appendChild(u.el("th", column.className || "", column.label));
    });

    var tbody = table.createTBody();
    items.forEach(function (item) {
      var row = tbody.insertRow();
      row.className = "sb-roadmap-item-row";
      columns.forEach(function (column) {
        var cell = row.insertCell();
        if (column.className) cell.className = column.className;
        column.render(cell, item);
      });
    });

    return table;
  }

  function _tableColumnsForItems(items, options) {
    var columns = [
      {
        key: "item",
        label: "Item",
        className: "sb-ri-col-item",
        render: function (cell, item) {
          var link = document.createElement("a");
          link.className = "sb-ri-link";
          link.href = _inferRoadmapItemHref(item.id);
          link.textContent = (item.title || _slugToLabel(item.id)).toString();
          cell.appendChild(link);

          var desc = (item.description || "").toString().trim();
          if (options.includeDescription && desc) {
            var meta = u.el("div", "sb-ri-description", u.truncate(desc, 180));
            meta.title = desc;
            cell.appendChild(meta);
          }

          if (Array.isArray(item.tags) && item.tags.length > 0) {
            var tags = u.el("div", "sb-ri-tags");
            item.tags.slice(0, 4).forEach(function (tag) {
              tags.appendChild(u.el("span", "spec-builder-tag", String(tag)));
            });
            cell.appendChild(tags);
          }
        }
      }
    ];

    columns.push({
      key: "status",
      label: "Status",
      className: "sb-ri-col-status",
      render: function (cell, item) {
        if (item.status) {
          cell.appendChild(u.badge(item.status, "sb-status-badge"));
        } else {
          cell.appendChild(u.el("span", "sb-muted", "Not set"));
        }
      }
    });

    columns.push({
      key: "priority",
      label: "Priority",
      className: "sb-ri-col-priority",
      render: function (cell, item) {
        if (item.priority) {
          cell.appendChild(u.badge(item.priority, "sb-priority-indicator"));
        } else {
          cell.appendChild(u.el("span", "sb-muted", "Not set"));
        }
      }
    });

    if (_itemsHaveAny(items, ["target_date", "completed_at", "shipped_at", "release_date"])) {
      columns.push({
        key: "target",
        label: options.preferCompletedDate ? "Completed" : "Target",
        className: "sb-ri-col-target",
        render: function (cell, item) {
          var value = options.preferCompletedDate
            ? (item.completed_at || item.shipped_at || item.release_date || item.target_date)
            : (item.target_date || item.release_date || item.completed_at || item.shipped_at);
          cell.textContent = _formatDate(value) || "Not set";
          if (!value) cell.className += " sb-muted";
        }
      });
    }

    if (_itemsHaveAny(items, ["owner"])) {
      columns.push({
        key: "owner",
        label: "Owner",
        className: "sb-ri-col-owner",
        render: function (cell, item) {
          cell.textContent = item.owner ? String(item.owner) : "Not set";
          if (!item.owner) cell.className += " sb-muted";
        }
      });
    }

    if (_itemsHaveAny(items, ["confidence"])) {
      columns.push({
        key: "confidence",
        label: "Confidence",
        className: "sb-ri-col-confidence",
        render: function (cell, item) {
          if (item.confidence) {
            cell.appendChild(u.badge(item.confidence, "sb-confidence-badge"));
          } else {
            cell.appendChild(u.el("span", "sb-muted", "Not set"));
          }
        }
      });
    }

    if (_itemsHaveAny(items, ["links"])) {
      columns.push({
        key: "links",
        label: "Artifacts",
        className: "sb-ri-col-links",
        render: function (cell, item) {
          var links = Array.isArray(item.links) ? item.links : [];
          if (links.length === 0) {
            cell.appendChild(u.el("span", "sb-muted", "None"));
            return;
          }
          var list = u.el("div", "sb-ri-link-list");
          links.slice(0, 3).forEach(function (linkObj) {
            list.appendChild(_buildArtifactLink(linkObj));
          });
          cell.appendChild(list);
        }
      });
    }

    return columns;
  }

  function _itemsHaveAny(items, keys) {
    return items.some(function (item) {
      return keys.some(function (key) {
        var value = item[key];
        return value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
      });
    });
  }

  function _buildArtifactLink(linkObj) {
    var label = "Artifact";
    var href = "";

    if (typeof linkObj === "string") {
      label = _formatLabel(linkObj);
    } else if (linkObj && typeof linkObj === "object") {
      label = linkObj.title || linkObj.label || linkObj.type || linkObj.id || linkObj.path || "Artifact";
      href = linkObj.href || linkObj.url || linkObj.path || "";
    }

    if (href) {
      var link = document.createElement("a");
      link.className = "sb-artifact-link";
      link.href = href;
      link.textContent = _formatLabel(label);
      return link;
    }

    return u.el("span", "sb-artifact-link sb-artifact-link-static", _formatLabel(label));
  }

  function _buildRisksAndDependencies(data) {
    var sections = [
      { title: "Risks", values: data.risks },
      { title: "Dependencies", values: data.dependencies },
      { title: "Assumptions", values: data.assumptions }
    ].filter(function (entry) {
      return Array.isArray(entry.values) && entry.values.length > 0;
    });

    if (sections.length === 0) return null;

    var wrapper = u.el("section", "sb-roadmap-section sb-roadmap-delivery-notes");
    wrapper.appendChild(u.el("h2", "", "Risks, Dependencies, and Assumptions"));

    var grid = u.el("div", "sb-roadmap-note-grid");
    sections.forEach(function (entry) {
      var card = u.el("article", "sb-roadmap-note-card");
      card.appendChild(u.el("h3", "", entry.title));

      var list = u.el("ul", "sb-roadmap-note-list");
      entry.values.forEach(function (value) {
        list.appendChild(_buildStructuredListItem(value));
      });
      card.appendChild(list);
      grid.appendChild(card);
    });

    wrapper.appendChild(grid);
    return wrapper;
  }

  function _buildStructuredListItem(value) {
    var li = u.el("li", "");
    if (value && typeof value === "object") {
      var title = value.title || value.name || value.id || "Item";
      li.appendChild(u.el("strong", "", String(title)));
      if (value.status) {
        li.appendChild(document.createTextNode(" "));
        li.appendChild(u.badge(value.status, "sb-status-badge"));
      }
      if (value.description) {
        li.appendChild(u.el("div", "sb-roadmap-note-description", String(value.description)));
      }
      if (value.owner) {
        li.appendChild(u.el("div", "sb-roadmap-note-meta", "Owner: " + String(value.owner)));
      }
    } else {
      li.textContent = String(value);
    }
    return li;
  }

  function _buildSummaryTable(data) {
    var rows = SUMMARY_KEYS.filter(function (key) {
      var val = data[key];
      return val !== null && val !== undefined && val !== "";
    });

    if (rows.length === 0) return null;

    var details = u.el("details", "sb-roadmap-metadata-details");
    details.appendChild(u.el("summary", "", "Roadmap Metadata"));

    var table = u.el("table", "sb-summary-table");
    table.setAttribute("aria-label", "Roadmap metadata");
    var thead = table.createTHead();
    var headRow = thead.insertRow();
    headRow.appendChild(u.el("th", "", "Field"));
    headRow.appendChild(u.el("th", "", "Value"));

    var tbody = table.createTBody();
    rows.forEach(function (key) {
      var val = data[key];
      var row = tbody.insertRow();
      var keyCell = row.insertCell();
      keyCell.className = "sb-summary-key";
      keyCell.textContent = u.titleCase(key);

      var valCell = row.insertCell();
      valCell.className = "sb-summary-value";
      if (key === "status") {
        valCell.appendChild(u.badge(val, "sb-status-badge"));
      } else if (key === "priority") {
        valCell.appendChild(u.badge(val, "sb-priority-indicator"));
      } else {
        valCell.textContent = String(val);
      }
    });

    details.appendChild(table);
    return details;
  }

  function _buildTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return null;
    var section = u.el("section", "sb-tags-section");
    section.appendChild(u.el("h2", "", "Tags"));
    var container = u.el("div", "sb-tags-container");
    tags.forEach(function (tag) {
      container.appendChild(u.el("span", "spec-builder-tag", String(tag)));
    });
    section.appendChild(container);
    return section;
  }

  function _buildNotesSection(notes) {
    if (!notes || !String(notes).trim()) return null;
    var section = u.el("section", "sb-notes-section");
    section.appendChild(u.el("h2", "", "Delivery Notes"));
    section.appendChild(u.el("p", "", String(notes)));
    return section;
  }

  function _buildExtraFields(data) {
    var extraKeys = Object.keys(data).filter(function (k) {
      return !_RENDER_SKIP_KEYS.has(k) && data[k] !== null && data[k] !== undefined && data[k] !== "";
    });
    if (extraKeys.length === 0) return null;

    var section = u.el("section", "sb-extra-fields-section");
    section.appendChild(u.el("h2", "", "Additional Fields"));

    var table = u.el("table", "sb-extra-table");
    var thead = table.createTHead();
    var row = thead.insertRow();
    row.appendChild(u.el("th", "", "Field"));
    row.appendChild(u.el("th", "", "Value"));

    var tbody = table.createTBody();
    extraKeys.forEach(function (key) {
      var tr = tbody.insertRow();
      tr.insertCell().textContent = u.titleCase(key);
      var valCell = tr.insertCell();
      var val = data[key];
      if (typeof val === "object") {
        var pre = u.el("pre", "sb-json-value");
        pre.textContent = JSON.stringify(val, null, 2);
        valCell.appendChild(pre);
      } else {
        valCell.textContent = String(val);
      }
    });

    section.appendChild(table);
    return section;
  }

  function renderRoadmapPage(root, rawData) {
    var data = _normalizeData(rawData);
    var grouped = _prepareRoadmapGroups(data);

    var renderPlan = [
      function () { return _buildHero(data, grouped); },
      function () { return _buildKpiCards(data, grouped); },
      function () { return _buildTimeline(data, grouped); },
      function () { return _buildCurrentFocus(data, grouped); },
      function () { return _buildUpcomingSection(data, grouped); },
      function () { return _buildPastSection(data, grouped); },
      function () { return _buildRisksAndDependencies(data); },
      function () { return _buildNotesSection(data.notes); },
      function () { return _buildTags(data.tags); },
      function () { return _buildSummaryTable(data); },
      function () { return _buildExtraFields(data); }
    ];

    renderPlan.forEach(function (builder) {
      var el = builder();
      if (el) root.appendChild(el);
    });
  }

  SpecBuilderRendererRegistry.register("roadmap", renderRoadmapPage);
})();
