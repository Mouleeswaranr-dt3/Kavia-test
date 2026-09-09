# Flutter applications

Former skill: `flutter_app`

Instructions for building an application using Flutter framework.

=== Flutter Development CRITICAL Rules ===
- Use full package imports: 'package:shared_preferences/shared_preferences.dart' NOT 'package:shared_preferences.dart'
- Always use const constructors where possible: const Widget() not Widget()
- Use withAlpha() instead of deprecated withOpacity() for colors
- ColorScheme uses 'surface' not deprecated 'background' property
- Check analysis_options.yaml for project linting rules before writing code
- Add all dependencies to pubspec.yaml BEFORE using them in code
- Follow Effective Dart naming conventions

=== Flutter Async Context CRITICAL Rules ===
- NEVER use context, controllers, or ANY widget objects after await
- After await, ONLY update primitive state variables (String, int, bool)
- Update controllers/navigation ONLY in build() based on state flags
- Even with mounted checks, NO widget operations after async
- If analyzer shows "context across async gap", restructure completely:
  * Async methods: only fetch data and set primitive state
  * Build method: handle all UI updates based on state
