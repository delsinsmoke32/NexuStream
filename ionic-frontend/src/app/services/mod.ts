import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModDiscussion, ModUser, ModComment, DiscussionPayload, BanPayload } from '../models/mod';

@Injectable({
    providedIn: 'root'
})
export class ModService {
    private http = inject(HttpClient);
    private baseUrl = 'api/mod';

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    // ==========================================
    // GESTIONE DISCUSSIONI
    // ==========================================

    getDiscussions(showClosed: number): Observable<ModDiscussion[]> {
        const params = new HttpParams().set('showClosed', showClosed.toString());
        return this.http.get<ModDiscussion[]>(`${this.baseUrl}/discussions`, {
            headers: this.getAuthHeaders(), params
        });
    }

    createDiscussion(payload: DiscussionPayload): Observable<any> {
        return this.http.post(`${this.baseUrl}/discussions`, payload, {
            headers: this.getAuthHeaders()
        });
    }

    updateDiscussion(id: number, payload: DiscussionPayload): Observable<any> {
        return this.http.patch(`${this.baseUrl}/discussions/${id}`, payload, {
            headers: this.getAuthHeaders()
        });
    }

    deleteDiscussion(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/discussions/${id}`, {
            headers: this.getAuthHeaders()
        });
    }

    // ==========================================
    // GESTIONE UTENTI E BAN
    // ==========================================

    getUsers(page: number, limit: number, search: string = ''): Observable<ModUser[]> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        
        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<ModUser[]>(`${this.baseUrl}/users`, {
            headers: this.getAuthHeaders(), params
        });
    }

    getUserComments(userId: number | string): Observable<ModComment[]> {
        return this.http.get<ModComment[]>(`${this.baseUrl}/users/${userId}/comments`, {
            headers: this.getAuthHeaders()
        });
    }

    banUser(userId: number, durationDays: number): Observable<any> {
        const payload: BanPayload = { targetUserId: userId, durationDays };
        return this.http.post(`${this.baseUrl}/users/${userId}/ban`, payload, {
            headers: this.getAuthHeaders()
        });
    }

    unbanUser(userId: number): Observable<any> {
        const payload = { targetUserId: userId };
        return this.http.post(`${this.baseUrl}/users/${userId}/unban`, payload, {
            headers: this.getAuthHeaders()
        });
    }
}