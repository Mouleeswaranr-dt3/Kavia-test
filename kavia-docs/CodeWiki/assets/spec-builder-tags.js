/**
 * Spec Builder tag helpers for MkDocs Material.
 *
 * Responsibilities:
 * 1) Backward compatible behavior:
 *    - Transform `.spec-builder-tag-mark` elements into styled `.spec-builder-tag` chips.
 * 2) Proposal sb-* convenience (non-invasive):
 *    - If authors create placeholder spans like <span data-sb-status="draft">draft</span>,
 *      upgrade them to `.sb-status-badge` / `.sb-priority-indicator`.
 *
 * Primary/official way to apply sb-* tags is via Markdown attr_list:
 *   `draft`{:.sb-status-badge data-status="draft"}
 */

// PUBLIC_INTERFACE
/**
 * Initialize Spec Builder tag transformations on the current page.
 */
function initSpecBuilderTags() {
  // Tag chips: .spec-builder-tag-mark => span.spec-builder-tag
  var tagElements = document.querySelectorAll(".spec-builder-tag-mark");
  tagElements.forEach(function (el) {
    var tag = el.getAttribute("data-tag");
    var category = el.getAttribute("data-tag-category");
    var classList = "spec-builder-tag";
    if (category) classList += " spec-builder-tag-" + category;
    var span = document.createElement("span");
    span.className = classList;
    if (category) span.setAttribute("data-tag-category", category);
    span.textContent = tag || el.textContent;
    el.replaceWith(span);
  });

  // Convenience upgrades (optional patterns; HTML spans with classes are preferred)
  document.querySelectorAll("[data-sb-status]").forEach(function (el) {
    if (el.classList.contains("sb-status-badge")) return;
    el.classList.add("sb-status-badge");
    el.setAttribute("data-status", el.getAttribute("data-sb-status"));
  });

  document.querySelectorAll("[data-sb-priority]").forEach(function (el) {
    if (el.classList.contains("sb-priority-indicator")) return;
    el.classList.add("sb-priority-indicator");
    el.setAttribute("data-priority", el.getAttribute("data-sb-priority"));
  });

  // Ensure sb-status-badge elements inside tables have data-status set from text content
  // when the attribute was not explicitly provided (defensive fallback).
  document.querySelectorAll(".sb-status-badge:not([data-status])").forEach(function (el) {
    var text = (el.textContent || "").trim();
    if (text) {
      el.setAttribute("data-status", text);
    }
  });

  document.querySelectorAll(".sb-priority-indicator:not([data-priority])").forEach(function (el) {
    var text = (el.textContent || "").trim();
    if (text) {
      el.setAttribute("data-priority", text);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initSpecBuilderTags();
});

// MkDocs Material instant loading events (best-effort).
document.addEventListener("navigation:complete", function () {
  initSpecBuilderTags();
});
document.addEventListener("turbo:load", function () {
  initSpecBuilderTags();
});
