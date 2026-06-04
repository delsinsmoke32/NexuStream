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
    private authService = inject(AuthService)
    private router = inject(Router)
    private toastController = inject(ToastController)

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
        // Usiamo la validazione nativa dei Reactive Forms
        if (this.loginForm.invalid) {
            this.presentToast(
                $localize `:@@insertLogin: Inserisci un'email valida e una password di almeno 8 caratteri.`,
                'danger'
            )
            return
        }

        // Estraiamo i dati in modo Type-Safe grazie a getRawValue()
        const credentials = this.loginForm.getRawValue()

        this.authService.login(credentials).subscribe({
            next: (res: any) => {
                console.log('Risposta esatta del server:', res)

                localStorage.setItem('token', res.token)

                // Se i dati dell'utente sono dentro res.user usa quello, altrimenti usa direttamente res
                const userData = res.user ? res.user : res
                localStorage.setItem('user', JSON.stringify(userData))

                // Mappiamo i ruoli usando la funzione helper
                const rolesArray = this.buildRolesArray(userData)
                localStorage.setItem('user_roles', JSON.stringify(rolesArray))

                if (rolesArray.includes('admin')) {
                    this.router.navigate(['/admin'])
                } else {
                    this.router.navigate(['/home'])
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
