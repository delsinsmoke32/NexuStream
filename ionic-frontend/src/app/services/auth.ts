import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { User } from '../models/interfaces'

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private http: HttpClient) {}

    login(credentials: { email: string; password: string }): Observable<any> {
        return this.http.post<any>(`api/login`, credentials)
    }

    register(credentials: {
        email: string
        password: string
        username: string
        audioLanguageId: string
        textLanguageId: string
        appLanguageId: string
        propicURI: string
    }): Observable<any> {
        return this.http.post<any>(`api/register`, credentials)
    }
}
