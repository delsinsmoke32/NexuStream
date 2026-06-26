

// --- LISTE E TABELLE ---
export interface CataloguerShow {
    ShowID: number;
    Title: string;
    Description: string;
    DateStarted?: string;
    DateEnded?: string;
    hasEnded?: number;
    [key: string]: any;
}

export interface CataloguerSeason {
    SeasonID: number;
    SeasonNumber: number;
    Title: string;
    Description: string;
    DateStarted?: string;
    DateEnded?: string;
    [key: string]: any;
}

export interface CataloguerEpisode {
    EpisodeID: number;
    EpisodeNumber: number;
    Title: string;
    Description: string;
    Duration: number;
    ReleaseDate: string;
    DubLanguages?: string;
    SubLanguages?: string;
    [key: string]: any;
}

// PROPIC
export interface PropicGroup {
    bundle: string;
    images: string[];
}

// --- SHOW MODAL ---
export interface ShowModalData {
    Title: string;
    Description: string;
    DateStarted?: string;
    DateEnded?: string;
    ThumbnailURI?: string;
    BannerURI?: string;
    [key: string]: any;
}

export interface ShowPayload {
    title_it: string;
    description_it: string;
    title_en?: string;
    description_en?: string;
    dateStarted: string;
    dateEnded?: string;
    thumbnailURI: string | null;
    bannerURI: string | null;
}

// --- SEASON MODAL ---
export interface SeasonModalData {
    Title: string;
    Description: string;
    DateStarted?: string;
    DateEnded?: string;
    SeasonNumber?: number;
    [key: string]: any;
}

export interface SeasonPayload {
    title_it: string;
    description_it: string;
    title_en?: string;
    description_en?: string;
    dateStarted: string;
    dateEnded?: string;
    seasonNumber: number;
}

// --- EPISODE MODAL ---
export interface EpisodeMarker {
    StartTime: number | null;
    EndTime: number | null;
    Type: string;
}

export interface TrackData {
    lang: string;
    file: File | null;
}

export interface EpisodePayload {
    title_it: string;
    description_it: string;
    title_en?: string;
    description_en?: string;
    releaseDate: string;
    duration: number;
    episodeNumber: number;
    refSeason: number;
    thumbnailURI: string | null;
    rawVideoURI?: string | null;
    audioTracks: { lang: string; uri: string }[];
    subTracks: { lang: string; uri: string }[];
    times: EpisodeMarker[];
}