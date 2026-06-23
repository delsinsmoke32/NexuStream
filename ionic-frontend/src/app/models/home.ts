export interface HomeShow {
    ShowID: number;
    Title: string;
    ThumbnailURI?: string;
    BannerURI?: string;
    Description?: string;
    [key: string]: any;
}

export interface ContinueWatchingItem {
    ShowID: number;
    SeasonID: number;
    EpisodeID: number;
    Title?: string;
    EpisodeTitle?: string;
    Progress: number;
    isLiked?: number;
    [key: string]: any;
}

export interface HomeResponse {
    mostViewed: HomeShow[];
    mostLiked: HomeShow[];
    continueWatching: ContinueWatchingItem[];
}

export interface ContinueWatchingInteractPayload {
    progress: number;
    isCompleted: number;
    isDropped: number;
    isLiked: number;
}