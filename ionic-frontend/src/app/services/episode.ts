import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

//  IMPORT DEI MODELLI
import { StreamingEpisode, StreamingSeason, StreamingDiscussion } from '../models/streaming';

@Injectable({ providedIn: 'root' })
export class EpisodeService {
    private http = inject(HttpClient);

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
    }

    getEpisode(showId: string, seasonId: string, episodeId: string): Observable<StreamingEpisode> {
        return this.http.get<StreamingEpisode>(`api/shows/${showId}/seasons/${seasonId}/episodes/${episodeId}`, this.getAuthHeaders());
    }

    getSeasonEpisodes(showId: string, seasonId: string): Observable<StreamingEpisode[]> {
        return this.http.get<StreamingEpisode[]>(`api/shows/${showId}/seasons/${seasonId}/episodes`, this.getAuthHeaders());
    }

    getDiscussions(showId: string, seasonId: string, episodeId: string): Observable<StreamingDiscussion[]> {
        return this.http.get<StreamingDiscussion[]>(`api/shows/${showId}/seasons/${seasonId}/episodes/${episodeId}/discussions`, this.getAuthHeaders());
    }

    getShowSeasons(showId: string): Observable<StreamingSeason[]> {
        return this.http.get<StreamingSeason[]>(`api/shows/${showId}/seasons`, this.getAuthHeaders());
    }

    interact(showId: string, seasonId: string, episodeId: string, body: any): Observable<any> {
        return this.http.post(`api/shows/${showId}/seasons/${seasonId}/episodes/${episodeId}/interact`, body, this.getAuthHeaders());
    }
}