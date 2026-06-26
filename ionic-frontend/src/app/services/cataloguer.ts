// percorso: src/app/services/cataloguer.ts

import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import {
    EpisodeMarker,
    CataloguerShow,
    CataloguerSeason,
    CataloguerEpisode,
    PropicGroup,
} from '../models/cataloguer'

/**
 * Servizio dedicato alle operazioni CRUD e di caricamento media del Catalogatore.
 */
@Injectable({
    providedIn: 'root',
})
export class CataloguerService {
    private baseUrl = 'api/cataloguer'

    constructor(private http: HttpClient) {}

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token')
        return new HttpHeaders({ Authorization: `Bearer ${token}` })
    }

    // ==========================================
    // METODI LETTURA E CANCELLAZIONE (LISTE)
    // ==========================================

    getShows(
        page: number,
        limit: number,
        search: string = ''
    ): Observable<CataloguerShow[]> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString())
        if (search) params = params.set('search', search)

        return this.http.get<CataloguerShow[]>(`${this.baseUrl}/shows`, {
            headers: this.getAuthHeaders(),
            params,
        })
    }

    deleteShow(showId: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/shows/${showId}`, {
            headers: this.getAuthHeaders(),
        })
    }

    getSeasons(showId: number): Observable<CataloguerSeason[]> {
        const params = new HttpParams().set('refShow', showId.toString())
        return this.http.get<CataloguerSeason[]>(`${this.baseUrl}/seasons`, {
            headers: this.getAuthHeaders(),
            params,
        })
    }

    deleteSeason(seasonId: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/seasons/${seasonId}`, {
            headers: this.getAuthHeaders(),
        })
    }

    getEpisodes(seasonId: number): Observable<CataloguerEpisode[]> {
        const params = new HttpParams().set('refSeason', seasonId.toString())
        return this.http.get<CataloguerEpisode[]>(`${this.baseUrl}/episodes`, {
            headers: this.getAuthHeaders(),
            params,
        })
    }

    deleteEpisode(episodeId: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/episodes/${episodeId}`, {
            headers: this.getAuthHeaders(),
        })
    }

    getPropics(): Observable<PropicGroup[]> {
        return this.http.get<PropicGroup[]>(`${this.baseUrl}/propics`, {
            headers: this.getAuthHeaders(),
        })
    }

    deletePropic(propicURI: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/propics`, {
            headers: this.getAuthHeaders(),
            body: { propicURI },
        })
    }

    // ==========================================
    // METODI CREAZIONE (ADD) E MODIFICA (PATCH)
    // ==========================================

    addItem(
        level: 'shows' | 'seasons' | 'episodes',
        payload: any
    ): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/${level}/add`, payload, {
            headers: this.getAuthHeaders(),
        })
    }

    updateItem(
        level: 'shows' | 'seasons' | 'episodes',
        id: number,
        payload: any
    ): Observable<any> {
        return this.http.patch<any>(`${this.baseUrl}/${level}/${id}`, payload, {
            headers: this.getAuthHeaders(),
        })
    }

    uploadPropic(bundleName: string, file: File): Observable<any> {
        const formData = new FormData()

        formData.append('img', file, file.name)
        formData.append('bundle', bundleName)

        // NOTA: Non impostiamo il Content-Type!
        // Angular e il browser lo imposteranno automaticamente a 'multipart/form-data' calcolando il boundary corretto.
        return this.http.post<any>(`${this.baseUrl}/propics/add`, formData, {
            headers: this.getAuthHeaders(),
        })
    }

    // ==========================================
    // METODI MEDIA E GESTIONE TRACCE/MARKER
    // ==========================================

    uploadShowImage(
        file: File,
        type: 'thumbnail' | 'banner'
    ): Observable<{ uri: string }> {
        const formData = new FormData()
        formData.append(type, file, file.name)

        const endpoint =
            type === 'thumbnail'
                ? 'api/upload/show_thumbnails'
                : 'api/upload/banners'
        return this.http.post<{ uri: string }>(endpoint, formData, {
            headers: this.getAuthHeaders(),
        })
    }

    getEpisodeMarkers(episodeId: number): Observable<EpisodeMarker[]> {
        return this.http.get<EpisodeMarker[]>(
            `${this.baseUrl}/episodes/${episodeId}/times`,
            {
                headers: this.getAuthHeaders(),
            }
        )
    }

    getEpisodeTracks(
        episodeId: number,
        type: 'audio' | 'subs'
    ): Observable<EpisodeMarker[]> {
        return this.http.get<EpisodeMarker[]>(
            `${this.baseUrl}/episodes/${episodeId}/tracks/${type}`,
            {
                headers: this.getAuthHeaders(),
            }
        )
    }

    deleteEpisodeTrack(
        episodeId: number,
        type: 'audio' | 'subs',
        lang: string
    ): Observable<any> {
        return this.http.delete(
            `${this.baseUrl}/episodes/${episodeId}/tracks/${type}/${lang}`,
            {
                headers: this.getAuthHeaders(),
            }
        )
    }

    uploadEpisodeMedia(
        file: File,
        type: 'thumbnail' | 'raw_video' | 'track'
    ): Observable<{ uri: string }> {
        const formData = new FormData()
        let endpoint = ''

        if (type === 'thumbnail') {
            formData.append('thumbnail', file, file.name)
            endpoint = 'api/upload/episode_thumbnails'
        } else if (type === 'raw_video') {
            formData.append('video_file', file, file.name)
            endpoint = 'api/upload/episodes/video/raw'
        } else if (type === 'track') {
            formData.append('track', file, file.name)
            endpoint = 'api/upload/episodes/track'
        }

        return this.http.post<{ uri: string }>(endpoint, formData, {
            headers: this.getAuthHeaders(),
        })
    }
}
