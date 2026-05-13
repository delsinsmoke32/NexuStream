-- Disabilita temporaneamente i vincoli se necessario (opzionale per SQLite)
PRAGMA foreign_keys = OFF;

-- Tabelle di collegamento (LINKs) e tabelle dipendenti
DROP TABLE IF EXISTS "LINKs_User_Interacts_Comment";
DROP TABLE IF EXISTS "LINKs_User_Likes_Show";
DROP TABLE IF EXISTS "LINKs_User_Interacts_Episode";
DROP TABLE IF EXISTS "Comments";
DROP TABLE IF EXISTS "EpisodeLanguage";
DROP TABLE IF EXISTS "EpisodeTimes";
DROP TABLE IF EXISTS "EpisodeSub";
DROP TABLE IF EXISTS "Episodes";
DROP TABLE IF EXISTS "Seasons";

-- Tabelle principali (Padri)
DROP TABLE IF EXISTS "Users";
DROP TABLE IF EXISTS "Shows";
DROP TABLE IF EXISTS "Propics";
DROP TABLE IF EXISTS "SupportedLanguages";

-- Riabilita i vincoli
PRAGMA foreign_keys = ON;