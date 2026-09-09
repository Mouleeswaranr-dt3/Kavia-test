# Slidev presentations

Former skill: `slidev_app`

Instructions for building an application using slidev framework.

=== Slidev CSS Import Patterns ===
- Slidev frontmatter CANNOT import theme files directly - requires intermediate style.css file
- Working pattern: frontmatter → style.css → theme files (two-step import chain)
- Create style.css in project root with theme imports, then reference it in frontmatter
- Required structure:
  1. style.css file contains: `@import "./theme/custom.css";`
  2. slides.md frontmatter contains:
  ```yaml
  css: |
    @import "./style.css";
  ```
- Direct theme import in frontmatter will fail - intermediate file is mandatory

=== Slidev Presentation Structure ===
- Slides separated by --- (three dashes) on new line
- Frontmatter at file start or after --- for slide-specific config
- HTML/Vue components allowed alongside Markdown
- Mermaid/PlantUML diagrams need theme config for dark backgrounds
- Custom CSS classes only work if properly imported via css: field or theme:

=== YAML Frontmatter Safety ===
- Slidev frontmatter requires valid YAML - parsing errors prevent startup
- Quote strings containing colons (:), like titles: "Title: Subtitle" NOT title: Title: Subtitle
- Special characters (&, *, >, |, :, #) in values need quotes or will cause parse errors
- Multiline text use pipe (|) or quotes, not bare text
- Example safe frontmatter:
  ```yaml
  title: "Project: Advanced Features"
  info: |
    Multi-line description
    with special chars: safe
  ```

=== Content Generation for Slidev ===
- When creating new presentations, replace ALL default slides.md content
- Remove template examples (Welcome to Slidev, navigation instructions, etc.)
- Only include content relevant to the requested topic
- Keep default config files (package.json, vite.config.ts) but replace presentation content
