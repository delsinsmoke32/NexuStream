// percorso: src/app/services/shows.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShowDetails, Season, Episode } from '../models/shows';

/**
 * Servizio per la gestione dei dettagli delle serie TV, delle stagioni e dei relativi episodi.
 */
@Injectable({
    providedIn: 'root'
})
export class ShowsService {
    constructor(private http: HttpClient) {}

    /**
     * Recupera le informazioni dettagliate di uno specifico show.
     * @param showId L'identificativo univoco dello show.
     * @returns Un Observable contenente i dettagli dello show.
     */
    getShowDetails(showId: string): Observable<ShowDetails> {
        return this.http.get<ShowDetails>(`api/shows/${showId}`);
    }

    /**
     * Recupera l'elenco delle stagioni associate a uno specifico show.
     * @param showId L'identificativo univoco dello show.
     * @returns Un Observable contenente l'array delle stagioni.
     */
    getShowSeasons(showId: string): Observable<Season[]> {
        return this.http.get<Season[]>(`api/shows/${showId}/seasons`);
    }

    /**
     * Recupera l'elenco degli episodi di una determinata stagione legata a uno show.
     * @param showId L'identificativo univoco dello show.
     * @param seasonId L'identificativo univoco della stagione.
     * @returns Un Observable contenente l'array degli episodi.
     */
    getEpisodes(showId: string, seasonId: number): Observable<Episode[]> {
        return this.http.get<Episode[]>(`api/shows/${showId}/seasons/${seasonId}/episodes`);
    }

    /**
     * Aggiorna lo stato dei preferiti (interazione dell'utente) per uno show specifico.
     * @param showId L'identificativo univoco dello show.
     * @param isLiked Il nuovo stato di gradimento (1 per aggiunto, 0 per rimosso).
     * @returns Un Observable con la risposta del server.
     */
    toggleFavoriteStatus(showId: string, isLiked: number): Observable<any> {
        return this.http.post<any>(`api/shows/${showId}/interact`, { isLiked });
    }
}