# Angular applications

Former skill: `angular_app`

Instructions for building an application using Angular framework.

=== Angular Development CRITICAL Rules ===
- ALL Angular packages MUST use EXACT SAME VERSION: If @angular/core is 19.2.1, ALL other @angular/* packages MUST be 19.2.1
- NEVER mix versions: Angular 19 + Material 20 = BUILD FAILURE
- NO version ranges (^, ~) for Angular core packages - use exact versions
- ALWAYS install required dependencies together with EXACT matching versions, e.g., @angular/material REQUIRES @angular/cdk of the SAME version, or the build will fail.
- Check ALL: @angular/core, @angular/common, @angular/animations, @angular/forms, @angular/material, @angular/cdk
- For SSR in main.server.ts: export default MUST return Promise<ApplicationRef>, NOT Promise<ApplicationConfig>
- Ensure the main application entrypoint imports and uses all new code and features to avoid having changes not reflected in the final UI.
