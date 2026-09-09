/**
 * Spec Builder Renderer Registry for MkDocs Material.
 *
 * Central dispatcher that maps JSON artifact types to their per-type
 * client-side renderer functions. Each per-type JS file registers itself
 * with this registry upon load.
 *
 * The dispatcher reads the <meta name="sb-artifact-type"> tag from the
 * current page, looks up the corresponding renderer, and invokes it with
 * the JSON payload from the <script type="application/json" id="sb-page-data">
 * block.
 *
 * This file is intentionally minimal: registration + dispatch + generic
 * DOM/string utilities. All rendering logic lives in per-type renderer files
 * (roadmap_item.js, epic.js, etc.) or the generic fallback (generic_artifact.js).
 *
 * @see kavia-docs/CodeWiki/Specs/DetailedDesigns/client-side-json-rendering-per-page-js-css.md
 */

/* global localStorage */

// PUBLIC_INTERFACE
/**
 * Global renderer registry for Spec Builder artifact types.
 *
 * Usage:
 *   SpecBuilderRendererRegistry.register("roadmap_item", function(root, data) { ... });
 *   SpecBuilderRendererRegistry.registerListRenderer("epic", function(container, items) { ... });
 *   SpecBuilderRendererRegistry.dispatch();
 */
var SpecBuilderRendererRegistry = (function () {
  "use strict";

  var _pageRenderers = {};
  var _listRenderers = {};
  var _artifactPageFolders = {
    epic: "epics",
    epics: "epics",
    roadmap: "roadmap",
    roadmap_item: "roadmap",
    roadmap_items: "roadmap",
    story: "stories",
    stories: "stories",
    user_story: "stories",
    user_stories: "stories",
    test: "tests",
    tests: "tests",
    test_case: "tests",
    test_cases: "tests"
  };

  // PUBLIC_INTERFACE
  /**
   * Register a full-page renderer for the given artifact type.
   * @param {string} type - Artifact type key.
   * @param {function(HTMLElement, Object): void} fn - Renderer function.
   */
  function register(type, fn) {
    if (typeof type === "string" && typeof fn === "function") {
      _pageRenderers[type] = fn;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Register a list/embedded renderer for the given artifact type.
   * @param {string} type - Artifact type key.
   * @param {function(HTMLElement, Array): void} fn - List renderer function.
   */
  function registerListRenderer(type, fn) {
    if (typeof type === "string" && typeof fn === "function") {
      _listRenderers[type] = fn;
    }
  }

  // PUBLIC_INTERFACE
  /** Retrieve a registered list renderer, or null. */
  function getListRenderer(type) {
    return _listRenderers[type] || null;
  }

  // PUBLIC_INTERFACE
  /** Retrieve a registered page renderer, or null. */
  function getPageRenderer(type) {
    return _pageRenderers[type] || null;
  }

  /**
   * Normalize an artifact type string for registry lookup.
   * @param {string} raw - Raw type string.
   * @returns {string} Normalized key.
   */
  function _normalizeType(raw) {
    if (!raw) return "generic";
    var s = raw.toString().toLowerCase().trim();
    s = s.replace(/^spec[_-]builder[._-]?/, "");
    s = s.replace(/[-. ]+/g, "_");
    s = s.replace(/^_+|_+$/g, "");
    return s || "generic";
  }

  /**
   * Normalize artifact relationship kinds to their rendered Spec Builder page folders.
   * Relationship fields often use plural semantic keys such as "user_stories" while
   * the generated pages use concise folder names such as "stories".
   * @param {string} kind - Artifact type, relationship kind, or folder-like value.
   * @returns {string} Folder path below Artifacts/SpecBuilder/pages/.
   */
  function _artifactPageFolder(kind) {
    var normalized = _normalizeType(kind || "artifacts");
    return _artifactPageFolders[normalized] || normalized;
  }

  // PUBLIC_INTERFACE
  /**
   * Dispatch rendering for the current page. Idempotent.
   */
  function dispatch() {
    var root = document.getElementById("sb-page-root");
    var dataEl = document.getElementById("sb-page-data");
    if (!root || !dataEl) return;
    if (root.getAttribute("data-sb-rendered") === "1") return;

    var typeMeta = document.querySelector('meta[name="sb-artifact-type"]');
    var rawType = typeMeta ? typeMeta.getAttribute("content") : "generic";
    var artifactType = _normalizeType(rawType);
    var fallbackEl = document.querySelector("[data-sb-fallback]");

    var data;
    try {
      data = JSON.parse(dataEl.textContent || dataEl.innerText || "{}");
    } catch (e) {
      root.innerHTML = '<p class="sb-render-error"><em>Failed to parse artifact data.</em></p>';
      root.setAttribute("data-sb-rendered", "1");
      if (fallbackEl) fallbackEl.setAttribute("hidden", "hidden");
      root.removeAttribute("data-loading");
      return;
    }

    var payloadType = data && typeof data === "object" ? data.type : "";
    var payloadArtifactType = _normalizeType(payloadType);
    var renderer =
      _pageRenderers[artifactType] ||
      _pageRenderers[payloadArtifactType] ||
      _pageRenderers["generic"] ||
      null;
    if (!_pageRenderers[artifactType] && _pageRenderers[payloadArtifactType]) {
      artifactType = payloadArtifactType;
    }
    if (renderer) {
      try {
        renderer(root, data);
        if (root.childNodes.length > 0 || (root.textContent || "").trim()) {
          root.setAttribute("data-sb-rendered", "1");
          if (fallbackEl) fallbackEl.setAttribute("hidden", "hidden");
        } else if (fallbackEl) {
          fallbackEl.removeAttribute("hidden");
        }
      }
      catch (e) {
        root.innerHTML = '<p class="sb-render-error"><em>Rendering failed for type: ' +
          _escapeHtml(artifactType) + "</em></p>";
        root.setAttribute("data-sb-rendered", "1");
        if (fallbackEl) fallbackEl.removeAttribute("hidden");
      }
    } else {
      if (fallbackEl) fallbackEl.removeAttribute("hidden");
      return;
    }
    root.removeAttribute("data-loading");
  }

  function _escapeHtml(s) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(s || ""));
    return div.innerHTML;
  }

  // PUBLIC_INTERFACE
  /** Generic utilities. Access via SpecBuilderRendererRegistry.utils.* */
  var utils = {
    escapeHtml: _escapeHtml,

    /** Create an element with optional class and text. */
    el: function (tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined && text !== null) e.textContent = String(text);
      return e;
    },

    /**
     * Create a badge span from either a semantic type or an explicit CSS prefix.
     */
    badge: function (value, typeOrCssPrefix) {
      var s = (value || "").toString();
      var slug = s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "-");
      var kind = (typeOrCssPrefix || "").toString();
      var cssPrefix = "sb-badge";

      if (kind === "status") {
        cssPrefix = "sb-status-badge";
      } else if (kind === "priority") {
        cssPrefix = "sb-priority-indicator";
      } else if (kind) {
        cssPrefix = kind;
      }

      var span = document.createElement("span");
      span.className = cssPrefix + " " + cssPrefix + "-" + slug;
      span.setAttribute("data-value", slug);
      span.textContent = s;
      return span;
    },

    /** Truncate string with ellipsis. */
    truncate: function (s, max) {
      var t = (s || "").toString();
      return t.length <= max ? t : t.slice(0, max - 1) + "\u2026";
    },

    /** Normalize type string. */
    normalizeType: _normalizeType,

    /** Convert snake_case/kebab-case to Title Case. */
    titleCase: function (key) {
      if (!key) return "";
      return key.replace(/[_-]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    },

    /** Convert slug to human label. */
    slugToLabel: function (id) {
      return String(id || "").replace(/[-_]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    },

    /** Read expand state from localStorage. Returns true/false/null. */
    readExpandState: function (key) {
      try {
        var v = localStorage.getItem(key);
        if (v === "open") return true;
        if (v === "closed") return false;
      } catch (e) { /* ignore */ }
      return null;
    },

    /** Write expand state to localStorage. */
    writeExpandState: function (key, isOpen) {
      try { localStorage.setItem(key, isOpen ? "open" : "closed"); }
      catch (e) { /* ignore */ }
    },

    /**
     * Normalize a CodeWiki link to a browser-navigable href.
     * Converts "kavia-docs/CodeWiki/<path>.md" to a relative HTML href.
     */
    normalizeLink: function (link) {
      if (typeof link !== "string" || !link) return "#";
      if (link.indexOf("kavia-docs/CodeWiki/") !== 0) return link;
      var base = link.replace("kavia-docs/CodeWiki/", "");
      var frag = "", query = "";
      if (base.indexOf("#") !== -1) { var pf = base.split("#"); base = pf[0]; frag = "#" + pf.slice(1).join("#"); }
      if (base.indexOf("?") !== -1) { var pq = base.split("?"); base = pq[0]; query = "?" + pq.slice(1).join("?"); }
      if (base.toLowerCase().endsWith(".md")) base = base.slice(0, -3) + ".html";
      if (base.indexOf("Artifacts/SpecBuilder/pages/") === 0) {
        return utils.relativeSpecBuilderHref(
          base.replace("Artifacts/SpecBuilder/pages/", "")
        ) + query + frag;
      }
      return "../../../../" + base + query + frag;
    },

    /**
     * Build a relative href from the current Spec Builder page to a sibling target.
     *
     * @param {string} targetPath - Path relative to Artifacts/SpecBuilder/pages/.
     * @returns {string} Browser-navigable relative href.
     */
    relativeSpecBuilderHref: function (targetPath) {
      var normalizedTarget = String(targetPath || "").replace(/^\.\//, "");
      if (!normalizedTarget) return "#";

      try {
        var pathname = (window.location && window.location.pathname) || "";
        var marker = "/Artifacts/SpecBuilder/pages/";
        var markerIdx = pathname.indexOf(marker);
        if (markerIdx === -1) {
          return "./" + normalizedTarget;
        }

        var currentRel = pathname.slice(markerIdx + marker.length).replace(/^\/+/, "");
        var currentParts = currentRel.split("/").filter(Boolean);
        if (currentParts.length > 0) {
          currentParts.pop();
        }

        var targetParts = normalizedTarget.split("/").filter(Boolean);
        var commonLen = 0;
        while (
          commonLen < currentParts.length &&
          commonLen < targetParts.length &&
          currentParts[commonLen] === targetParts[commonLen]
        ) {
          commonLen += 1;
        }

        var up = currentParts.slice(commonLen).map(function () { return ".."; });
        var down = targetParts.slice(commonLen);
        var combined = up.concat(down).join("/");
        return combined || ".";
      } catch (e) {
        return "./" + normalizedTarget;
      }
    },

    /** Infer a relative .html link for a Spec Builder entity. */
    inferLink: function (kind, id) {
      var slug = (id || "").toString().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
      return utils.relativeSpecBuilderHref(_artifactPageFolder(kind) + "/" + slug + ".html");
    },

    /** Normalize artifact relationship kinds to rendered Spec Builder page folders. */
    artifactPageFolder: _artifactPageFolder,

    /** @deprecated Use badge(status, "sb-status-badge") instead. */
    statusBadge: function (status) {
      return utils.badge(status, "sb-status-badge");
    },

    /** @deprecated Use badge(priority, "sb-priority-indicator") instead. */
    priorityIndicator: function (priority) {
      return utils.badge(priority, "sb-priority-indicator");
    }
  };

  // PUBLIC_INTERFACE
  /** Shared rendering components. Access via SpecBuilderRendererRegistry.components.* */
  var components = {
    kvTable: function (obj, keys) {
      var table = utils.el("table", "sb-summary-table");
      table.setAttribute("aria-label", "Summary");
      var thead = table.createTHead();
      var hRow = thead.insertRow();
      hRow.appendChild(utils.el("th", "", "Field"));
      hRow.appendChild(utils.el("th", "", "Value"));
      var tbody = table.createTBody();

      (keys || []).forEach(function (key) {
        var val = obj[key];
        if (val === null || val === undefined || val === "") return;
        var row = tbody.insertRow();
        row.insertCell().textContent = utils.titleCase(key);
        var valCell = row.insertCell();
        if (key === "status") {
          valCell.appendChild(utils.badge(String(val), "sb-status-badge"));
        } else if (key === "priority") {
          valCell.appendChild(utils.badge(String(val), "sb-priority-indicator"));
        } else {
          valCell.textContent = String(val);
        }
      });
      return table;
    },

    flatTable: function (rows, columnSpecs, label) {
      if (!Array.isArray(rows) || rows.length === 0) {
        return utils.el("p", "sb-empty", "(no items)");
      }
      var cols = columnSpecs;
      if (!Array.isArray(cols) || cols.length === 0) {
        var colSet = {};
        rows.forEach(function (r) { Object.keys(r).forEach(function (k) { colSet[k] = true; }); });
        cols = Object.keys(colSet).map(function (k) {
          return { field: k, heading: utils.titleCase(k) };
        });
      }

      var table = utils.el("table", "sb-generic-table");
      if (label) table.setAttribute("aria-label", label);
      var thead = table.createTHead();
      var hRow = thead.insertRow();
      cols.forEach(function (c) { hRow.appendChild(utils.el("th", "", c.heading || c.field)); });

      var tbody = table.createTBody();
      rows.forEach(function (row) {
        var tr = tbody.insertRow();
        cols.forEach(function (c) {
          var val = row[c.field];
          var td = tr.insertCell();
          if (val === null || val === undefined) {
            td.textContent = "—";
          } else if (typeof val === "object") {
            td.textContent = JSON.stringify(val);
          } else {
            var s = String(val);
            td.textContent = c.truncate ? utils.truncate(s, c.truncate) : s;
          }
        });
      });
      return table;
    },

    expandableList: function (data, patternId, opts) {
      if (!data || !data._table_patterns || !data._resolved) return null;
      opts = opts || {};

      var pattern = null;
      for (var i = 0; i < data._table_patterns.length; i++) {
        var p = data._table_patterns[i];
        if (p && (p.pattern_id === patternId || (p.rows && p.rows.source_field === patternId))) {
          pattern = p;
          break;
        }
      }
      if (!pattern || !pattern.rows) return null;

      var rowIds = data[pattern.rows.source_field];
      if (!Array.isArray(rowIds) || rowIds.length === 0) return null;

      var resolved = data._resolved;
      var section = utils.el("div", "sb-expandable-list-section");
      var heading = pattern.section_heading || utils.titleCase(pattern.rows.source_field);
      section.appendChild(utils.el("h2", "", heading));

      var storagePrefix = "sb-expand|" + (opts.pageId || "page") + "|" + patternId + "|";

      rowIds.forEach(function (rowId) {
        var rid = String(rowId || "").trim();
        var rowObj = resolved[rid] || { id: rid, _unresolved: true };
        var rowTitle = rowObj.title || rowObj.label || rowObj.id || rid;

        var group = utils.el("div", "sb-elist-group");
        var rowEl = utils.el("div", "sb-elist-row");

        var titleEl = utils.el("span", "sb-elist-title", String(rowTitle));
        rowEl.appendChild(titleEl);

        if (rowObj.status) {
          rowEl.appendChild(utils.badge(rowObj.status, "sb-status-badge"));
        }

        group.appendChild(rowEl);

        if (pattern.rows.nested && rowObj._resolved) {
          var nestedSpec = pattern.rows.nested;
          var childIds = rowObj[nestedSpec.source_field];
          if (Array.isArray(childIds) && childIds.length > 0) {
            var childContainer = utils.el("div", "sb-elist-children");
            var isOpen = utils.readExpandState(storagePrefix + rid) === true;
            childContainer.setAttribute("aria-hidden", isOpen ? "false" : "true");
            if (!isOpen) childContainer.style.display = "none";

            childIds.forEach(function (childId) {
              var cid = String(childId || "").trim();
              var childObj = rowObj._resolved[cid] || { id: cid, _unresolved: true };
              var childTitle = childObj.title || childObj.label || childObj.id || cid;
              var childRow = utils.el("div", "sb-elist-child-row");
              childRow.appendChild(utils.el("span", "sb-elist-child-title", String(childTitle)));
              if (childObj.status) {
                childRow.appendChild(utils.badge(childObj.status, "sb-status-badge"));
              }
              childContainer.appendChild(childRow);
            });

            group.appendChild(childContainer);

            rowEl.style.cursor = "pointer";
            rowEl.addEventListener("click", (function (container, key) {
              return function () {
                var hidden = container.style.display === "none";
                container.style.display = hidden ? "" : "none";
                container.setAttribute("aria-hidden", hidden ? "false" : "true");
                utils.writeExpandState(key, hidden);
              };
            })(childContainer, storagePrefix + rid));
          }
        }

        section.appendChild(group);
      });

      return section;
    }
  };

  return {
    register: register,
    registerListRenderer: registerListRenderer,
    getListRenderer: getListRenderer,
    getPageRenderer: getPageRenderer,
    dispatch: dispatch,
    utils: utils,
    components: components
  };
})();

document.addEventListener("DOMContentLoaded", function () { SpecBuilderRendererRegistry.dispatch(); });
document.addEventListener("navigation:complete", function () { SpecBuilderRendererRegistry.dispatch(); });
document.addEventListener("turbo:load", function () { SpecBuilderRendererRegistry.dispatch(); });
