// percorso: src/app/services/search.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Genre, SearchResult } from '../models/search';

/**
 * Servizio dedicato alle funzionalità di ricerca globale e filtraggio per genere.
 */
@Injectable({
    providedIn: 'root'
})
export class SearchService {
    constructor(private http: HttpClient) {}

    /**
     * Recupera l'elenco completo dei generi disponibili nel sistema per popolare i filtri.
     * @returns Un Observable contenente l'array dei generi.
     */
    getGenres(): Observable<Genre[]> {
        return this.http.get<Genre[]>('api/genres');
    }

    /**
     * Esegue una ricerca mirata combinando in modo opzionale un testo di query e un identificativo di genere.
     * @param query Testo inserito dall'utente nella barra di ricerca.
     * @param genreId ID del genere selezionato tramite chip filtri.
     * @returns Un Observable contenente l'array dei risultati trovati.
     */
    searchShows(query: string, genreId: number | null): Observable<SearchResult[]> {
        let params = new HttpParams().set('q', query.trim());

        if (genreId) {
            params = params.set('genre', genreId.toString());
        }

        return this.http.get<SearchResult[]>('api/search', { params });
    }
}