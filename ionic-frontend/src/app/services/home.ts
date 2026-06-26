// percorso: src/app/services/home.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HomeResponse } from '../models/home';

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
     * Rimuove l'intera serie dal "Continua a guardare" dell'utente.
     * @param showId ID della serie da rimuovere.
     * @returns Un Observable con la risposta del server.
     */
    removeShowFromContinueWatching(showId: number): Observable<any> {
        return this.http.post<any>(
            `api/shows/${showId}/removeContinueWatching`, 
            {}
        );
    }
}