# SQLite integration and operations

Former skill: `sqlite_app`

Instructions for building applications with sqlite database integration and operations.

=== SQLite Container CRITICAL Rules ===
- ALWAYS read connection from db_connection.txt: typically 'python db_shell.py' or sqlite3 command
- Execute SQL statements ONE AT A TIME via execute_immediate_return_command
- NEVER create .sql files for DDL/DML unless explicitly requested
- If using python db_shell.py: pipe SQL via echo or use -c flag
- If using sqlite3: use sqlite3 <database.db> "SQL_STATEMENT" format
- For mock data: execute each INSERT statement individually
- Ensure database file path is correct when executing commands
