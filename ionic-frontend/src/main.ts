/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser'
import {
    RouteReuseStrategy,
    provideRouter,
    withPreloading,
    PreloadAllModules,
} from '@angular/router'
import {
    IonicRouteStrategy,
    provideIonicAngular,
    isPlatform,
} from '@ionic/angular/standalone'

import { routes } from './app/app.routes'
import { AppComponent } from './app/app.component'
import {
    provideHttpClient,
    withFetch,
    withInterceptors,
} from '@angular/common/http'
import { httpInterceptor } from '@app/http.interceptor'

bootstrapApplication(AppComponent, {
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideIonicAngular({
            // Disattiva lo spostamento se l'app gira su desktop
            scrollPadding: !isPlatform('desktop'),
            scrollAssist: !isPlatform('desktop'),
            innerHTMLTemplatesEnabled: true,
        }),
        provideRouter(routes, withPreloading(PreloadAllModules)),
        provideHttpClient(withInterceptors([httpInterceptor]), withFetch()),
    ],
})
