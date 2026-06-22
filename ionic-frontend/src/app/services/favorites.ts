// percorso: src/app/services/favorites.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FavoriteShow, FavoriteInteractionPayload } from '../models/favorites';

/**
 * Servizio per la gestione dei preferiti dell'utente.
 * Si occupa di recuperare la lista salvata e di gestire le interazioni (aggiunta/rimozione).
 */
@Injectable({
    providedIn: 'root'
})
export class FavoritesService {
    constructor(private http: HttpClient) {}

    /**
     * Recupera la lista di tutte le serie aggiunte ai preferiti dall'utente corrente.
     * @returns Un Observable contenente l'array degli show preferiti.
     */
    getFavorites(): Observable<FavoriteShow[]> {
        return this.http.get<FavoriteShow[]>('api/shows/favorites');
    }

    /**
     * Invia un'interazione al backend per rimuovere uno show specifico dai preferiti.
     * @param showId L'identificativo univoco dello show da rimuovere.
     * @returns Un Observable con la risposta del server.
     */
    removeFavorite(showId: number): Observable<any> {
        const payload: FavoriteInteractionPayload = { showId: showId, isLiked: 0 };
        return this.http.post<any>(`api/shows/${showId}/interact`, payload);
    }
}