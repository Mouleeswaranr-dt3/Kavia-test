# MongoDB integration and operations

Former skill: `mongodb_app`

Instructions for building applications with mongodb database integration and operations.

=== MongoDB Container CRITICAL Rules ===
- ALWAYS try to read connection from db_connection.txt: typically contains 'mongosh <connection-string>'
- Execute commands ONE AT A TIME via execute_immediate_return_command
- NEVER create .js or .json files for database operations unless explicitly requested
- Use mongosh syntax: db.collection.insertOne(), db.createCollection(), etc.
- Each operation must be a single command execution: mongosh -e "command"
- For mock data: execute insertOne/insertMany commands individually via CLI
- Handle connection errors by checking db_connection.txt exists and is valid
