import { CommonModule } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'
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
import { LanguageSwitcherComponent } from '@app/components/language-switcher/language-switcher.component'

@Component({
    selector: 'app-register',
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
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
        ReactiveFormsModule,
        IonLabel,
        IonInput,
        BackendUrlPipe,
        RouterModule,
        IonInputPasswordToggle,
        IonText,
        LanguageSwitcherComponent,
    ],
})
export class RegisterPage implements OnInit {
    private router = inject(Router)
    private toastController = inject(ToastController)
    private authService = inject(AuthService)

    // Configurazione del Form Reattivo
    registerForm = new FormGroup({
        username: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(3)],
        }),
        email: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.email],
        }),
        password: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(8)],
        }),
        conf_password: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
    })

    constructor() {}

    ngOnInit() {}

    register() {
        // 1. Verifica validità form (campi vuoti, email malformate, password corte)
        if (this.registerForm.invalid) {
            this.presentToast($localize `:@@registerFormInvalid: 
                Compila tutti i campi correttamente. La password richiede almeno 8 caratteri.`,
                'danger'
            )
            return
        }

        const formData = this.registerForm.getRawValue()

        // 2. Controllo coincidenza password (unico controllo logico manuale necessario)
        if (formData.password !== formData.conf_password) {
            this.presentToast($localize `:@@passNotCoincide:Le password inserite non coincidono.`, 'danger')
            return
        }

        // Costruiamo il payload finale unendo i dati del form ai tuoi fallback strutturali
        // NOTA: AGGIUNGERE MODO PER SELEZIONARE LE LINGUE (menu a tendina?)
        // NOTA: AGGIUNGERE MODO PER SELEZIONARE LA PROPIC (rendi mob funzionale)
        const payload = {
            username: formData.username.trim(),
            email: formData.email.trim(),
            password: formData.password,
            audioLanguageId: 'it',
            textLanguageId: 'it',
            appLanguageId: 'it',
            propicURI: '/static/avatars/avatar-000.png',
        }

        // 3. Invio della richiesta tramite AuthService
        this.authService.register(payload).subscribe({
            next: () => {
                this.presentToast($localize `:@@registerSuccess:
                    Registrazione completata con successo! Ora puoi accedere.`,
                    'success'
                )
                this.router.navigate(['/login'])
            },
            error: (err) => {
                console.error('Errore registrazione:', err)
                const errMsg =
                    err.error?.message ||
                    err.error?.error ||
                    $localize `:@@registerError:Errore durante la registrazione.`
                this.presentToast(errMsg, 'danger')
            },
        })
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
