export interface AdminUser {
    UserID: number | string;
    isAdmin: number;
    isMod: number;
    isCataloguer: number;
    Username?: string;
    Email?: string;
    PropicURI?: string;
    // Aggiungi un index signature per permettere eventuali campi extra restituiti dal backend
    [key: string]: any; 
}

export interface UpdateRolesPayload {
    isMod: number;
    isCataloguer: number;
}