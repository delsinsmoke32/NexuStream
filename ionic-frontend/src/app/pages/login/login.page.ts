import { CommonModule, NgIfContext } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'

import { Router, RouterLink } from '@angular/router'
import { LanguageSwitcherComponent } from '@app/components/language-switcher/language-switcher.component'
import { AuthService } from '@app/services/auth'
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonInput,
    IonInputPasswordToggle,
    IonItem,
    IonLabel,
    IonTitle,
    IonToolbar,
    ToastController,
    IonText,
} from '@ionic/angular/standalone'
import { LanguageService } from '@app/services/language';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    standalone: true,
    imports: [
        IonContent,
        IonHeader,
        IonTitle,
        IonToolbar,
        IonCard,
        IonItem,
        IonCardContent,
        IonButton,
        CommonModule,
        FormsModule,
        IonLabel,
        IonInput,
        IonInputPasswordToggle,
        ReactiveFormsModule,
        LanguageSwitcherComponent,
        IonText,
        RouterLink
    ],
})
export class LoginPage implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);
    private toastController = inject(ToastController);
    private langService = inject(LanguageService);

    // Form reattivo configurato correttamente
    loginForm = new FormGroup({
        email: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.email],
        }),
        password: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(8)],
        }),
    })

    constructor() {}

    ngOnInit() {}

    login() {
        if (this.loginForm.invalid) {
            this.presentToast(
                $localize `:@@insertLogin: Inserisci un'email valida e una password di almeno 8 caratteri.`,
                'danger'
            )
            return
        }

        const credentials = this.loginForm.getRawValue()

        this.authService.login(credentials).subscribe({
            next: (res: any) => {
                console.log('Risposta esatta del server:', res)

                const userData = res.user ? res.user : res

                // 🚀 1. Aggiorniamo le lingue IN LOCALE prima del token!
                // (Assicurati che i nomi corrispondano a come il tuo DB ti restituisce i campi)
                const appLang = userData.REF_App_Language || 'it';
                const textLang = userData.REF_Text_Language || 'it';
                const audioLang = userData.REF_Audio_Language || 'jp';
                
                // Salviamo le preferenze (non farà chiamate API perché il token non c'è ancora)
                this.langService.setLanguages(appLang, textLang, audioLang);

                // 🚀 2. ORA salviamo il token e il resto
                localStorage.setItem('token', res.token)
                localStorage.setItem('user', JSON.stringify(userData))

                const rolesArray = this.buildRolesArray(userData)
                localStorage.setItem('user_roles', JSON.stringify(rolesArray))

                if (res.user && res.user.REF_PropicURI) {
                    localStorage.setItem('propic', res.user.REF_PropicURI);
                } else {
                    localStorage.removeItem('propic'); 
                }

                // 🚀 3. Controllo URL: Se la lingua dell'utente è diversa da quella dell'URL, 
                // ricarichiamo la pagina con la lingua corretta (come nei Settings)
                const currentUrlLang = window.location.pathname.split('/')[1];
                const targetRoute = rolesArray.includes('admin') ? '/admin' : '/tabs/home';
                
                // Controlliamo se stiamo girando in "serve mode" (senza cartelle lingua)
                const isServeMode = !['it', 'en'].includes(currentUrlLang);

                // Se NON siamo in serve mode, E la lingua è diversa, facciamo il redirect rigido
                if (!isServeMode && currentUrlLang !== appLang && ['it', 'en'].includes(appLang)) {
                    window.location.href = window.location.origin + `/${appLang}` + targetRoute;
                } else {
                    // Se siamo in locale (ionic serve) o la lingua coincide, usiamo il router standard!
                    this.router.navigate([targetRoute]);
                }
            },
            error: (err) => {
                console.error('Errore HTTP Login:', err)
                this.presentToast(
                    err.error?.message || $localize `:@@errorLogin: Errore durante l'accesso.`,
                    'danger'
                )
            },
        })
    }

    /**
     * Helper per estrarre i ruoli dall'oggetto utente ed evitare i crash di undefined
     */
    private buildRolesArray(user: any): string[] {
        const roles: string[] = []
        if (!user) return ['user']

        if (user.isAdmin || user.is_admin) roles.push('admin')
        if (user.isMod || user.is_mod) roles.push('mod')
        if (user.isCataloguer || user.is_cataloguer) roles.push('cataloguer')

        // Se non ha nessun ruolo specifico, è un utente base
        if (roles.length === 0) roles.push('user')
        return roles
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastController.create({
            message: message,
            duration: 3000,
            position: 'bottom',
            color: color,
        })
        await toast.present()
    }
}
