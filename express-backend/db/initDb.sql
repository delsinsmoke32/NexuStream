CREATE TABLE IF NOT EXISTS "SupportedLanguages" (
    "LanguageID" TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "Propics" (
    "PropicPath" TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "Shows" (
    "ShowID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "DateStarted" TEXT NOT NULL,
    "hasEnded" INTEGER NOT NULL,
    "DateEnded" TEXT NULL,
    "Favourited" INTEGER NOT NULL,
    "Description" TEXT NOT NULL,
    "Title" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Seasons" (
    "SeasonID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "REF_ShowID" INTEGER NOT NULL,
    "DateStarted" TEXT NOT NULL,
    "hasEnded" INTEGER NOT NULL,
    "DateEnded" TEXT NULL,
    "Description" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    FOREIGN KEY ("REF_ShowID") REFERENCES "Shows" ("ShowID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Episodes" (
    "EpisodeID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "ReleaseDate" TEXT NOT NULL,
    "REF_SeasonID" INTEGER NOT NULL,
    "Duration" INTEGER NOT NULL,
    "Likes" INTEGER NOT NULL,
    "Streams" INTEGER NOT NULL,
    "Description" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    FOREIGN KEY ("REF_SeasonID") REFERENCES "Seasons" ("SeasonID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Users" (
    "UserID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "Email" TEXT NOT NULL UNIQUE,
    "Password" TEXT NOT NULL,
    "Username" TEXT NOT NULL,
    "isMod" INTEGER NOT NULL,
    "isCataloguer" INTEGER NOT NULL,
    "isAdmin" INTEGER NOT NULL,
    "REF_LanguageID" TEXT NOT NULL,
    "REF_PropicID" TEXT NOT NULL,
    FOREIGN KEY ("REF_LanguageID") REFERENCES "SupportedLanguages" ("LanguageID"),
    FOREIGN KEY ("REF_PropicID") REFERENCES "Propics" ("PropicPath")
);

CREATE TABLE IF NOT EXISTS "Comments" (
    "CommentID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "REF_UserID" INTEGER NOT NULL,
    "REF_EpisodeID" INTEGER NOT NULL,
    "DateCommented" TEXT NOT NULL,
    "REF_CommentID" INTEGER NOT NULL,
    "isHidden" INTEGER NOT NULL,
    "Likes" INTEGER NOT NULL,
    "isApproved" INTEGER NOT NULL,
    FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID"),
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID"),
    FOREIGN KEY ("REF_CommentID") REFERENCES "Comments" ("CommentID")
);

CREATE TABLE IF NOT EXISTS "LINKs_User_Interacts_Episode" (
    "REF_UserID" INTEGER NOT NULL,
    "REF_EpisodeID" INTEGER NOT NULL,
    "LastWatchedDate" TEXT NOT NULL,
    "Progress" INTEGER NOT NULL,
    "isCompleted" INTEGER NOT NULL,
    "isDropped" INTEGER NOT NULL,
    "isLiked" INTEGER NOT NULL,
    FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID"),
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID")
);

CREATE TABLE IF NOT EXISTS "LINKs_User_Likes_Show" (
    "REF_UserID" INTEGER NOT NULL,
    "REF_ShowID" INTEGER NOT NULL,
    PRIMARY KEY ("REF_UserID", "REF_ShowID"),
    FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID"),
    FOREIGN KEY ("REF_ShowID") REFERENCES "Shows" ("ShowID")
);

CREATE TABLE IF NOT EXISTS "LINKs_User_Interacts_Comment" (
    "REF_CommentID" INTEGER NOT NULL,
    "REF_UserID" INTEGER NOT NULL,
    "isLiked" INTEGER NOT NULL,
    "isReported" INTEGER NOT NULL,
    PRIMARY KEY ("REF_CommentID", "REF_UserID"),
    FOREIGN KEY ("REF_CommentID") REFERENCES "Comments" ("CommentID"),
    FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID")
);

CREATE TABLE IF NOT EXISTS "EpisodeLanguage" (
    "REF_EpisodeID" INTEGER PRIMARY KEY NOT NULL,
    "Language" TEXT NOT NULL,
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID")
);

CREATE TABLE IF NOT EXISTS "EpisodeTimes" (
    "REF_EpisodeID" INTEGER NOT NULL,
    "StartTime" INTEGER NOT NULL,
    "EndTime" INTEGER NOT NULL,
    "Type" TEXT NOT NULL,
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID")
);

CREATE TABLE IF NOT EXISTS "EpisodeSub" (
    "REF_EpisodeID" INTEGER PRIMARY KEY NOT NULL,
    "Language" TEXT NOT NULL,
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID")
);