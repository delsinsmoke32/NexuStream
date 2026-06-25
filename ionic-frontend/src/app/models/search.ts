export interface Genre {
    GenreID: number;
    Name: string;
    [key: string]: any;
}

export interface SearchResult {
    ShowID: number | string;
    Title?: string;
    ThumbnailURI?: string;
    [key: string]: any;
}