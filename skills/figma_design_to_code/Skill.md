---
name: Figma Design to Code
description: Use this skill when the user shares a Figma URL with a node-id and expects UI code generated for that design.
owner: system
source_ecosystem: kavia-system
slash_command:
  command: figma-design-to-code
  enabled: true
---

# Figma Design to Code

Use this skill when the user shares a Figma URL with a node-id and expects UI code generated for that design.

## Instructions

1. Get the entire Figma node as an image. And use this image as the reference to build the UI.
2. Get the figma data for rich context and understanding of the Figma file and node.
3. You MUST download and use all assets (images, icons, logos, SVGs, etc.) from the Figma with appropriate localPath value and ensure to use them in the UI code correctly. For icons and logos, get the entire individual icon or logo SVG as whole as it is instead of its separate path/fill.
4. Combine your understanding from both the figma data and the full figma node image to build a meaningful UI/UX and ensure that it has all required components and exactly matches the Figma design.
5. Make the UI responsive so that it works on all devices and screen sizes.

## Extract Figma File Key & Node ID

Example: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`

- `:fileKey` is the file key
- `1-2` is the node ID (the specific component or frame to implement)

## Important

- To download the assets, use appropriate `localPath` value in the request. Ensure to check the directory, and use the correct localPath value to save the assets into the project. For icons and logos, get the entire icon or logo as it is instead of each svg path/fill.
- Be rate limit cautious without sacrificing the quality of the UI.
- Batch download all the assets required from the Figma and use them in the UI code correctly.

## Rules

- Generated components must be idiomatic for the target framework (React JSX/TSX, Vue SFC, plain HTML/CSS, etc.).
- Achieve 1:1 Visual Parity with a meaningful UI/UX that EXACTLY matches the Figma design.
- Follow WCAG requirements for accessibility.
- Add component documentation as needed.

## Validation Checklist

- [ ] UI matches the Figma design as per the downloaded full node image exactly.
- [ ] Ensure that you have downloaded all the assets (images, icons, logos, SVGs, etc.) from the Figma and used them in the UI code accordingly.
- [ ] Layout matches (spacing, alignment, sizing)
- [ ] Typography matches (font, size, weight, line height, color)
- [ ] Colors match exactly
- [ ] Interactive states work as designed (hover, active, disabled)
- [ ] Responsive UI everywhere in the UI.
- [ ] Assets render correctly
- [ ] All components like buttons, inputs, etc. must meet the same styling details (like colors, fonts, sizes, border radius, padding, margin, etc.) as in the Figma design
- [ ] Ensure sensible functionality and UI/UX is built.

## Implementation Rules

### Component Organization

- Place UI components in the project's designated design system directory
- Follow the project's component naming conventions
- Avoid inline styles unless truly necessary for dynamic values

### Code Quality

- Avoid hardcoded values - extract to constants or design tokens
- Keep components composable and reusable
- Add TypeScript types for component props if applicable.
- Include JSDoc comments for exported components

Do not define background image urls in CSS. Use them appropriately in the UI code itself for img tag src attribute or div style background image property with url().

## Best Practices

### Incremental Validation

Validate frequently during implementation, not just at the end. This catches issues early.
Implement it thoroughly and carefully and very accurately so that the user is impressed and satisifed with the Figma to UI code conversion.
