import { inject, Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from '@lib/rxjs/dist/types'

@Injectable({
    providedIn: 'root',
})
export class Settings {
    private baseUrl = 'api/users'
    private http = inject(HttpClient)

    constructor() {}

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token')
        return new HttpHeaders({ Authorization: `Bearer ${token}` })
    }

    changePropic(payload: {
        propicURI: string
    }): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            `${this.baseUrl}/change-propic`,
            payload,
            {
                headers: this.getAuthHeaders(),
            }
        )
    }

    changePassword(payload: {
        currentPassword: string
        newPassword: string
    }): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            `${this.baseUrl}/change-password`,
            payload,
            {
                headers: this.getAuthHeaders(),
            }
        )
    }

    changeUsername(payload: {
        username: string
    }): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            `${this.baseUrl}/change-username`,
            payload,
            {
                headers: this.getAuthHeaders(),
            }
        )
    }
}
