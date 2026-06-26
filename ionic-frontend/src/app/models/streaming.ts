// ==========================================
// MODELLI EPISODIO E PLAYER
// ==========================================

export interface UserInteraction {
    progress?: number
    isCompleted?: number
    isDropped?: number
    isLiked?: number
    [key: string]: any
}

export interface StreamingEpisode {
    EpisodeID: number | string
    EpisodeNumber: number
    Title: string
    Description?: string
    Duration?: number
    ReleaseDate?: string
    progress?: number
    isLiked?: number
    isCompleted?: number
    userInteraction?: UserInteraction
    EpisodeTimes?: any[]
    ThumbnailURI?: string
    StreamURI?: string
    Likes?: number
    Streams?: number
    SubLanguages?: string[]
    DubLanguages?: string[]

    [key: string]: any
}

export interface StreamingSeason {
    SeasonID: number | string
    SeasonNumber: number
    Title?: string
    [key: string]: any
}

// ==========================================
// MODELLI COMMENTI E DISCUSSIONI
// ==========================================

export interface StreamingDiscussion {
    DiscussionID: number | string
    Type: string
    CloseDate?: string
    ForceClosed?: number
    [key: string]: any
}

export interface StreamingComment {
    CommentID: number;
    CommentText: string;
    cleanText?: string;
    Username: string;
    REF_UserID: number;
    DateCommented: string;
    REF_CommentID?: number | null;
    Likes?: number;
    isLiked?: number;
    isReported?: number;
    isApproved?: number;
    isHidden?: number;
    ReportCount?: number;
    replyTag?: string | null;
    replies?: StreamingComment[]; 
    parsedChunks?: any[]; 
    [key: string]: any;
}