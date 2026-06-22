// percorso: src/app/services/home.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HomeResponse, ContinueWatchingInteractPayload } from '../models/home';

/**
 * Servizio globale per la gestione dei contenuti della dashboard principale (Home).
 * Fornisce i feed di feed di serie più viste, più piaciute e la cronologia di visione.
 */
@Injectable({
    providedIn: 'root'
})
export class HomeService {
    constructor(private http: HttpClient) {}

    /**
     * Recupera tutti i dati necessari a popolare la home page.
     * @returns Un Observable contenente le liste mostViewed, mostLiked e continueWatching.
     */
    getHomeData(): Observable<HomeResponse> {
        return this.http.get<HomeResponse>('api/home');
    }

    /**
     * Aggiorna lo stato di interazione di un episodio nel continua a guardare (es. rimozione).
     * @param showId ID della serie.
     * @param seasonId ID della stagione.
     * @param episodeId ID dell'episodio.
     * @param payload Oggetto contenente progressi, stati di completamento e abbandono.
     * @returns Un Observable con la risposta del server.
     */
    updateEpisodeInteraction(
        showId: number, 
        seasonId: number, 
        episodeId: number, 
        payload: ContinueWatchingInteractPayload
    ): Observable<any> {
        return this.http.post<any>(
            `api/shows/${showId}/seasons/${seasonId}/episodes/${episodeId}/interact`, 
            payload
        );
    }
}