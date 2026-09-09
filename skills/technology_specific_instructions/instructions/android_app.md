# Android applications

Former skill: `android_app`

Instructions for working with android applications.

=== Android/Gradle Development CRITICAL Rules ===
- Do NOT use Jetpack Compose
- Write all dependencies with EXPLICIT versions: "dependency:1.12.0" not "dependency:"
- Use AndroidX libraries without Compose Dependencies

=== Gradle 9 Declarative (.dcl files) STRICT RULES ===
- If you see build.gradle.dcl or settings.gradle.dcl, the project uses DCL - different syntax rules apply
- .dcl files use EXPERIMENTAL Gradle Declarative Configuration Language - NOT traditional Gradle DSL
- ONLY allowed modification: Add implementation("package:version") to EXISTING dependencies {} block
- FORBIDDEN in .dcl files: testImplementation, android {}, testing {}, defaultConfig {}, new blocks
- NEVER attempt multiple modifications to fix .dcl errors - if first attempt fails, STOP
