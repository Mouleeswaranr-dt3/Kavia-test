/**
 * Shared Spec Builder client-side rendering helpers for MkDocs Material.
 */

/* global SpecBuilderRendererRegistry */

(function () {
  "use strict";

  var u = SpecBuilderRendererRegistry.utils;
  var c = SpecBuilderRendererRegistry.components;

  /**
   * Normalize a Spec Builder artifact identifier into a human-readable label.
   *
   * @param {string} id - Raw identifier or slug.
   * @returns {string} Title-cased label.
   */
  function slugToLabel(id) {
    return u.slugToLabel(id);
  }

  /**
   * Build a browser-correct relative href for a Spec Builder artifact page.
   *
   * @param {string} kind - Artifact directory name.
   * @param {string} id - Artifact identifier.
   * @returns {string} Relative href.
   */
  function inferArtifactLink(kind, id) {
    return u.inferLink(kind, id);
  }

  /**
   * Resolve a CodeWiki-rooted Markdown link into a browser-correct href.
   *
   * @param {string} link - Raw link path.
   * @returns {string} Normalized href.
   */
  function resolveCodeWikiLink(link) {
    return u.normalizeLink(link);
  }

  /**
   * Normalize any href (CodeWiki-rooted paths, or passthrough).
   * @param {string} href - Raw href.
   * @returns {string} Normalized href.
   */
  function normalizeHref(href) {
    if (!href) return "#";
    return u.normalizeLink(String(href));
  }

  /**
   * Build a standard Spec Builder summary table.
   *
   * @param {Object} data - Artifact payload.
   * @param {string[]} summaryKeys - Keys to render in order.
   * @param {string} ariaLabel - Accessible label for the table.
   * @param {Object} [options] - Optional render overrides.
   * @returns {HTMLElement} Summary table element.
   */
  function buildSummaryTable(data, summaryKeys, ariaLabel, options) {
    return c.summaryTable(data, summaryKeys, {
      ariaLabel: ariaLabel,
      customRenderers: (options || {}).customRenderers
    });
  }

  /**
   * Build a standard heading + paragraph section when a value exists.
   *
   * @param {string} title - Section heading.
   * @param {string} text - Body text.
   * @param {string} className - Wrapper class.
   * @returns {HTMLElement|null} Section element or null.
   */
  function buildTextSection(title, text, className) {
    return c.descriptionSection(text) || null;
  }

  /**
   * Build a bullet-list section from an array of scalar values.
   *
   * @param {string} title - Section heading.
   * @param {Array} items - List items.
   * @param {string} [listClassName] - Optional class for the list.
   * @returns {HTMLElement|null} Section element or null.
   */
  function buildScalarListSection(title, items, listClassName) {
    if (!Array.isArray(items) || items.length === 0) return null;
    var section = u.el("div", "sb-list-section");
    section.appendChild(u.el("h2", "", title));
    var list = u.el("ul", listClassName || "");
    items.forEach(function (item) {
      list.appendChild(u.el("li", "", String(item)));
    });
    section.appendChild(list);
    return section;
  }

  /**
   * Build a linked ID list section.
   * Delegates to SpecBuilderRendererRegistry.components.linkedIdList().
   *
   * @param {string} title - Section heading.
   * @param {Array<string>} ids - Artifact identifiers.
   * @param {string} kind - Artifact directory name.
   * @param {Object} [options] - Optional label/link overrides.
   * @returns {HTMLElement|null} Section element or null.
   */
  function buildLinkedIdList(title, ids, kind, options) {
    return c.linkedIdList(title, ids, kind);
  }

  /**
   * Build a JIRA/external-link section.
   *
   * @param {string} title - Section heading.
   * @param {string} jiraUrl - Link URL.
   * @param {string} wrapperClassName - Wrapper class.
   * @param {string} linkClassName - Link class.
   * @returns {HTMLElement|null} Section element or null.
   */
  function buildExternalLinkSection(title, jiraUrl, wrapperClassName, linkClassName) {
    return c.externalLinkSection(title, jiraUrl, {
      wrapperClass: wrapperClassName,
      linkClass: linkClassName
    });
  }

  SpecBuilderRendererRegistry.components = SpecBuilderRendererRegistry.components || {};
  SpecBuilderRendererRegistry.utils = SpecBuilderRendererRegistry.utils || {};

  SpecBuilderRendererRegistry.utils.slugToLabel = SpecBuilderRendererRegistry.utils.slugToLabel || slugToLabel;
  SpecBuilderRendererRegistry.utils.inferArtifactLink = SpecBuilderRendererRegistry.utils.inferArtifactLink || inferArtifactLink;
  SpecBuilderRendererRegistry.utils.resolveCodeWikiLink = SpecBuilderRendererRegistry.utils.resolveCodeWikiLink || resolveCodeWikiLink;
  SpecBuilderRendererRegistry.utils.normalizeHref = SpecBuilderRendererRegistry.utils.normalizeHref || normalizeHref;

  SpecBuilderRendererRegistry.components.buildSummaryTable =
    SpecBuilderRendererRegistry.components.buildSummaryTable || buildSummaryTable;
  SpecBuilderRendererRegistry.components.buildTextSection =
    SpecBuilderRendererRegistry.components.buildTextSection || buildTextSection;
  SpecBuilderRendererRegistry.components.buildScalarListSection =
    SpecBuilderRendererRegistry.components.buildScalarListSection || buildScalarListSection;
  SpecBuilderRendererRegistry.components.buildLinkedIdList =
    SpecBuilderRendererRegistry.components.buildLinkedIdList || buildLinkedIdList;
  SpecBuilderRendererRegistry.components.buildExternalLinkSection =
    SpecBuilderRendererRegistry.components.buildExternalLinkSection || buildExternalLinkSection;
})();
