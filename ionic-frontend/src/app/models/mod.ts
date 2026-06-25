// ==========================================
// INTERFACCE LETTURA (GET)
// ==========================================

export interface ModDiscussion {
    DiscussionID: number;
    REF_EpisodeID: number;
    Type: string;
    CloseDate: string;
    ForceClosed: number;
    ShowTitle?: string;
    SeasonNumber?: number;
    EpisodeNumber?: number;
    EpisodeTitle?: string;
    [key: string]: any; 
}

export interface ModComment {
    CommentID: number;
    REF_UserID: number;
    Body?: string; 
    Timestamp?: number;
    isApproved?: number;
    isHidden?: number;
    CommentText?: string;
    DateCommented?: string;
    ReportCount?: number;
    Likes?: number;
    [key: string]: any;
}

export interface ModUser {
    UserID: number;
    Username: string;
    Email: string;
    canComment: number;
    BannedUntil: string | null;
    comments?: ModComment[] | null; 
    REF_PropicURI?: string;
    [key: string]: any;
}

// ==========================================
// INTERFACCE SCRITTURA (POST/PATCH)
// ==========================================

export interface DiscussionPayload {
    REF_EpisodeID?: number; 
    type: string;
    closeDate: string;
    forceClosed?: number; 
}

export interface BanPayload {
    targetUserId: number;
    durationDays?: number;
}