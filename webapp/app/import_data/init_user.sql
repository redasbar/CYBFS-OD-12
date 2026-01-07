-- Run as Postgres admin
CREATE USER librauser WITH PASSWORD 'yourpasswordhere';
CREATE USER miguser WITH PASSWORD 'sdlgih865qfkjdmqDoOàSf84Fzse1Li8';

-- Grant limited permissions on the app DB
GRANT CONNECT ON DATABASE "LibraTech_db" TO librauser;
GRANT CONNECT ON DATABASE "LibraTech_db" TO miguser;


\connect "LibraTech_db";
GRANT USAGE ON SCHEMA public TO librauser;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO librauser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO librauser;
GRANT USAGE, CREATE ON SCHEMA public TO miguser;
