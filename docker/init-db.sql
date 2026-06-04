IF DB_ID('HomieeDb') IS NULL
BEGIN
    CREATE DATABASE HomieeDb;
END
GO

USE HomieeDb;
GO

IF NOT EXISTS (
    SELECT *
    FROM sys.sql_logins
    WHERE name = 'homiee_user'
)
BEGIN
    CREATE LOGIN homiee_user
    WITH PASSWORD = 'Homiee_App_Strong_Pass_2026!';
END
GO

IF NOT EXISTS (
    SELECT *
    FROM sys.database_principals
    WHERE name = 'homiee_user'
)
BEGIN
    CREATE USER homiee_user
    FOR LOGIN homiee_user;
END
GO

ALTER ROLE db_datareader
ADD MEMBER homiee_user;
GO

ALTER ROLE db_datawriter
ADD MEMBER homiee_user;
GO

ALTER ROLE db_ddladmin
ADD MEMBER homiee_user;
GO