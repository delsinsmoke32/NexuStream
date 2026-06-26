import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

//  IMPORT DEI MODELLI
import { StreamingComment } from '../models/streaming';

@Injectable({ providedIn: 'root' })
export class CommentsService {
    private http = inject(HttpClient);

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
    }

    private getBaseUrl(showId: string, seasonId: string, episodeId: string, discussionId: string) {
        return `api/shows/${showId}/seasons/${seasonId}/episodes/${episodeId}/discussions/${discussionId}/comments`;
    }

    getComments(showId: string, seasonId: string, episodeId: string, discussionId: string): Observable<StreamingComment[]> {
        return this.http.get<StreamingComment[]>(this.getBaseUrl(showId, seasonId, episodeId, discussionId), this.getAuthHeaders());
    }

    postComment(showId: string, seasonId: string, episodeId: string, discussionId: string, payload: any): Observable<any> {
        return this.http.post(this.getBaseUrl(showId, seasonId, episodeId, discussionId), payload, this.getAuthHeaders());
    }

    interact(showId: string, seasonId: string, episodeId: string, discussionId: string, commentId: number, payload: any): Observable<any> {
        return this.http.post(`${this.getBaseUrl(showId, seasonId, episodeId, discussionId)}/${commentId}/interact`, payload, this.getAuthHeaders());
    }

    moderateApprove(showId: string, seasonId: string, episodeId: string, discussionId: string, commentId: number, isApproved: number): Observable<any> {
        return this.http.patch(`${this.getBaseUrl(showId, seasonId, episodeId, discussionId)}/${commentId}/approve`, { isApproved }, this.getAuthHeaders());
    }

    moderateHide(showId: string, seasonId: string, episodeId: string, discussionId: string, commentId: number, isHidden: number): Observable<any> {
        return this.http.patch(`${this.getBaseUrl(showId, seasonId, episodeId, discussionId)}/${commentId}/hide`, { isHidden }, this.getAuthHeaders());
    }
}