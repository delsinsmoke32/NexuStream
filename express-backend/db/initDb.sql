CREATE TABLE IF NOT EXISTS "SupportedLanguages" (
    "LanguageID" TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "Genres" (
    "GenreID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "Name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Propics" (
    "PropicURI" TEXT PRIMARY KEY NOT NULL,
    "Bundle" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Shows" (
    "ShowID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "DateStarted" TEXT NOT NULL,
    "hasEnded" INTEGER NOT NULL,
    "DateEnded" TEXT NULL,
    "Favourited" INTEGER NOT NULL,
    "Title" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "ThumbnailURI" TEXT NOT NULL,
    "BannerURI" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Seasons" (
    "SeasonID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "REF_ShowID" INTEGER NOT NULL,
    "DateStarted" TEXT NOT NULL,
    "hasEnded" INTEGER NOT NULL,
    "DateEnded" TEXT NULL,
    "Title" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "SeasonNumber" INTEGER NOT NULL,
    FOREIGN KEY ("REF_ShowID") REFERENCES "Shows" ("ShowID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Episodes" (
    "EpisodeID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "ReleaseDate" TEXT NOT NULL,
    "REF_SeasonID" INTEGER NOT NULL,
    "Duration" INTEGER NOT NULL,
    "Likes" INTEGER NOT NULL,
    "Streams" INTEGER NOT NULL,
    "Title" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "ThumbnailURI" TEXT NOT NULL,
    "EpisodeNumber" INTEGER NOT NULL,
    FOREIGN KEY ("REF_SeasonID") REFERENCES "Seasons" ("SeasonID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Discussions" (
    "DiscussionID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "REF_EpisodeID" INTEGER NOT NULL,
    "OpenDate" TEXT NOT NULL,
    "CloseDate" TEXT NOT NULL,
    "ForceClosed" INTEGER NOT NULL,
    "Type" TEXT NOT NULL,
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Users" (
    "UserID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "Email" TEXT NOT NULL UNIQUE,
    "Password" TEXT NOT NULL,
    "Username" TEXT NOT NULL,
    "isMod" INTEGER NOT NULL,
    "isCataloguer" INTEGER NOT NULL,
    "isAdmin" INTEGER NOT NULL,
    "REF_Audio_Language" TEXT NOT NULL,
    "REF_Text_Language" TEXT NOT NULL,
    "REF_App_Language" TEXT NOT NULL,
    "REF_PropicURI" TEXT NOT NULL,
    "canComment" INTEGER NOT NULL,
    FOREIGN KEY ("REF_Audio_Language") REFERENCES "SupportedLanguages" ("LanguageID"),
    FOREIGN KEY ("REF_Text_Language") REFERENCES "SupportedLanguages" ("LanguageID"),
    FOREIGN KEY ("REF_App_Language") REFERENCES "SupportedLanguages" ("LanguageID"),
    FOREIGN KEY ("REF_PropicURI") REFERENCES "Propics" ("PropicURI")
);

CREATE TABLE PasswordResets (
    "ResetID" INTEGER PRIMARY KEY AUTOINCREMENT,
    "REF_UserID" INTEGER NOT NULL,
    "Token" TEXT NOT NULL UNIQUE,
    "ExpiresAt" DATETIME NOT NULL,
    FOREIGN KEY("REF_UserID") REFERENCES "Users" ("UserID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Comments" (
    "CommentID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "REF_UserID" INTEGER NULL,
    "REF_DiscussionID" INTEGER NOT NULL,
    "CommentText" TEXT NOT NULL,
    "DateCommented" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "REF_CommentID" INTEGER NULL,
    "isHidden" INTEGER NOT NULL,
    "Likes" INTEGER NOT NULL,
    "isApproved" INTEGER NOT NULL,
    "ReportCount" INTEGER NOT NULL,
    FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID") ON DELETE SET NULL,
    FOREIGN KEY ("REF_DiscussionID") REFERENCES "Discussions" ("DiscussionID") ON DELETE CASCADE,
    FOREIGN KEY ("REF_CommentID") REFERENCES "Comments" ("CommentID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "LINKs_User_Interacts_Episode" (
    "REF_UserID" INTEGER NOT NULL,
    "REF_EpisodeID" INTEGER NOT NULL,
    "LastWatchedDate" TEXT NOT NULL,
    "Progress" INTEGER NOT NULL,
    "isCompleted" INTEGER NOT NULL,
    "isDropped" INTEGER NOT NULL,
    "isLiked" INTEGER NOT NULL,
    PRIMARY KEY ("REF_UserID", "REF_EpisodeID"),
    FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID") ON DELETE CASCADE,
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "LINKs_User_Likes_Show" (
    "REF_UserID" INTEGER NOT NULL,
    "REF_ShowID" INTEGER NOT NULL,
    PRIMARY KEY ("REF_UserID", "REF_ShowID"),
    FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID") ON DELETE CASCADE,
    FOREIGN KEY ("REF_ShowID") REFERENCES "Shows" ("ShowID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "LINKs_User_Interacts_Comment" (
    "REF_CommentID" INTEGER NOT NULL,
    "REF_UserID" INTEGER NOT NULL,
    "isLiked" INTEGER NOT NULL,
    "isReported" INTEGER NOT NULL,
    PRIMARY KEY ("REF_CommentID", "REF_UserID"),
    FOREIGN KEY ("REF_CommentID") REFERENCES "Comments" ("CommentID") ON DELETE CASCADE,
    FOREIGN KEY ("REF_UserID") REFERENCES "Users" ("UserID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "LINKs_Show_Has_Genre" (
    "REF_GenreID" INTEGER NOT NULL,
    "REF_ShowID" INTEGER NOT NULL,
    PRIMARY KEY ("REF_GenreID", "REF_ShowID"),
    FOREIGN KEY ("REF_GenreID") REFERENCES "Genres" ("GenreID") ON DELETE CASCADE,
    FOREIGN KEY ("REF_ShowID") REFERENCES "Shows" ("ShowID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "EpisodeLanguage" (
    "REF_EpisodeID" INTEGER NOT NULL,
    "REF_LanguageID" TEXT NOT NULL,
    PRIMARY KEY ("REF_EpisodeID", "REF_LanguageID"),
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID") ON DELETE CASCADE,
    FOREIGN KEY ("REF_LanguageID") REFERENCES "SupportedLanguages" ("LanguageID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "EpisodeTimes" (
    "REF_EpisodeID" INTEGER NOT NULL,
    "StartTime" INTEGER NOT NULL,
    "EndTime" INTEGER NOT NULL,
    "Type" TEXT NOT NULL,
    PRIMARY KEY ("REF_EpisodeID", "StartTime", "EndTime"),
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "EpisodeSubtitles" (
    "REF_EpisodeID" INTEGER NOT NULL,
    "REF_LanguageID" TEXT NOT NULL,
    PRIMARY KEY ("REF_EpisodeID", "REF_LanguageID"),
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID") ON DELETE CASCADE,
    FOREIGN KEY ("REF_LanguageID") REFERENCES "SupportedLanguages" ("LanguageID") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "EpisodeResolutions" (
    "REF_EpisodeID" INTEGER NOT NULL,
    "Resolution" TEXT NOT NULL,
    PRIMARY KEY ("REF_EpisodeID", "Resolution"),
    FOREIGN KEY ("REF_EpisodeID") REFERENCES "Episodes" ("EpisodeID") ON DELETE CASCADE
);