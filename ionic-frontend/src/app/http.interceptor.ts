import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { environment } from '../environments/environment'

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const baseUrl = `http://${environment.host}:${environment.port}`;
    const token = localStorage.getItem('token');
    const lang = localStorage.getItem('appLang') || 'it';

    // 1. Cloniamo la richiesta aggiungendo sempre la lingua
    let apiReq = req.clone({
        setHeaders: {
            'Accept-Language': lang
        }
    });

    // 2. Se è un URL relativo, aggiungiamo la baseUrl
    if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) {
        apiReq = apiReq.clone({
            url: `${baseUrl}/${req.url}`,
        });
    }

    // 3. Se l'utente è loggato, aggiungiamo il token.
    // Usando .clone() su apiReq (che ha già la lingua), Angular unisce 
    // automaticamente i nuovi header a quelli già esistenti.
    if (token && apiReq.url.startsWith(baseUrl)) {
        apiReq = apiReq.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(apiReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status == 401) {
                localStorage.removeItem('token');
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
