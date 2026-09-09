(function () {
  "use strict";

  /**
   * CodeWiki Mermaid initializer:
   * - Renders Mermaid diagrams in MkDocs Material pages.
   * - Adapts theme to Material palette (light/dark), with a runtime bridge emitted by overrides/main.html.
   * - Supports re-render on "instant navigation" and palette changes.
   * - Adds fullscreen viewing and some developer-friendly debug toggles.
   *
   * This file is intentionally self-contained and does not depend on any bundler.
   */

  function safeGet(obj, path, fallback) {
    try {
      var cur = obj;
      for (var i = 0; i < path.length; i++) {
        if (!cur) return fallback;
        cur = cur[path[i]];
      }
      return cur === undefined ? fallback : cur;
    } catch (e) {
      return fallback;
    }
  }

  function decodeHtmlEntities(s) {
    try {
      var txt = document.createElement("textarea");
      txt.innerHTML = s;
      return txt.value;
    } catch (e) {
      return s;
    }
  }

  function isDebugEnabled() {
    try {
      if (window.__CODEWIKI_DEBUG__) return true;
      if (typeof localStorage !== "undefined" && localStorage.getItem("CODEWIKI_DEBUG_MERMAID") === "1") return true;
    } catch (e) {
      // ignore
    }
    return false;
  }

  function logDebug() {
    if (!isDebugEnabled()) return;
    try {
      // eslint-disable-next-line no-console
      console.log.apply(console, arguments);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Always-on warning logger used for render errors so CSS/syntax issues surface
   * in the browser console even when verbose debug mode is not enabled.
   */
  function logWarn() {
    try {
      // eslint-disable-next-line no-console
      console.warn.apply(console, arguments);
    } catch (e) {
      // ignore
    }
  }


  function getCodeWikiRuntimeConfig() {
    try {
      return window.__CODEWIKI_RUNTIME__ || {};
    } catch (e) {
      return {};
    }
  }

  function getMaterialScheme() {
    // Prefer the runtime bridge from overrides/main.html, fall back to html[data-md-color-scheme]
    try {
      var cfg = getCodeWikiRuntimeConfig();
      var scheme = safeGet(cfg, ["palette", "scheme"], null);
      if (scheme) return String(scheme);
    } catch (e) {
      // ignore
    }

    try {
      var html = document && document.documentElement;
      var s = html && html.getAttribute("data-md-color-scheme");
      if (s) return String(s);
    } catch (e) {
      // ignore
    }

    return "default";
  }

  function getResolvedPalette() {
    try {
      var cfg = getCodeWikiRuntimeConfig();
      if (cfg && typeof cfg.resolvePalette === "function") cfg.resolvePalette();
      var resolved = safeGet(cfg, ["palette", "resolved"], null);
      return resolved || null;
    } catch (e) {
      return null;
    }
  }

  function getMermaidThemeForMaterial() {
    // Material uses "default" for light and "slate" for dark by default.
    var scheme = getMaterialScheme();
    var isDark = String(scheme).toLowerCase() === "slate";
    return isDark ? "dark" : "default";
  }

  function ensureMermaidLoaded() {
    if (window.mermaid) return true;
    logDebug("[CodeWiki][Mermaid] mermaid library not found on window.");
    return false;
  }

  /**
   * Mermaid v10 can be loaded in different shapes depending on the CDN/build:
   * - UMD-like: window.mermaid.initialize(...)
   * - ESM-ish global shim: window.mermaid.default.initialize(...)
   *
   * We normalize to the object that actually contains initialize/render.
   */
  function getMermaidApi() {
    try {
      var m = window.mermaid;
      if (!m) return null;
      // Some builds expose the API under `.default`.
      if (m && !m.initialize && m.default && (m.default.initialize || m.default.render)) {
        return m.default;
      }
      return m;
    } catch (e) {
      return null;
    }
  }

  function waitForMermaidGlobal(maxAttempts, delayMs) {
    return new Promise(function (resolve) {
      var attempts = 0;

      function tick() {
        attempts += 1;
        if (ensureMermaidLoaded()) {
          resolve(true);
          return;
        }

        if (attempts >= maxAttempts) {
          resolve(false);
          return;
        }

        window.setTimeout(tick, delayMs);
      }

      tick();
    });
  }

  function pickThemeVariables() {
    // Best-effort: read computed Material vars from runtime bridge.
    var resolved = getResolvedPalette();
    if (!resolved) return null;

    // Mermaid theme variables (subset) - keep conservative defaults.
    var vars = {
      primaryColor: resolved.primary || undefined,
      primaryTextColor: resolved.fg || undefined,
      lineColor: resolved.fgMuted || resolved.fg || undefined,
      background: resolved.bgElevated || resolved.bg || undefined,
      tertiaryColor: resolved.accent || undefined,
    };
    return vars;
  }

  function initMermaidOnce() {
    if (!ensureMermaidLoaded()) return;

    var mermaidApi = getMermaidApi();
    if (!mermaidApi) return;

    var theme = getMermaidThemeForMaterial();
    var themeVariables = pickThemeVariables();

    var cfg = {
      startOnLoad: false,
      theme: theme,
      securityLevel: "loose",
    };

    if (themeVariables) {
      cfg.themeVariables = themeVariables;
    }

    try {
      // Diagnostic: if Mermaid has already auto-processed nodes (the pre-processing race),
      // warn so it's visible in the console. The early-capture guard in overrides/main.html
      // stubs window.mermaid.startOnLoad=false before the CDN script loads, which should
      // prevent this, but we log it here in case the stub didn't take effect.
      var alreadyRendered = document.querySelectorAll
        ? document.querySelectorAll("[data-processed='true']").length
        : 0;
      if (alreadyRendered > 0) {
        logDebug(
          "[CodeWiki][Mermaid] WARNING: " + alreadyRendered + " node(s) already have data-processed=true " +
          "before initMermaidOnce ran. This means Mermaid auto-initialized before our script. " +
          "The early-capture guard should have saved data-original-code on those nodes for recovery."
        );
      }

      if (typeof mermaidApi.initialize !== "function") {
        // Critical: do NOT throw here. Mermaid init is optional for the rest of the CodeWiki UI,
        // and crashing the page breaks the Artifact Configurator preview (JSON/Markdown rendering).
        logWarn(
          "[CodeWiki][Mermaid] Mermaid initialize() is not available on the loaded Mermaid global. " +
          "Skipping initialization to avoid breaking the page.",
          "typeof initialize=" + typeof mermaidApi.initialize
        );
        return;
      }

      mermaidApi.initialize(cfg);
      logDebug("[CodeWiki][Mermaid] Initialized with:", cfg);
    } catch (e) {
      logDebug("[CodeWiki][Mermaid] initialize error:", e);
    }
  }

  function collectMermaidNodes(root) {
    var r = root || document;
    var nodes = [];
    try {
      // Supported inputs:
      //  1) <div class="mermaid">...</div>
      //  2) <pre><code class="language-mermaid">...</code></pre> (Material-native superfence output)
      //  3) <pre><code class="mermaid">...</code></pre> (legacy/common markdown fence style)
      //  3) <pre class="mermaid"><code>...</code></pre> (as seen in CodeWiki-generated HTML)
      //  4) <pre class="mermaid">...</pre> (defensive)
      //
      // NOTE: We also support broken MkDocs HTML emissions where the mermaid fence is split
      // across adjacent sibling nodes. See repairParagraphFences() for the recovery path.
      var SELECTOR = "div.mermaid, pre > code.language-mermaid, pre > code.mermaid, pre.mermaid > code, pre.mermaid";
      nodes = Array.from(r.querySelectorAll(SELECTOR));
      logDebug(
        "[CodeWiki][Mermaid] collectMermaidNodes: raw selector matches =",
        nodes.length,
        "root=",
        (r === document ? "document" : (r.tagName || "node"))
      );

      // If nothing matched, optionally probe the DOM to explain what wrappers MkDocs emitted.
      // This is useful during investigations but is intentionally gated behind debug to keep
      // normal console output clean.
      if (!nodes.length && isDebugEnabled()) {
        try {
          var probeCounts = {
            selector: SELECTOR,
            "div.highlight": r.querySelectorAll ? r.querySelectorAll("div.highlight").length : 0,
            "div.highlight pre": r.querySelectorAll ? r.querySelectorAll("div.highlight pre").length : 0,
            "div.highlight code": r.querySelectorAll ? r.querySelectorAll("div.highlight code").length : 0,
            "pre > code": r.querySelectorAll ? r.querySelectorAll("pre > code").length : 0,
            "pre": r.querySelectorAll ? r.querySelectorAll("pre").length : 0,
            "code": r.querySelectorAll ? r.querySelectorAll("code").length : 0,
            "code[class*='language-']": r.querySelectorAll ? r.querySelectorAll("code[class*='language-']").length : 0,
            "[class*='mermaid']": r.querySelectorAll ? r.querySelectorAll("[class*='mermaid']").length : 0,
          };
          logDebug("[CodeWiki][Mermaid] collectMermaidNodes: probeCounts =", probeCounts);
        } catch (probeErr) {
          logDebug("[CodeWiki][Mermaid] collectMermaidNodes: probe error:", probeErr);
        }
      }

      // Deduplicate: when <pre class="mermaid"><code> is present, BOTH "pre.mermaid > code"
      // and "pre.mermaid" are matched by the selector above. Processing both causes the <pre>
      // to become a detached orphan (its <code> handler replaces the whole <pre> in the DOM
      // first), and Mermaid's render() then fails on the detached node — reported as a syntax
      // error. Fix: drop any <code> node whose immediate parent <pre class="mermaid"> is also
      // in the matched set, so only the outer <pre> is processed.
      var nodeSet = typeof Set !== "undefined" ? new Set(nodes) : null;
      if (nodeSet) {
        nodes = nodes.filter(function (n) {
          if (!n || !n.tagName) return true;
          var tag = n.tagName.toLowerCase();
          if (tag !== "code") return true;
          var parent = n.parentElement;
          if (!parent) return true;
          var parentTag = parent.tagName ? parent.tagName.toLowerCase() : "";
          if (parentTag === "pre" && parent.classList && parent.classList.contains("mermaid")) {
            // Parent pre.mermaid is also in the matched set — keep only the <pre>, drop <code>
            return !nodeSet.has(parent);
          }
          return true;
        });
      }
      logDebug("[CodeWiki][Mermaid] collectMermaidNodes: after dedupe =", nodes.length);

      // Exclude (or recover) nodes that Mermaid has already processed/rendered:
      //  - Mermaid sets data-processed="true" on divs it has already rendered (v9+).
      //  - Nodes whose innerHTML contains rendered SVG/CSS output (error-rendered state) must
      //    also be excluded unless we can recover the original source from data-original-code.
      //  - Recovery: if the early-capture script saved data-original-code before Mermaid ran,
      //    we restore the source text, remove data-processed, and include the node for rendering.
      nodes = nodes.filter(function (n) {
        if (!n) return false;

        // Mermaid v9/v10 marks processed nodes with data-processed="true".
        // Recovery path: if the early-capture guard saved the original source in
        // data-original-code (set by overrides/main.html before Mermaid CDN loaded),
        // we can restore it and include the node for re-rendering.
        if (n.getAttribute && n.getAttribute("data-processed") === "true") {
          var savedSrc = n.getAttribute ? n.getAttribute("data-original-code") : "";
          var earlyCaptured = n.getAttribute ? n.getAttribute("data-codewiki-early-captured") : "";

          if (savedSrc && savedSrc.trim()) {
            // Restore the original source text so normalizeMermaidSource() works correctly.
            try {
              n.textContent = savedSrc;
            } catch (restoreErr) { /* ignore */ }
            // Remove data-processed so Mermaid's own guards don't re-skip this node.
            try {
              n.removeAttribute("data-processed");
            } catch (e) { /* ignore */ }
            // Remove our rendered marker too so the render loop processes this node.
            try {
              n.removeAttribute("data-codewiki-mermaid-rendered");
            } catch (e) { /* ignore */ }
            logDebug(
              "[CodeWiki][Mermaid] collectMermaidNodes: recovered already-processed node using saved data-original-code" +
              (earlyCaptured ? " (early-captured)" : "") + ".",
              n.tagName, n.className,
              "source preview:", JSON.stringify(savedSrc.slice(0, 80))
            );
            return true;
          }

          // No saved source — cannot recover. Log and exclude.
          logDebug(
            "[CodeWiki][Mermaid] collectMermaidNodes: excluding already-processed node (data-processed=true, no saved source).",
            n.tagName, n.className,
            "\n  Tip: the early-capture guard in overrides/main.html should have saved data-original-code.",
            "\n  If you see this, the early-capture script may not have run before Mermaid auto-processed the node."
          );
          return false;
        }

        // If the node already contains a <svg> child, Mermaid has rendered it.
        // Recovery path: same as above — check for saved source.
        if (n.querySelector && n.querySelector("svg")) {
          var savedSrcSvg = n.getAttribute ? n.getAttribute("data-original-code") : "";
          if (savedSrcSvg && savedSrcSvg.trim()) {
            try { n.innerHTML = ""; } catch (e) { /* ignore */ }
            try { n.textContent = savedSrcSvg; } catch (e) { /* ignore */ }
            try { n.removeAttribute("data-processed"); } catch (e) { /* ignore */ }
            try { n.removeAttribute("data-codewiki-mermaid-rendered"); } catch (e) { /* ignore */ }
            logDebug(
              "[CodeWiki][Mermaid] collectMermaidNodes: recovered SVG-rendered node using saved data-original-code.",
              n.tagName, n.className
            );
            return true;
          }
          logDebug(
            "[CodeWiki][Mermaid] collectMermaidNodes: excluding node that already contains rendered SVG (no saved source).",
            n.tagName, n.className
          );
          return false;
        }

        // Heuristic: if textContent starts with "#mermaid-" it is Mermaid-generated CSS/error
        // output from a previous render attempt — not a raw diagram source.
        var txt = (n.textContent || "").trimLeft ? (n.textContent || "").trimLeft() : (n.textContent || "").replace(/^\s+/, "");
        if (txt.indexOf("#mermaid-") === 0) {
          var savedSrcCss = n.getAttribute ? n.getAttribute("data-original-code") : "";
          if (savedSrcCss && savedSrcCss.trim()) {
            try { n.textContent = savedSrcCss; } catch (e) { /* ignore */ }
            try { n.removeAttribute("data-processed"); } catch (e) { /* ignore */ }
            try { n.removeAttribute("data-codewiki-mermaid-rendered"); } catch (e) { /* ignore */ }
            logDebug(
              "[CodeWiki][Mermaid] collectMermaidNodes: recovered CSS-output node using saved data-original-code.",
              n.tagName, n.className
            );
            return true;
          }
          logDebug(
            "[CodeWiki][Mermaid] collectMermaidNodes: excluding node whose textContent looks like rendered Mermaid CSS/error output.",
            n.tagName, n.className, "preview:", txt.slice(0, 80)
          );
          return false;
        }

        return true;
      });

      // Debug-only: node-by-node previews are too noisy for normal browsing.
      if (isDebugEnabled()) {
        logDebug("[CodeWiki][Mermaid] collectMermaidNodes: selected", nodes.length, "node(s) after filtering.");
      }
    } catch (e) {
      nodes = [];
    }
    return nodes;
  }

  function extractMermaidFromFenceText(text) {
    // Accepts a string containing a mermaid fence and returns the mermaid body, else null.
    // Example:
    // ```mermaid
    // flowchart TD
    // A-->B
    // ```
    if (!text) return null;

    var s = String(text);

    // Fast path
    if (s.indexOf("```mermaid") === -1) return null;

    // Be tolerant of extra whitespace and missing closing fences due to HTML segmentation.
    // We capture from the first ```mermaid to the next ``` (if present) or to end-of-string.
    var m = s.match(/```mermaid\s*\n([\s\S]*?)(\n```\s*|$)/);
    if (!m) return null;

    var body = m[1] || "";
    body = decodeHtmlEntities(body);
    body = String(body).replace(/\s+$/, "");
    // Debug-only: fence extraction details are intentionally quiet in normal operation.
    logDebug(
      "[CodeWiki][Mermaid] extractMermaidFromFenceText: extracted fenced body length=",
      body.length
    );
    return body ? body : null;
  }

  function isMermaidOpeningFenceText(text) {
    if (!text) return false;
    return /^\s*```mermaid\s*$/.test(String(text));
  }

  function containsClosingFence(text) {
    if (!text) return false;
    return /(^|\n)```\s*$/.test(String(text));
  }

  function stripClosingFence(text) {
    if (!text) return "";
    return String(text).replace(/(^|\n)```\s*$/, "");
  }

  function extractNodeText(node) {
    if (!node) return "";

    try {
      var tag = node.tagName ? node.tagName.toLowerCase() : "";
      if (tag === "pre") {
        var preCode = node.querySelector ? node.querySelector("code") : null;
        return decodeHtmlEntities((preCode && preCode.textContent) || node.textContent || "");
      }
      if (tag === "code") {
        return decodeHtmlEntities(node.textContent || "");
      }

      if (node.classList && node.classList.contains("highlight")) {
        var highlightCode = node.querySelector ? node.querySelector("pre code, pre") : null;
        return decodeHtmlEntities((highlightCode && highlightCode.textContent) || node.textContent || "");
      }

      return decodeHtmlEntities(node.textContent || "");
    } catch (e) {
      return "";
    }
  }

  function isRecoverableMermaidSibling(node) {
    if (!node || node.nodeType !== 1) return false;

    try {
      var tag = node.tagName ? node.tagName.toLowerCase() : "";
      if (tag === "p" || tag === "pre" || tag === "code") return true;
      if (tag === "div" && node.classList && node.classList.contains("highlight")) return true;
      if (tag === "div" && node.classList && node.classList.contains("mermaid")) return true;
    } catch (e) {
      // ignore
    }

    return false;
  }

  function normalizeRecoveredMermaidSource(chunks) {
    var parts = [];
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      if (chunk == null) continue;
      var text = String(chunk);
      if (!text) continue;
      parts.push(text.replace(/\s+$/, ""));
    }

    var merged = parts.join("\n");
    merged = merged.replace(/^\s+/, "").replace(/\s+$/, "");
    return merged;
  }

  function createMermaidDivFromSource(source, metadata) {
    var div = document.createElement("div");
    div.className = "mermaid";
    div.setAttribute("data-codewiki-mermaid", "1");
    if (metadata && metadata.recovered) {
      div.setAttribute("data-codewiki-mermaid-recovered", "1");
    }
    if (metadata && metadata.strategy) {
      div.setAttribute("data-codewiki-mermaid-recovery-strategy", metadata.strategy);
    }
    div.textContent = source || "";
    div.setAttribute("data-original-code", source || "");
    return div;
  }

  function tryRepairSplitMermaidFence(startParagraph) {
    if (!startParagraph || !startParagraph.parentElement) return false;
    if (!isMermaidOpeningFenceText(startParagraph.textContent || "")) return false;

    var parent = startParagraph.parentElement;
    var current = startParagraph;
    var consumedNodes = [startParagraph];
    var collectedChunks = [];
    var closingFound = false;

    while (current && current.nextSibling) {
      current = current.nextSibling;

      // Skip ignorable whitespace text nodes between elements.
      if (current.nodeType === 3) {
        if (!String(current.textContent || "").trim()) {
          consumedNodes.push(current);
          continue;
        }
        logDebug("[CodeWiki][Mermaid] aborting split-fence repair due to non-whitespace text sibling.");
        return false;
      }

      if (current.nodeType !== 1 || !isRecoverableMermaidSibling(current)) {
        logDebug("[CodeWiki][Mermaid] aborting split-fence repair due to unsupported sibling:", current);
        return false;
      }

      consumedNodes.push(current);

      var text = extractNodeText(current);
      if (containsClosingFence(text)) {
        var beforeClosing = stripClosingFence(text);
        if (beforeClosing && beforeClosing.trim()) {
          collectedChunks.push(beforeClosing);
        }
        closingFound = true;
        break;
      }

      if (text && text.trim()) {
        collectedChunks.push(text);
      }
    }

    if (!closingFound) {
      logDebug("[CodeWiki][Mermaid] split-fence repair did not find a closing fence.");
      return false;
    }

    var mergedSource = normalizeRecoveredMermaidSource(collectedChunks);
    if (!mergedSource) {
      logDebug("[CodeWiki][Mermaid] split-fence repair produced empty Mermaid source.");
      return false;
    }

    var replacement = createMermaidDivFromSource(mergedSource, {
      recovered: true,
      strategy: "split-siblings",
    });

    try {
      parent.insertBefore(replacement, startParagraph);
      for (var i = 0; i < consumedNodes.length; i++) {
        var node = consumedNodes[i];
        if (node && node.parentNode === parent) {
          parent.removeChild(node);
        }
      }
      logDebug(
        "[CodeWiki][Mermaid] repaired split Mermaid fence from sibling nodes:",
        consumedNodes.length,
        "nodes consumed."
      );
      return true;
    } catch (e) {
      logDebug("[CodeWiki][Mermaid] split-fence repair replacement error:", e);
      return false;
    }
  }

  function repairParagraphFences(root) {
    // Converts:
    //   1) <p>```mermaid\n...\n```</p>
    //   2) <p>```mermaid</p><div class="highlight">...</div><p>```</p>
    // into:
    //   <div class="mermaid">...\n</div>
    //
    // This is a pragmatic fix for pages where markdown fences were emitted as literal text
    // or split into sibling nodes instead of preserved as one superfence block.
    var r = root || document;
    try {
      var paras = Array.from(r.querySelectorAll("p"));
      logDebug("[CodeWiki][Mermaid] repairParagraphFences: scanning", paras.length, "<p> node(s).");
      for (var i = 0; i < paras.length; i++) {
        var p = paras[i];
        if (!p || !p.textContent || !p.parentElement) continue;

        // Recovery path: sometimes Mermaid is emitted as plain text starting with:
        //   "mermaid\nflowchart LR\n..."
        // either directly in <p> textContent or inside a <p><code>...</code></p>.
        // Convert that into a standard <div class="mermaid">...</div>.
        try {
          var pCode = p.querySelector ? p.querySelector("code") : null;
          var rawText = decodeHtmlEntities((pCode && pCode.textContent) || p.textContent || "");
          var t = String(rawText || "");
          var trimmedLeft = t.trimLeft ? t.trimLeft() : t.replace(/^\s+/, "");

          if (/^mermaid(\s*\r?\n|$)/.test(trimmedLeft)) {
            var bodyFromPlain = trimmedLeft.replace(/^mermaid\s*\r?\n?/, "");
            bodyFromPlain = String(bodyFromPlain || "").replace(/\s+$/, "");
            if (bodyFromPlain && bodyFromPlain.trim()) {
              var plainDiv = createMermaidDivFromSource(bodyFromPlain, {
                recovered: true,
                strategy: "plain-mermaid-header",
              });
              p.parentElement.replaceChild(plainDiv, p);
              logDebug("[CodeWiki][Mermaid] repaired Mermaid block from plain 'mermaid' header in <p>.");
              continue;
            }
          }
        } catch (ePlain) {
          // ignore
        }

        var body = extractMermaidFromFenceText(p.textContent);
        if (body) {
          var singleNodeDiv = createMermaidDivFromSource(body, {
            recovered: true,
            strategy: "single-paragraph",
          });
          p.parentElement.replaceChild(singleNodeDiv, p);
          logDebug("[CodeWiki][Mermaid] repaired Mermaid fence embedded in a single paragraph.");
          continue;
        }

        if (isMermaidOpeningFenceText(p.textContent)) {
          tryRepairSplitMermaidFence(p);
        }
      }
    } catch (e) {
      logDebug("[CodeWiki][Mermaid] paragraph fence repair error:", e);
    }
  }

  function normalizeMermaidSource(node) {
    // Mermaid markdown often gets HTML-escaped by MkDocs; decode it.
    // Also, MkDocs Material may wrap fenced code blocks as:
    //  - <pre><code class="language-mermaid">...</code></pre>
    //  - <pre class="mermaid"><code>...</code></pre>
    // so handle both <pre> and <code> forms.
    var src = "";
    try {
      if (!node) {
        src = "";
      } else if (node.tagName && node.tagName.toLowerCase() === "pre") {
        // Prefer the <code> child if present, to avoid accidental inclusion of other text nodes.
        var code = node.querySelector ? node.querySelector("code") : null;
        src = (code && code.textContent) || node.textContent || "";
      } else {
        // <div class="mermaid"> or <code class="mermaid">
        src = node.textContent || "";
      }
    } catch (e) {
      src = "";
    }
    src = decodeHtmlEntities(src);
    src = String(src || "").trim();

    // Debug-only: source previews can contain large diagrams; keep them out of normal logs.
    logDebug(
      "[CodeWiki][Mermaid] normalizeMermaidSource:",
      "tag=" + (node && node.tagName ? node.tagName : "?"),
      "class=" + (node && node.className ? node.className : ""),
      "len=" + src.length
    );

    // Guard: if the extracted text still contains a markdown fence header (e.g. ```mermaid),
    // strip the fence wrapper.  This happens when MkDocs/PyMdown emits the fence markers
    // verbatim inside the <code> block's textContent instead of omitting them.
    var fenceBody = extractMermaidFromFenceText(src);
    if (fenceBody) {
      return fenceBody;
    }

    return src;
  }

  function extractDirectiveAwareBody(lines) {
    var cleaned = [];
    var seenDiagramDeclaration = false;
    var inMultiLineDirective = false;

    for (var i = 0; i < lines.length; i++) {
      var rawLine = String(lines[i] || "");
      var trimmed = rawLine.trim();

      if (!trimmed && !seenDiagramDeclaration) {
        continue;
      }

      // Handle Mermaid init directives: %%{ ... }%% (single-line or multi-line)
      if (!seenDiagramDeclaration) {
        if (inMultiLineDirective) {
          // We are inside a multi-line directive block; keep collecting until }%% closes it.
          cleaned.push(rawLine);
          if (trimmed.indexOf("}%%") !== -1) {
            inMultiLineDirective = false;
          }
          continue;
        }
        if (trimmed.indexOf("%%{") === 0) {
          cleaned.push(rawLine);
          if (trimmed.indexOf("}%%") !== -1) {
            // Single-line directive: %%{ ... }%%  — done, do not set seenDiagramDeclaration
          } else {
            // Multi-line directive begins here
            inMultiLineDirective = true;
          }
          continue;
        }
      }

      cleaned.push(rawLine);
      if (trimmed) {
        seenDiagramDeclaration = true;
      }
    }

    return cleaned.join("\n").trim();
  }

  function looksLikeMermaidDiagramSource(source) {
    if (!source) return false;

    var text = String(source).trim();
    if (!text) return false;

    var lines = text.split(/\r?\n/);
    var firstMeaningfulLine = "";

    for (var i = 0; i < lines.length; i++) {
      var trimmed = String(lines[i] || "").trim();
      if (!trimmed) continue;

      // Support Mermaid init directives before the actual chart type:
      // Single-line:  %%{init: {'theme': 'base'}}%%
      // Multi-line:   %%{
      //                 "theme": "base"
      //               }%%
      if (trimmed.indexOf("%%{") === 0) {
        if (trimmed.indexOf("}%%") !== -1) {
          // Single-line directive — skip it and keep looking for the diagram type
          continue;
        }
        // Multi-line directive: skip lines until the closing }%% is found
        while (i + 1 < lines.length) {
          i++;
          var dLine = String(lines[i] || "").trim();
          if (dLine.indexOf("}%%") !== -1) break;
        }
        continue;
      }

      firstMeaningfulLine = trimmed;
      break;
    }

    if (!firstMeaningfulLine) return false;

    var knownDiagramTypes = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|xychart-beta|block-beta)\b/;
    var isKnown = knownDiagramTypes.test(firstMeaningfulLine);

    if (!isKnown) {
      // Always-on diagnostic warn: surface the first meaningful line and raw source so the
      // reason for skipping is visible in the browser console without needing debug mode.
      logWarn(
        "[CodeWiki][Mermaid] Validation: first meaningful line does not match known diagram types.",
        "\n  First meaningful line: " + JSON.stringify(firstMeaningfulLine),
        "\n  Full extracted source (first 300 chars): " + JSON.stringify(text.slice(0, 300))
      );
    }

    return isKnown;
  }

  function getOriginalSource(node) {
    if (!node || !node.getAttribute) return "";
    return node.getAttribute("data-original-code") || "";
  }

  function setOriginalSource(node, source) {
    if (!node || !node.setAttribute) return;
    node.setAttribute("data-original-code", source || "");
  }

  function replaceCodeWithDiv(codeNode) {
    // If node is a Mermaid <code> block inside <pre>, replace the whole <pre> with <div class="mermaid">.
    // This supports Material-native <code class="language-mermaid"> as well as legacy <code class="mermaid">.
    try {
      var pre = codeNode && codeNode.parentElement;
      if (pre && pre.tagName && pre.tagName.toLowerCase() === "pre") {
        var source = codeNode.textContent || "";
        var div = document.createElement("div");
        div.className = "mermaid";
        div.setAttribute("data-codewiki-mermaid", "1");
        div.textContent = source;
        setOriginalSource(div, source);
        pre.parentElement.replaceChild(div, pre);
        return div;
      }
    } catch (e) {
      // ignore
    }
    return codeNode;
  }

  function replacePreWithDiv(preNode) {
    // If node is <pre class="mermaid"><code>...</code></pre> (or <pre class="mermaid">...</pre>),
    // replace it with <div class="mermaid"> preserving source text (including %%{init:...}%%).
    try {
      if (!preNode || !preNode.tagName || preNode.tagName.toLowerCase() !== "pre") return preNode;

      var code = preNode.querySelector ? preNode.querySelector("code") : null;
      var src = (code && code.textContent) || preNode.textContent || "";

      var div = document.createElement("div");
      div.className = "mermaid";
      div.setAttribute("data-codewiki-mermaid", "1");
      div.textContent = src;
      setOriginalSource(div, src);

      preNode.parentElement.replaceChild(div, preNode);
      return div;
    } catch (e) {
      // ignore
    }
    return preNode;
  }

  function openFullscreenOverlay(sourceContainer) {
    try {
      var overlay = ensureFullscreenOverlay();
      var body = overlay.querySelector("[data-codewiki-fs-body]");
      if (!body) return;

      body.innerHTML = "";
      body.setAttribute("data-codewiki-fs-zoom", "1");

      // Clone SVG if present; otherwise clone whole container.
      var svg = sourceContainer && sourceContainer.querySelector ? sourceContainer.querySelector("svg") : null;
      if (svg) {
        body.appendChild(svg.cloneNode(true));
      } else if (sourceContainer) {
        body.appendChild(sourceContainer.cloneNode(true));
      }

      overlay.classList.add("is-open");
      setFullscreenZoom(overlay, 1);
    } catch (e) {
      // ignore
    }
  }

  function getFullscreenBody(overlay) {
    if (!overlay || !overlay.querySelector) return null;
    return overlay.querySelector("[data-codewiki-fs-body]");
  }

  function getFullscreenZoomTarget(overlay) {
    var body = getFullscreenBody(overlay);
    if (!body || !body.firstElementChild) return null;
    return body.firstElementChild;
  }

  function getFullscreenZoom(overlay) {
    var body = getFullscreenBody(overlay);
    if (!body) return 1;
    var raw = parseFloat(body.getAttribute("data-codewiki-fs-zoom") || "1");
    if (!isFinite(raw) || raw <= 0) return 1;
    return raw;
  }

  function setFullscreenZoom(overlay, nextZoom) {
    var body = getFullscreenBody(overlay);
    var target = getFullscreenZoomTarget(overlay);
    if (!body || !target) return;

    var zoom = Math.max(0.25, Math.min(4, Number(nextZoom) || 1));
    body.setAttribute("data-codewiki-fs-zoom", String(zoom));
    target.style.transformOrigin = "top left";
    target.style.transform = "scale(" + zoom + ")";
    target.style.display = "inline-block";

    var percent = Math.round(zoom * 100);
    var indicator = overlay.querySelector("[data-codewiki-fs-zoom-value]");
    if (indicator) {
      indicator.textContent = percent + "%";
    }
  }

  function changeFullscreenZoom(overlay, delta) {
    setFullscreenZoom(overlay, getFullscreenZoom(overlay) + delta);
  }

  function fitFullscreenZoom(overlay) {
    var body = getFullscreenBody(overlay);
    var target = getFullscreenZoomTarget(overlay);
    if (!body || !target) return;

    var svg = target.matches && target.matches("svg") ? target : (target.querySelector ? target.querySelector("svg") : null);
    if (!svg) {
      setFullscreenZoom(overlay, 1);
      return;
    }

    var box = null;
    try {
      box = typeof svg.getBBox === "function" ? svg.getBBox() : null;
    } catch (e) {
      box = null;
    }

    var viewBoxWidth = 0;
    var viewBoxHeight = 0;
    try {
      var baseVal = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
      viewBoxWidth = baseVal && isFinite(baseVal.width) ? baseVal.width : 0;
      viewBoxHeight = baseVal && isFinite(baseVal.height) ? baseVal.height : 0;
    } catch (eViewBox) {
      viewBoxWidth = 0;
      viewBoxHeight = 0;
    }

    var width = (box && box.width) || viewBoxWidth || svg.clientWidth || svg.scrollWidth || 1;
    var height = (box && box.height) || viewBoxHeight || svg.clientHeight || svg.scrollHeight || 1;
    var availableWidth = Math.max(1, body.clientWidth - 24);
    var availableHeight = Math.max(1, body.clientHeight - 24);
    var zoom = Math.min(availableWidth / width, availableHeight / height);
    setFullscreenZoom(overlay, Math.max(0.25, Math.min(2, zoom || 1)));
  }

  function closeFullscreenOverlay() {
    try {
      var overlay = document.getElementById("codewiki-mermaid-fullscreen-overlay");
      if (!overlay) return;
      overlay.classList.remove("is-open");
    } catch (e) {
      // ignore
    }
  }

  function ensureFullscreenOverlay() {
    var id = "codewiki-mermaid-fullscreen-overlay";
    var el = document.getElementById(id);
    if (el) return el;

    el = document.createElement("div");
    el.id = id;
    el.className = "codewiki-mermaid-fullscreen-overlay";

    el.innerHTML =
      '<div class="codewiki-mermaid-fullscreen-card" role="dialog" aria-modal="true" aria-label="Mermaid diagram fullscreen">' +
      '  <div class="codewiki-mermaid-fullscreen-toolbar">' +
      '    <div class="codewiki-mermaid-fullscreen-title">Diagram</div>' +
      '    <div class="codewiki-mermaid-fullscreen-actions">' +
      '      <button type="button" class="codewiki-mermaid-fullscreen-btn codewiki-mermaid-fs__btn" data-codewiki-fs-action="zoom-out" aria-label="Zoom out">−</button>' +
      '      <span class="codewiki-mermaid-fullscreen-zoom" data-codewiki-fs-zoom-value>100%</span>' +
      '      <button type="button" class="codewiki-mermaid-fullscreen-btn codewiki-mermaid-fs__btn" data-codewiki-fs-action="zoom-in" aria-label="Zoom in">+</button>' +
      '      <button type="button" class="codewiki-mermaid-fullscreen-btn codewiki-mermaid-fs__btn" data-codewiki-fs-action="reset">Reset</button>' +
      '      <button type="button" class="codewiki-mermaid-fullscreen-btn codewiki-mermaid-fs__btn" data-codewiki-fs-action="fit">Fit</button>' +
      '      <button type="button" class="codewiki-mermaid-fullscreen-btn codewiki-mermaid-fs__btn" data-codewiki-fs-action="close">Close</button>' +
      "    </div>" +
      "  </div>" +
      '  <div class="codewiki-mermaid-fullscreen-body" data-codewiki-fs-body></div>' +
      "</div>";

    el.addEventListener("click", function (ev) {
      if (ev.target === el) closeFullscreenOverlay();
    });

    document.body.appendChild(el);

    var closeBtn = el.querySelector('[data-codewiki-fs-action="close"]');
    if (closeBtn) closeBtn.addEventListener("click", closeFullscreenOverlay);

    var zoomInBtn = el.querySelector('[data-codewiki-fs-action="zoom-in"]');
    if (zoomInBtn) zoomInBtn.addEventListener("click", function () { changeFullscreenZoom(el, 0.1); });

    var zoomOutBtn = el.querySelector('[data-codewiki-fs-action="zoom-out"]');
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", function () { changeFullscreenZoom(el, -0.1); });

    var resetBtn = el.querySelector('[data-codewiki-fs-action="reset"]');
    if (resetBtn) resetBtn.addEventListener("click", function () { setFullscreenZoom(el, 1); });

    var fitBtn = el.querySelector('[data-codewiki-fs-action="fit"]');
    if (fitBtn) fitBtn.addEventListener("click", function () { fitFullscreenZoom(el); });

    var fsBody = el.querySelector("[data-codewiki-fs-body]");
    if (fsBody) {
      fsBody.addEventListener("wheel", function (ev) {
        if (!ev.ctrlKey && !ev.metaKey) return;
        ev.preventDefault();
        changeFullscreenZoom(el, ev.deltaY < 0 ? 0.1 : -0.1);
      }, { passive: false });
    }

    return el;
  }

  function addFullscreenUIForRenderedSvg(container) {
    // Adds a small "Fullscreen" button near a rendered Mermaid SVG
    try {
      var svg = container.querySelector("svg");
      if (!svg) return;

      if (container.getAttribute("data-codewiki-mermaid-fs") === "1") return;
      container.setAttribute("data-codewiki-mermaid-fs", "1");

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "codewiki-mermaid-fullscreen-btn codewiki-mermaid-fs__btn";
      btn.textContent = "Fullscreen";
      btn.style.margin = "6px 0";

      btn.addEventListener("click", function () {
        openFullscreenOverlay(container);
      });

      // Insert before svg for visibility
      container.insertBefore(btn, svg);
    } catch (e) {
      // ignore
    }
  }

  function ensureFullscreenControlsWhenSvgAppears(container) {
    if (!container || !window.MutationObserver) return;

    addFullscreenUIForRenderedSvg(container);
    if (container.getAttribute("data-codewiki-mermaid-fs-observer") === "1") return;

    container.setAttribute("data-codewiki-mermaid-fs-observer", "1");

    var observer = new MutationObserver(function () {
      if (container.querySelector && container.querySelector("svg")) {
        addFullscreenUIForRenderedSvg(container);
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });
  }

  async function renderAll(root) {
    var available = await waitForMermaidGlobal(10, 150);
    if (!available) {
      logWarn("[CodeWiki][Mermaid] Skipping render: Mermaid library is unavailable after waiting.");
      return;
    }

    // Normalize Mermaid API shape once per render pass.
    var mermaidApi = getMermaidApi();
    if (!mermaidApi) {
      logWarn("[CodeWiki][Mermaid] Skipping render: Mermaid API not available on window.mermaid.");
      return;
    }

    logDebug(
      "[CodeWiki][Mermaid] renderAll: starting",
      "readyState=" + (document && document.readyState ? document.readyState : "?")
    );

    initMermaidOnce();

    // Repair broken markdown emission where mermaid fences show up as literal text in <p> tags
    // or are split across sibling paragraph/highlight nodes. This must happen before node collection.
    repairParagraphFences(root || document);

    var nodes = collectMermaidNodes(root);
    if (!nodes.length) {
      logWarn("[CodeWiki][Mermaid] No Mermaid nodes found after repair attempt.");
      try {
        var doc = root || document;
        var counts = {
          "div.mermaid": doc.querySelectorAll ? doc.querySelectorAll("div.mermaid").length : 0,
          "pre.mermaid": doc.querySelectorAll ? doc.querySelectorAll("pre.mermaid").length : 0,
          "code.language-mermaid": doc.querySelectorAll ? doc.querySelectorAll("pre > code.language-mermaid").length : 0,
          "code.mermaid": doc.querySelectorAll ? doc.querySelectorAll("pre > code.mermaid").length : 0,
          "p elements": doc.querySelectorAll ? doc.querySelectorAll("p").length : 0,
        };
        logWarn("[CodeWiki][Mermaid] renderAll diagnostics: DOM counts", counts);
      } catch (eCount) { /* ignore */ }
      return;
    }

    logDebug("[CodeWiki][Mermaid] Found", nodes.length, "Mermaid node(s) to render.");

    // Convert supported markup variants into <div class="mermaid"> containers
    // so the rest of the pipeline can treat everything uniformly.
    nodes = nodes.map(function (n) {
      if (!n || !n.tagName) return n;

      var tag = n.tagName.toLowerCase();
      if (tag === "code") {
        var replacedCode = replaceCodeWithDiv(n);
        logDebug("[CodeWiki][Mermaid] renderAll: normalized <code> →", replacedCode && replacedCode.tagName, replacedCode && replacedCode.className);
        return replacedCode;
      }
      if (tag === "pre" && n.classList && n.classList.contains("mermaid")) {
        var replacedPre = replacePreWithDiv(n);
        logDebug("[CodeWiki][Mermaid] renderAll: normalized <pre.mermaid> →", replacedPre && replacedPre.tagName, replacedPre && replacedPre.className);
        return replacedPre;
      }
      return n;
    });

    // Render
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n) continue;

      // Avoid re-render loops
      if (n.getAttribute && n.getAttribute("data-codewiki-mermaid-rendered") === "1") {
        ensureFullscreenControlsWhenSvgAppears(n);
        continue;
      }

      var src = getOriginalSource(n) || normalizeMermaidSource(n);
      if (getOriginalSource(n)) {
        logDebug(
          "[CodeWiki][Mermaid] renderAll: using data-original-code",
          "len=" + String(getOriginalSource(n) || "").length,
          "earlyCaptured=" + (n.getAttribute ? (n.getAttribute("data-codewiki-early-captured") || "0") : "n/a")
        );
      }
      src = extractDirectiveAwareBody(String(src || "").split(/\r?\n/));
      logDebug("[CodeWiki][Mermaid] renderAll: processing node #" + (i + 1), "len=" + (src || "").length);

      if (!src || !looksLikeMermaidDiagramSource(src)) {
        // Always-on warn so the skip is visible in the console even without debug mode.
        logWarn(
          "[CodeWiki][Mermaid] Skipping node #" + (i + 1) + ": source does not look like a valid Mermaid diagram.",
          "\n  Raw extracted source (first 300 chars): " + JSON.stringify((src || "").slice(0, 300))
        );
        continue;
      }

      setOriginalSource(n, src);

      try {
        // Mark as rendered before calling render to avoid loops if mermaid mutates DOM
        n.setAttribute("data-codewiki-mermaid-rendered", "1");

        // Mermaid API: render(id, text, cb, container)
        var id = "cw_mermaid_" + Math.random().toString(36).slice(2);

        // Use promise-based render if available
        if (mermaidApi && typeof mermaidApi.render === "function") {
          var out = await mermaidApi.render(id, src);
          if (out && out.svg) {
            n.innerHTML = out.svg;
            ensureFullscreenControlsWhenSvgAppears(n);
            logDebug(
              "[CodeWiki][Mermaid] Rendered Mermaid diagram successfully.",
              n.getAttribute("data-codewiki-mermaid-recovery-strategy") || "native"
            );
          } else {
            logWarn("[CodeWiki][Mermaid] Render returned no SVG for diagram #" + (i + 1) + ". Source:\n" + src);
          }
        } else {
          // very old mermaid: best-effort fallback
          n.textContent = src;
          logDebug("[CodeWiki][Mermaid] Mermaid render API unavailable; left source text in place.");
        }
      } catch (e) {
        // Keep source visible for debugging
        n.removeAttribute("data-codewiki-mermaid-rendered");
        n.textContent = src;
        // Always-on warning: surface CSS/syntax errors in devtools even without debug mode.
        logWarn(
          "[CodeWiki][Mermaid] Render error on diagram #" + (i + 1) + ":",
          e,
          "\nMermaid source passed to renderer:\n" + src
        );
      }
    }
  }

  function scheduleRender() {
    // Debounce rendering to avoid double-renders in instant-navigation.
    window.clearTimeout(scheduleRender._t);
    scheduleRender._t = window.setTimeout(function () {
      renderAll(document);
    }, 50);
  }

  function hookInstantNavigation() {
    // MkDocs Material instant navigation dispatches navigation:complete
    document.addEventListener("navigation:complete", function () {
      // reset rendered markers so we can re-render after navigation
      try {
        // Use a broad raw query (not the filtered collectMermaidNodes) so that already-rendered
        // nodes also get their markers cleared and become eligible for re-render collection
        // after their data-processed and SVG state is reset below.
        var allMermaidNodes = Array.from(
          document.querySelectorAll("div.mermaid, pre > code.language-mermaid, pre > code.mermaid, pre.mermaid > code, pre.mermaid")
        );
        allMermaidNodes.forEach(function (n) {
          if (!n) return;
          if (n.removeAttribute) {
            n.removeAttribute("data-codewiki-mermaid-rendered");
            // Also clear Mermaid's own data-processed marker so collectMermaidNodes
            // will not exclude the node on the next render pass.
            n.removeAttribute("data-processed");
          }
          // Restore original source text so normalizeMermaidSource() gets clean input.
          var origSrc = n.getAttribute ? n.getAttribute("data-original-code") : "";
          if (origSrc && n.textContent !== origSrc) {
            n.textContent = origSrc;
          }
        });
      } catch (e) {
        // ignore
      }
      scheduleRender();
    });
  }

  function hookPaletteChanges() {
    // If html[data-md-color-scheme] changes (palette toggle), re-init and re-render.
    try {
      var html = document.documentElement;
      if (!html || !window.MutationObserver) return;

      var obs = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type === "attributes" && m.attributeName === "data-md-color-scheme") {
            logDebug("[CodeWiki][Mermaid] Detected scheme change; re-rendering.");
            // reset markers
            // Use a broad raw query (same reason as hookInstantNavigation) so already-rendered
            // nodes are included in the marker reset and re-render pass.
            var allMermaidNodesP = Array.from(
              document.querySelectorAll("div.mermaid, pre > code.language-mermaid, pre > code.mermaid, pre.mermaid > code, pre.mermaid")
            );
            allMermaidNodesP.forEach(function (n) {
              if (!n) return;
              if (n.removeAttribute) {
                n.removeAttribute("data-codewiki-mermaid-rendered");
                n.removeAttribute("data-processed");
              }
              var origSrc = n.getAttribute ? n.getAttribute("data-original-code") : "";
              if (origSrc && n.textContent !== origSrc) {
                n.textContent = origSrc;
              }
            });
            scheduleRender();
            break;
          }
        }
      });

      obs.observe(html, { attributes: true });
    } catch (e) {
      // ignore
    }
  }

  function init() {
    scheduleRender();
    hookInstantNavigation();
    hookPaletteChanges();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
