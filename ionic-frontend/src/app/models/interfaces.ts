// --- Tabelle Principali ---

export interface User {
    UserID: bigint;
    Email: string;
    Username: string;
    isMod: boolean;
    isCataloguer: boolean;
    isAdmin: boolean;
    REF_LanguageID: string; 
    REF_PropicID: string;   
}

export interface Episode {
    EpisodeID: bigint;
    ReleaseDate: Date | string;
    REF_SeasonID: bigint;
    Duration: bigint;
    Likes: bigint;
    Streams: bigint;
    Description: string;
    Title: string;
}

export interface Comment {
    CommentID: bigint;
    REF_UserID: bigint;
    REF_EpisodeID: bigint;
    DateCommented: Date | string;
    REF_CommentID: bigint; 
    isHidden: boolean;
    Likes: bigint;
    isApproved: boolean;
}

export interface Season {
    SeasonID: bigint;
    REF_ShowID: bigint;
    DateStarted: Date | string;
    hasEnded: boolean;
    DateEnded: Date | string | null;
    Description: string;
    Title: string;
}

export interface Show {
    ShowID: bigint;
    DateStarted: bigint; 
    hasEnded: boolean;
    DateEnded: Date | string | null;
    Favourited: bigint;
    Description: string;
    Title: string;
}

// --- Tabelle di Supporto / Dettaglio ---

export interface SupportedLanguage {
    LanguageID: string; 
}

export interface Propic {
    PropicPath: string; 
}

export interface EpisodeLanguage {
    REF_EpisodeID: bigint;
    Language: string;
}

export interface EpisodeSub {
    REF_EpisodeID: bigint;
    Language: string;
}

export interface EpisodeTime {
    REF_EpisodeID: bigint;
    StartTime: bigint;
    EndTime: bigint;
    Type: string;
}

// --- Tabelle di Relazione (LINKs) ---

export interface UserInteractsEpisode {
    REF_UserID: bigint;
    REF_EpisodeID: bigint;
    LastWatchedDate: Date | string;
    Progress: bigint;
    isCompleted: boolean;
    isDropped: boolean;
    isLiked: boolean;
}

export interface UserLikesShow {
    REF_UserID: bigint;
    REF_ShowID: bigint;
}

export interface UserInteractsComment {
    REF_CommentID: bigint;
    REF_UserID: bigint;
    isLiked: boolean;
    isReported: boolean;
}

export {};