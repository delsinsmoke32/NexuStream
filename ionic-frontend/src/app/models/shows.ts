export interface ShowDetails {
    ShowID: number | string;
    Title: string;
    Description?: string;
    ThumbnailURI?: string;
    isFavorited: number;
    BannerURI?: string;
    genres?: any[];
    audio?: string[];
    subs?: string[];
    [key: string]: any;
}

export interface Season {
    SeasonID: number;
    SeasonNumber: number;
    Title?: string;
    Description?: string;
    [key: string]: any;
}

export interface Episode {
    EpisodeID: number;
    EpisodeNumber: number;
    Title: string;
    progress: number;
    isCompleted: number;
    [key: string]: any;
}

export interface InteractionPayload {
    isLiked: number;
}