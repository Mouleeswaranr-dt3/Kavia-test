# Lightning JS 3 / Blits applications

Former skill: `lightning_app`

Instructions for building a lightning JS 3.0 app:

=== Lightning 3 (Blits) Development CRITICAL Rules ===
- This is NOT React/DOM - Lightning renders via WebGL, NOT the browser DOM.
- NEVER use React, JSX, HTML tags, CSS, document APIs, or DOM event listeners.
- Use Blits.Application() for the app root and Blits.Component() for all components.
- Always launch with Blits.Launch(App, 'app', { w: 1920, h: 1080, ...settings }).

=== Template Syntax STRICT RULES ===
- Use only XML-style templates with <Element>, <Text>, and valid Lightning tags.
- <Element> uses Lightning attributes (x, y, w, h, color, src, alpha, rotation, scale, zIndex, etc.). NEVER use HTML/CSS properties like style, class, or className.
- All images MUST have BOTH w and h attributes, or they WILL NOT render.
- Place all local images in the public/ folder; reference images WITHOUT the 'public/' prefix (e.g., src="assets/logo.png").
- Binding syntax:
  * $var for one-time dynamic binding (evaluated once at render)
  * :prop="expr" for reactive binding (updates when state changes)
  * @event="$method" for event handlers

=== For-Loop STRICT RULES ===
- Syntax: :for="item in $items" or :for="(item, index) in $items" with parentheses for index
- Access loop variables with $ prefix: $item, $index (e.g., :color="$item.color", :x="$index * 150")
- ALWAYS add key attribute: :key="$item.id" using unique identifier (NOT index)
- Use :range="{from: 0, to: 10}" for lazy loading/performance with large lists

=== Input Handling CRITICAL Rules ===
- DO NOT use browser event APIs: no addEventListener, document.querySelector, or DOM events.
- Define an input object with methods: up(e), down(e), left(e), right(e), enter(e), back(e).
- Set all key mappings in Blits.Launch() -- NEVER in component code.
- Unhandled input bubbles up: use this.parent.focus(e) to propagate further.

=== Router STRICT RULES ===
- Define a routes array directly on Application: [{ path, component, options }].
- Render with <RouterView /> in your Application template.
- Navigate with this.$router.to('/path') and this.$router.back().
- Use ":param" syntax for dynamic routes and declare props matching any route parameters in components.

=== Component/File Integration CRITICAL Rules ===
- ALL new pages/components MUST be explicitly imported and registered in your Application (entrypoint) file to be visible.
- New components/pages are NOT auto-discovered: you must import and manually add them to the routes and components as appropriate.
- The <RouterView /> tag MUST be present in your Application to render navigable child routes.
- NO code, page, or feature is considered "integrated" unless:
    1. It is imported in the entrypoint Application,
    2. It is registered in the routes array AND/OR as a child component,
    3. It renders visibly when routing or application starts.
- When you add a new component/page, update the routes and Application imports IMMEDIATELY.

=== Using Child Components ===
```js
import Menu from './components/Menu.js'
export default Blits.Component('Page', {
  components: { Menu },  // Register before use
  template: `<Element><Menu /></Element>`
})
```

=== Codebase Integration CRITICAL Rules ===
- ALWAYS inspect existing project structure BEFORE creating files
- EXTEND existing code - NEVER create duplicate/parallel file structures
- Respect the provided workspace root and existing folder conventions
- All new UI/logic must use Lightning/Blits conventions - React/HTML/DOM code must be ported, NOT mixed in
- Referenced assets (images, fonts) MUST be added to public/ folder

=== Lightning Minimal Example ===
```js
import Blits from '@lightningjs/blits'
export default Blits.Component('MyPage', {
  template: `<Element><Text :content="$msg" /></Element>`,
  props: ['title'],
  state() { return { msg: 'Hello' } },
  methods: { update() { this.msg = 'Updated' } },
  input: { enter() { this.msg = 'Clicked' } }
})
```

=== Application Structure Example ===
```js
import Home from './pages/Home.js'
export default Blits.Application({
  template: `<Element><RouterView /> </Element>`,
  routes: [{ path: '/', component: Home }]
})
```

=== For-Loop Example ===
```js
template: `
  <Element>
    <Element 
      :for="(item, index) in $items" 
      :key="$item.id"
      :x="$index * 150"
      :color="$item.color"
      w="100"
      h="100"
    />
  </Element>
`
```
