// percorso: src/app/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUser, UpdateRolesPayload } from '../models/admin';

/**
 * Servizio per le operazioni di amministrazione del sistema.
 * Gestisce il fetch della lista utenti e l'assegnazione dei ruoli.
 */
@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private baseUrl = 'api/admin/users';

    constructor(private http: HttpClient) {}

    /**
     * Recupera il token dal localStorage e genera gli header di autenticazione.
     */
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            Authorization: `Bearer ${token}`,
        });
    }

    /**
     * Recupera la lista degli utenti con paginazione e ricerca opzionale.
     * @param page Il numero di pagina corrente.
     * @param limit Il limite di risultati per pagina.
     * @param searchTerm Il termine di ricerca opzionale.
     * @returns Un Observable contenente l'array di utenti.
     */
    getUsers(page: number, limit: number, searchTerm: string = ''): Observable<AdminUser[]> {
        // HttpParams gestisce l'URL encoding in modo sicuro
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (searchTerm) {
            params = params.set('search', searchTerm);
        }

        return this.http.get<AdminUser[]>(this.baseUrl, { 
            headers: this.getAuthHeaders(),
            params: params
        });
    }

    /**
     * Aggiorna i ruoli (Moderatore, Catalogatore) di un utente specifico.
     * @param userId L'ID dell'utente da modificare.
     * @param payload L'oggetto contenente il nuovo stato dei flag isMod e isCataloguer.
     * @returns Un Observable con la risposta del server.
     */
    updateUserRoles(userId: number | string, payload: UpdateRolesPayload): Observable<{ message?: string }> {
        return this.http.patch<{ message?: string }>(`${this.baseUrl}/${userId}/roles`, payload, {
            headers: this.getAuthHeaders()
        });
    }
}