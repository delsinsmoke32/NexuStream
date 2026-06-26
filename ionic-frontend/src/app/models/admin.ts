export interface AdminUser {
    UserID: number | string
    isAdmin: number
    isMod: number
    isCataloguer: number
    Username?: string
    Email?: string
    REF_PropicURI?: string
    [key: string]: any
}

export interface UpdateRolesPayload {
    isMod: number
    isCataloguer: number
}
