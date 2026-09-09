# PostgreSQL integration and operations

Former skill: `postgresql_app`

Instructions for building applications with postgresql database integration and operations.

=== PostgreSQL Container CRITICAL Rules ===
- ALWAYS read connection from db_connection.txt: typically contains 'psql postgresql://...'
- Execute SQL statements ONE AT A TIME via execute_immediate_return_command
- NEVER create .sql files for DDL/DML unless explicitly requested  
- Use psql -c "SQL_STATEMENT" format for each command
- Split complex operations: CREATE TABLE in one call, each INSERT in separate calls
- For mock data: execute each INSERT statement individually
- Handle special characters in SQL by proper shell escaping
