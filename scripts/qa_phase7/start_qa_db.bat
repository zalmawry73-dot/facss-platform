@echo off
set "QA=C:\Users\user\.gemini\antigravity-ide\brain\27d77ed7-2c9a-4acc-acb8-be355b0d4ada\scratch\qa"
set "PGBIN=C:\Program Files\PostgreSQL\16\bin"

"%PGBIN%\pg_ctl.exe" start -D "%QA%\pg" -o "-p 5544" -l "%QA%\pg.log" -w
"%PGBIN%\psql.exe" -h 127.0.0.1 -p 5544 -U postgres -d facss_qa -c "select current_database(), inet_server_port();"
