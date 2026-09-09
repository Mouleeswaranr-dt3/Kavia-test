# MySQL integration and operations

Former skill: `mysql_app`

Instructions for building applications with mysql database integration and operations.

=== MySQL Container CRITICAL Rules ===
- ALWAYS read connection from db_connection.txt: typically contains 'mysql -u<user> -p<password> <database>'
- Execute SQL statements ONE LINE AT A TIME via execute_immediate_return_command
- NEVER create .sql files for DDL/DML unless explicitly requested
- Use mysql -e "SQL_STATEMENT" format for each command
- Avoid multi-line SQL blocks - split CREATE TABLE, INSERT statements separately
- For mock data: execute each INSERT statement individually
- Use proper escaping for quotes in SQL strings when using shell execution
