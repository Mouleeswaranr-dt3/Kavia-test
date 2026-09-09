---
name: technology_specific_instructions
description: Instructions for writing code for various frameworks and technologies covering Android, Android TV, Angular, Flutter, Kotlin, Lightning JS 3 / Blits, MongoDB, MySQL, Playwright E2E, PostgreSQL, SQLite, and Slidev. Use this skill whenever a task involves a specific framework, platform, database, package, runtime, or toolchain. 
owner: system
source_ecosystem: kavia-system
legacy_static_skill: technology_specific_instructions
---

# technology_specific_instructions

Unified technology-specific implementation guidance for Kavia code generation agents covering Android, Android TV, Angular, Flutter, Kotlin, Lightning JS 3 / Blits, MongoDB, MySQL, Playwright E2E, PostgreSQL, SQLite, and Slidev.

Use this skill whenever a task involves a specific framework, platform, database, package, runtime, or toolchain. The instruction files below consolidate the former technology-specific top-level skills into one generic skill package while preserving all existing guidance.

## Catalog

| Technology / domain | Former skill | Instruction file |
| --- | --- | --- |
| Android applications | `android_app` | [instructions/android_app.md](instructions/android_app.md) |
| Android TV applications | `androidtv_app` | [instructions/androidtv_app.md](instructions/androidtv_app.md) |
| Angular applications | `angular_app` | [instructions/angular_app.md](instructions/angular_app.md) |
| Flutter applications | `flutter_app` | [instructions/flutter_app.md](instructions/flutter_app.md) |
| Kotlin / traditional Android applications | `kotlin_app` | [instructions/kotlin_app.md](instructions/kotlin_app.md) |
| Lightning JS 3 / Blits applications | `lightning_app` | [instructions/lightning_app.md](instructions/lightning_app.md) |
| MongoDB integration and operations | `mongodb_app` | [instructions/mongodb_app.md](instructions/mongodb_app.md) |
| MySQL integration and operations | `mysql_app` | [instructions/mysql_app.md](instructions/mysql_app.md) |
| Playwright E2E testing | `playwright_e2e` | [instructions/playwright_e2e.md](instructions/playwright_e2e.md) |
| PostgreSQL integration and operations | `postgresql_app` | [instructions/postgresql_app.md](instructions/postgresql_app.md) |
| SQLite integration and operations | `sqlite_app` | [instructions/sqlite_app.md](instructions/sqlite_app.md) |
| Slidev presentations | `slidev_app` | [instructions/slidev_app.md](instructions/slidev_app.md) |

## Usage

1. Identify the technology, framework, database, package, or toolchain relevant to the current task.
2. Open and apply the matching instruction file from the catalog.
3. If multiple technologies apply, follow every relevant instruction file.
4. If a future technology-specific guide is added, place it under `instructions/` and update this catalog with a relative link.

The former standalone technology skill names are retained in the catalog for discoverability only; new references should use this unified `technology_specific_instructions` skill.
