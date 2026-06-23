export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    username: string;
    audioLanguageId: string;
    textLanguageId: string;
    appLanguageId: string;
    propicURI: string;
}

export interface AuthResponse {
    token: string;
    user: any; 
}