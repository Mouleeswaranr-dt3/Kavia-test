/**
 * Spec Builder custom rendering for MkDocs Material.
 *
 * Implements page-wide enhancement behaviors that are shared across Spec Builder
 * pages and remain useful after the move to per-artifact registry-based
 * renderers:
 * - injectArtifactMetadata(): copy sb-artifact-type / sb-artifact-id meta tags
 *   onto <body data-sb-*> attributes for shared JS access.
 * - initExpandableSections(): persist <details> open/closed state
 *   using localStorage.
 * - renderCoverageGauges(): render coverage bars based on data-coverage.
 *
 * Phase 2 (Proposal A): The legacy inline renderEpicsTable() function has been
 * removed. Artifact-specific page rendering is handled exclusively by
 * spec-builder-renderer-registry.js and the per-type renderers (roadmap_item.js, epic.js,
 * user_story.js, test_case.js, generic_artifact.js). The deprecated Approach E
 * code path has been fully superseded.
 *
 * Reusable utilities (injectMetaToBodyAttributes, initExpandableSections) are
 * kept here as page-wide enhancements that run alongside the registry-based
 * per-type renderers.
 */

/* global localStorage */

// PUBLIC_INTERFACE
/**
 * Initialise Spec Builder page-wide rendering enhancements for the current page.
 *
 * Safe to call multiple times; functions are idempotent per element.
 */
function initSpecBuilderRendering() {
  injectArtifactMetadata();
  initExpandableSections();
  renderCoverageGauges();
}

// PUBLIC_INTERFACE
/**
 * Copy artifact metadata from <meta> tags into <body data-sb-*> for easy access
 * by other JS helpers and renderers.
 *
 * This mirrors the proposal's sb-artifact-type / sb-artifact-id DOM-carry pattern.
 */
function injectArtifactMetadata() {
  var typeMeta = document.querySelector('meta[name="sb-artifact-type"]');
  if (typeMeta && typeMeta.getAttribute("content")) {
    document.body.setAttribute("data-sb-type", typeMeta.getAttribute("content"));
  }

  var idMeta = document.querySelector('meta[name="sb-artifact-id"]');
  if (idMeta && idMeta.getAttribute("content")) {
    document.body.setAttribute("data-sb-id", idMeta.getAttribute("content"));
  }
}

// PUBLIC_INTERFACE
/**
 * Persist open/closed state of expandable sections (details blocks) marked with:
 * - class="sb-expandable-section"
 * - data-section-id="<stable-id>"
 *
 * Storage key is namespaced by page (sb-type + sb-id when present) to avoid collisions.
 */
function initExpandableSections() {
  var sections = document.querySelectorAll("details.sb-expandable-section");
  if (!sections || !sections.length) return;

  var pageType = document.body.getAttribute("data-sb-type") || "unknown-type";
  var pageId = document.body.getAttribute("data-sb-id") || "unknown-id";
  var pageKeyPrefix = "sb-expand|" + pageType + "|" + pageId + "|";

  sections.forEach(function (section) {
    // Avoid double-binding.
    if (section.getAttribute("data-sb-expand-init") === "1") return;
    section.setAttribute("data-sb-expand-init", "1");

    var sectionId = section.getAttribute("data-section-id");
    if (!sectionId) return;

    var key = pageKeyPrefix + sectionId;

    try {
      var stored = localStorage.getItem(key);
      if (stored === "open") {
        section.setAttribute("open", "");
      } else if (stored === "closed") {
        section.removeAttribute("open");
      }
    } catch (e) {
      // Ignore storage errors (private mode / blocked storage).
    }

    section.addEventListener("toggle", function () {
      try {
        localStorage.setItem(key, section.open ? "open" : "closed");
      } catch (e) {
        // Ignore storage errors.
      }
    });
  });
}

// PUBLIC_INTERFACE
/**
 * Render coverage gauges for elements with:
 * - class="sb-coverage-gauge"
 * - data-coverage="<0..100>"
 *
 * Produces a simple inner bar with threshold coloring.
 */
function renderCoverageGauges() {
  var gauges = document.querySelectorAll(".sb-coverage-gauge");
  if (!gauges || !gauges.length) return;

  gauges.forEach(function (gauge) {
    if (gauge.getAttribute("data-sb-coverage-init") === "1") return;
    gauge.setAttribute("data-sb-coverage-init", "1");

    var raw = gauge.getAttribute("data-coverage");
    var pct = parseFloat(raw || "0");
    if (isNaN(pct)) pct = 0;
    pct = Math.max(0, Math.min(100, pct));

    var color = "#b26a00"; // amber (default)
    if (pct >= 80) color = "#0b6b3a"; // green
    else if (pct < 50) color = "#b42318"; // red

    // Ensure bar element exists.
    var bar = gauge.querySelector(".sb-coverage-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "sb-coverage-bar";
      gauge.appendChild(bar);
    }

    bar.style.width = pct + "%";
    bar.style.background = color;

    // Add a tooltip if not present.
    if (!gauge.getAttribute("title")) {
      gauge.setAttribute("title", "Coverage: " + pct.toFixed(0) + "%");
    }
  });
}

/* -----------------------------------------------------------------------------
Event hooks
----------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  initSpecBuilderRendering();
});

// MkDocs Material instant loading events (best-effort).
document.addEventListener("navigation:complete", function () {
  initSpecBuilderRendering();
});
document.addEventListener("turbo:load", function () {
  initSpecBuilderRendering();
});
