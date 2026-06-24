import { inject, Injectable } from '@angular/core'
import { PropicGroup } from '@app/models/cataloguer'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from '@lib/rxjs/dist/types'

@Injectable({
    providedIn: 'root',
})
export class AvatarPicker {
    private baseUrl = 'api/propics'
    private http = inject(HttpClient)

    constructor() {}

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token')
        return new HttpHeaders({ Authorization: `Bearer ${token}` })
    }

    getPropics(): Observable<PropicGroup[]> {
        return this.http.get<PropicGroup[]>(`${this.baseUrl}/getAllBundled`, {
            headers: this.getAuthHeaders(),
        })
    }
}
