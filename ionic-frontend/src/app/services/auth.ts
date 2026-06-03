import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
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

    /**
     * Invia una richiesta al backend per generare un token temporaneo 
     * e recapitare il link di sblocco all'indirizzo email specificato.
     * * @param payload Oggetto contenente l'email dell'utente compilata nel form.
     */
    forgotPassword(payload: { email: string }): Observable<any> {
        return this.http.post<any>(`api/login/forgot-password`, payload);
    }

    /**
     * Trasmette al backend il token recuperato dall'URL del browser 
     * e la nuova password sanificata per finalizzare il ripristino dell'account.
     * * @param payload Oggetto composto dal token di verifica e dalla nuova password scelta.
     */
    resetPassword(payload: { token: string; newPassword: string }): Observable<any> {
        return this.http.post<any>(`api/login/reset-password`, payload);
    }
}