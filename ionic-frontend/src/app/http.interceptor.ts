import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { environment } from '../environments/environment'

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router)
    const baseUrl = `http://${environment.host}:${environment.port}`

    const token = localStorage.getItem('token')

    let apiReq = req
    if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) {
        apiReq = req.clone({
            url: `${baseUrl}/${req.url}`,
        })
    }

    // non dovrebbe succedere ma così non senda le request a siti esterni
    if (token && apiReq.url.startsWith(baseUrl)) {
        apiReq = apiReq.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        })
    }

    return next(apiReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status == 401) {
                console.error('Sessione scaduta o non autorizzata.')
                localStorage.removeItem('token')
                router.navigate(['/login'])
            }

            return throwError(() => error)
        })
    )
}
