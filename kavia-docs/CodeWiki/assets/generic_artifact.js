/**
 * Spec Builder Generic Artifact renderer for MkDocs Material.
 *
 * Provides schema-agnostic rendering of any JSON artifact type that does
 * not have a dedicated per-type renderer registered. This replaces the
 * server-side json_to_markdown() fallback for unknown JSON structures.
 *
 * Phase 2 (Proposal A): Enhanced with `_table_patterns` support so artifact
 * types without a dedicated renderer still get expandable cross-artifact
 * tables when patterns are declared in the registry.
 *
 * Renders:
 *  - Key/value summary table for scalar fields
 *  - Cross-artifact expandable lists from _table_patterns (Phase 2)
 *  - Bullet lists for scalar arrays
 *  - Expandable sections for nested objects
 *  - Compact tables for arrays of objects (table-like arrays)
 *
 * Registered with SpecBuilderRendererRegistry as "generic".
 *
 * @see kavia-docs/CodeWiki/Specs/DetailedDesigns/client-side-json-rendering-per-page-js-css.md
 */

/* global SpecBuilderRendererRegistry */

(function () {
  "use strict";

  var u = SpecBuilderRendererRegistry.utils;
  var c = SpecBuilderRendererRegistry.components;

  // Keys handled by dedicated rendering logic; excluded from the generic
  // scalar/complex field rendering to avoid duplication.
  var _INTERNAL_KEYS = new Set([
    "_resolved", "_table_patterns"
  ]);

  /**
   * Heuristic: is this string likely a CodeWiki internal link?
   * @param {string} s - Candidate string.
   * @returns {boolean}
   */
  function _looksLikeCodeWikiPath(s) {
    return typeof s === "string" && s.indexOf("kavia-docs/CodeWiki/") === 0;
  }

  /**
   * Render a scalar value; CodeWiki paths become links.
   * @param {*} val - Value.
   * @returns {HTMLElement}
   */
  function _renderScalarValue(val) {
    var s = String(val);
    if (_looksLikeCodeWikiPath(s)) {
      var a = document.createElement("a");
      a.className = "sb-trace-link";
      a.href = u.normalizeLink(s);
      a.textContent = s.replace("kavia-docs/CodeWiki/", "");
      return a;
    }
    return u.el("span", "", s);
  }

  /**
   * Heuristic: is this an array of objects renderable as a table?
   * @param {*} val - JSON value.
   * @returns {boolean}
   */
  function _isTableArray(val) {
    if (!Array.isArray(val) || val.length === 0) return false;
    return val.every(function (item) {
      return item !== null && typeof item === "object" && !Array.isArray(item);
    });
  }

  /**
   * Heuristic: is this a list of scalars?
   * @param {*} val - JSON value.
   * @returns {boolean}
   */
  function _isScalarList(val) {
    if (!Array.isArray(val) || val.length === 0) return false;
    return val.every(function (item) {
      return typeof item !== "object" || item === null;
    });
  }

  /**
   * Render a scalar list as chips or bullet list.
   * @param {Array} items - Scalar items.
   * @returns {HTMLElement}
   */
  function _renderScalarList(items) {
    var allShort = items.every(function (i) { return String(i).length < 40; });
    if (allShort && items.length <= 20) {
      var container = u.el("div", "sb-tags-container");
      items.forEach(function (item) {
        container.appendChild(u.el("span", "spec-builder-tag", String(item)));
      });
      return container;
    }
    var list = u.el("ul");
    items.forEach(function (item) {
      list.appendChild(u.el("li", "", String(item)));
    });
    return list;
  }

  /**
   * Render an array of objects as a table.
   * @param {Array<Object>} rows - Array of objects.
   * @param {string} [tableKey] - The key this array was found under.
   * @returns {HTMLElement}
   */
  function _renderObjectArrayTable(rows, tableKey) {
    var colSet = {};
    rows.forEach(function (row) {
      Object.keys(row).forEach(function (k) { colSet[k] = true; });
    });
    var columns = Object.keys(colSet);

    var table = u.el("table", "sb-generic-table");
    if (tableKey) table.setAttribute("aria-label", u.titleCase(tableKey));
    var thead = table.createTHead();
    var hRow = thead.insertRow();
    columns.forEach(function (col) {
      hRow.appendChild(u.el("th", "", u.titleCase(col)));
    });

    var tbody = table.createTBody();
    rows.forEach(function (row) {
      var tr = tbody.insertRow();
      columns.forEach(function (col) {
        var td = tr.insertCell();
        var val = row[col];
        if (val === null || val === undefined) {
          td.textContent = "—";
        } else if (typeof val === "object") {
          td.textContent = JSON.stringify(val);
        } else {
          td.appendChild(_renderScalarValue(val));
        }
      });
    });

    return table;
  }

  /**
   * Render a nested object as an expandable details block.
   * @param {string} key - Property name.
   * @param {Object} obj - Nested object.
   * @param {number} depth - Recursion depth.
   * @returns {HTMLElement}
   */
  function _renderNestedObject(key, obj, depth) {
    var details = document.createElement("details");
    details.className = "sb-expandable-section";
    details.setAttribute("data-section-id", "generic-" + key + "-" + depth);

    var summary = document.createElement("summary");
    summary.textContent = u.titleCase(key);
    details.appendChild(summary);

    var body = u.el("div", "sb-expandable-body");
    if (depth >= 5) {
      var pre = u.el("pre", "sb-json-value");
      pre.textContent = JSON.stringify(obj, null, 2);
      body.appendChild(pre);
    } else {
      _renderObjectFields(body, obj, depth + 1);
    }
    details.appendChild(body);

    return details;
  }

  /**
   * Collect source fields consumed by declared _table_patterns so we avoid
   * rendering those same ID arrays twice.
   * @param {Array<Object>} patterns - Declared patterns.
   * @returns {Set<string>}
   */
  function _collectPatternSourceFields(patterns) {
    var fields = new Set();
    if (!Array.isArray(patterns)) return fields;

    patterns.forEach(function (pattern) {
      if (pattern && pattern.rows && pattern.rows.source_field) {
        fields.add(String(pattern.rows.source_field));
      }
    });

    return fields;
  }

  /**
   * Render the fields of an object recursively.
   * @param {HTMLElement} container - Target container.
   * @param {Object} obj - Object to render.
   * @param {number} depth - Current recursion depth.
   */
  function _renderObjectFields(container, obj, depth) {
    var scalarRows = [];
    var patternFields = _collectPatternSourceFields(obj && obj._table_patterns);

    Object.keys(obj || {}).forEach(function (key) {
      if (_INTERNAL_KEYS.has(key) || patternFields.has(key)) return;
      var val = obj[key];
      if (val === null || val === undefined || val === "") return;

      var isScalar = typeof val !== "object" || val === null;
      if (isScalar) {
        scalarRows.push({ key: key, value: val });
        return;
      }

      var section = u.el("div", "sb-generic-section");
      section.appendChild(u.el("h2", "", u.titleCase(key)));

      if (_isScalarList(val)) {
        section.appendChild(_renderScalarList(val));
      } else if (_isTableArray(val)) {
        section.appendChild(_renderObjectArrayTable(val, key));
      } else if (Array.isArray(val)) {
        var pre = u.el("pre", "sb-json-value");
        pre.textContent = JSON.stringify(val, null, 2);
        section.appendChild(pre);
      } else {
        section.appendChild(_renderNestedObject(key, val, depth));
      }

      container.appendChild(section);
    });

    if (scalarRows.length > 0) {
      var table = u.el("table", "sb-summary-table");
      table.setAttribute("aria-label", "Artifact details");
      var thead = table.createTHead();
      var hRow = thead.insertRow();
      hRow.appendChild(u.el("th", "", "Field"));
      hRow.appendChild(u.el("th", "", "Value"));

      var tbody = table.createTBody();
      scalarRows.forEach(function (row) {
        var tr = tbody.insertRow();
        tr.insertCell().textContent = u.titleCase(row.key);
        var td = tr.insertCell();
        td.appendChild(_renderScalarValue(row.value));
      });

      container.appendChild(table);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Render a generic artifact page with schema-agnostic logic.
   *
   * @param {HTMLElement} root - Page root.
   * @param {Object} data - Artifact JSON.
   */
  function renderGenericPage(root, data) {
    if (!data || typeof data !== "object") {
      root.innerHTML = "<p><em>No artifact data available.</em></p>";
      return;
    }

    if (data.type) {
      var badgeWrap = u.el("div", "sb-tags-container");
      badgeWrap.appendChild(u.badge(String(data.type), "sb-badge"));
      root.appendChild(badgeWrap);
    }

    if (Array.isArray(data._table_patterns) && data._resolved) {
      data._table_patterns.forEach(function (pattern) {
        if (!pattern || !pattern.pattern_id) return;
        var section = c.expandableList(data, pattern.pattern_id, {
          pageId: (data.id || data.title || "artifact").toString()
        });
        if (section) {
          root.appendChild(section);
        }
      });
    }

    _renderObjectFields(root, data, 0);
  }

  // PUBLIC_INTERFACE
  /**
   * Render a generic embedded/list view.
   *
   * @param {HTMLElement} container - Container element.
   * @param {Array|Object} value - Value to render.
   */
  function renderGenericList(container, value) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        container.innerHTML = "<p><em>(no items)</em></p>";
        return;
      }
      if (_isTableArray(value)) {
        container.appendChild(_renderObjectArrayTable(value));
        return;
      }
      if (_isScalarList(value)) {
        container.appendChild(_renderScalarList(value));
        return;
      }
    }

    var pre = u.el("pre", "sb-json-value");
    pre.textContent = JSON.stringify(value, null, 2);
    container.appendChild(pre);
  }

  SpecBuilderRendererRegistry.register("generic", renderGenericPage);
  SpecBuilderRendererRegistry.registerListRenderer("generic", renderGenericList);
})();
