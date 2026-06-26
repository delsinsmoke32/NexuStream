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

    // aggiungo lingua
    let apiReq = req.clone({
        setHeaders: {
            'Accept-Language': lang
        }
    });

    //url relativo
    if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) {
        apiReq = apiReq.clone({
            url: `${baseUrl}/${req.url}`,
        });
    }

    //token se utente loggato
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
