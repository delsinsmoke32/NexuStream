export interface FavoriteShow {
    ShowID: number;
    id?: number; 
    Title?: string;
    ThumbnailURI?: string;
    [key: string]: any; 
}

export interface FavoriteInteractionPayload {
    showId: number;
    isLiked: number;
}