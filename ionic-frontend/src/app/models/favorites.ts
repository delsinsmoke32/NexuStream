export interface FavoriteShow {
    ShowID: number;
    id?: number; // Fallback utilizzato nel tuo metodo playAnime
    Title?: string;
    ThumbnailURI?: string;
    // Permettiamo eventuali campi extra per non bloccare i dati passati alla ShowCardComponent
    [key: string]: any; 
}

export interface FavoriteInteractionPayload {
    showId: number;
    isLiked: number;
}