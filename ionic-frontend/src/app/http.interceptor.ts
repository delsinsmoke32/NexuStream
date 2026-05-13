import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router)
    const baseUrl = 'http://localhost:3000'

    let apiReq = req
    if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) {
        apiReq = req.clone({
            url: `${baseUrl}/${req.url}`,
        })
    }

    return next(apiReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status == 401) {
                console.error('Errore')
            }

            return throwError(() => error)
        })
    )
    return next(req)
}
