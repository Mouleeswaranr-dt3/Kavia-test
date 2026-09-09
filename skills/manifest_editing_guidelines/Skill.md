---
name: manifest_editing_guidelines
description: Instructions for implementing ANY changes to the project configuration/setup like the preview port, start, build, install, test, and lint commands, or ANY direct reference to the `.project_manifest.yaml` file.
owner: system
source_ecosystem: kavia-system
slash_command:
  command: manifest-guidelines
  enabled: true
---

# manifest_editing_guidelines

=== Manifest Editing Guidelines ===
Modify ONLY the specific field(s) requested.
Preserve all other existing values and YAML structure.
Never add or remove containers through manifest edits.

IMPORTANT: Container ports, commands, and runtime settings are managed EXCLUSIVELY through .project_manifest.yaml.
Never modify framework config files (vite.config.js, package.json scripts, etc.) for these settings unless explicitly requested by the user.

=== Read-Only Fields (NEVER modify) ===
- container_type: System-assigned during container creation
- env: Managed by environment variable system

=== Multi-Container Architecture ===
A single repository may contain multiple containers (microservices, frontends, backends, databases, workers).
Each independently deployable service should be a separate container entry in the containers[] array.

Indicators of separate containers:
- Directories with their own dependency files (package.json, requirements.txt, go.mod)
- Services listed in docker-compose.yml
- Separate main entry points in different directories

=== Editable Container Fields ===
container_name       : Unique key for PreviewManager tracking and dependent_containers references
description          : Human-readable container purpose shown in logs
interfaces           : Documents exposed APIs/protocols for dependent containers
workspace            : Parent directory; joined with base_path to locate container files
container_root       : Directory where the commands are executed. Can contain e.g., src/, .env, node_modules/; 
port                 : Allocated by PreviewManager, passed to startCommand via <port> placeholder
framework            : Determines command template resolution and runtime behavior
type                 : Legacy field, typically empty string
visual_edit_enabled  : Enables live visual editing proxy for frontend containers
visual_edit_port     : Visual edit proxy port (default 4000, requires visual_edit_enabled)
startCommand         : Shell command executed by PreviewManager to run the container
buildCommand         : Shell command for compilation during dependency update phase
installCommand       : Shell command for dependency installation before container start
testCommand          : Shell command or script path for running tests (e.g., "npm run test", "pytest")
lintCommand          : Shell command or script path for linting (e.g., "npm run lint", "./../.init/.linter.sh")
lintConfig           : Lint configuration content or path, typically empty string
generateOpenapiCommand: Shell command producing OpenAPI spec for backend documentation
dependent_containers : Containers this one depends on; started before this container; cycles not allowed
routes               : List of {path, endpoint}; first path appended to container URL
apiSpec              : OpenAPI JSON file path served at /openapi.json for backends
auth                 : Object with loginEndpoint, registerEndpoint, roles list
schema               : Database schema definition path (database containers only)
migrations           : Database migration scripts path (database containers only)
seed                 : Database seed data path (database containers only)

=== Container Details (container_details object) ===
Structure varies by container type, follow the existing standard:

Frontend containers:
  features           : List of feature descriptions
  colors             : Object with primary, secondary, accent, background (HEX format)
  theme              : UI theme: "light", "dark", "custom", or "selectable"
  layout_description : Description of the container layout structure
  style              : Style description (e.g., "modern, minimalistic")

Backend containers:
  endpoints          : List of API endpoint descriptions (e.g., "POST /products - Create a new product")
  validation         : List of validation rules for the API

=== Editable Overview Fields ===
overview.project_name        : Project identifier in logs and manifest resolution
overview.description         : Human-readable project summary
overview.third_party_services: External services list (Stripe, Supabase, Firebase, etc.)
overview.sessionStartupCommand : Optional bash command run once per session at startup,
                        before container previews begin. Runs with sudo/root
                        access for infrastructure-level configuration. Empty
                        string by default; no effect when empty. Output is
                        logged to sessionStartupCommand.log.
                        Use cases:
                        - Install system packages: "apt-get update -y && apt-get install -y build-essential"
                        - Install an SDK: "apt-get update -y && apt-get install -y openjdk-21-jdk"
                        - Install a runtime: "curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs"
                        - Install the .NET SDK: "wget https://dot.net/v1/dotnet-install.sh -O /tmp/dotnet-install.sh && chmod +x /tmp/dotnet-install.sh && /tmp/dotnet-install.sh --channel 9.0"
                        - Install multiple tools: "apt-get update -y && apt-get install -y redis-server postgresql-client awscli"

=== Command Placeholders ===
<port> : Replaced with allocated port number at runtime
<host> : Replaced with host address at runtime (typically 0.0.0.0)

=== Valid Command Examples ===
# React frontend
startCommand: "PORT=<port> HOST=<host> BROWSER=none npm start"
buildCommand: "npm install && npx tsc --noEmit && npm test -- --ci"
installCommand: "npm install"
testCommand: "npm run test"
lintCommand: "./../.init/.linter.sh"

# Vite frontend
startCommand: "npm run dev -- --port <port> --host <host>"
buildCommand: "npm install && npm run build"
installCommand: "npm install"
testCommand: "npm run build"
lintCommand: "./../.init/.linter.sh"

# FastAPI backend
startCommand: "source venv/bin/activate && uvicorn src.api.main:app --host <host> --port <port>"
buildCommand: "python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
installCommand: "source venv/bin/activate && pip install -r requirements.txt"
testCommand: "pytest"
lintCommand: "./../.init/.linter.sh"
generateOpenapiCommand: "python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python -m src.api.generate_openapi"

=== Before Submitting Changes ===
Verify: only requested field(s) changed, all other values match original, YAML structure preserved.
