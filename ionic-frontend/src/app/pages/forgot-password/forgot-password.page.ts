import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from '@app/services/auth'
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonText,
    ToastController,
} from '@ionic/angular/standalone'

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.page.html',
    styleUrls: ['./forgot-password.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonItem,
        IonInput,
        IonButton,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardSubtitle,
        IonCardContent,
        IonText,
    ],
})
export class ForgotPasswordPage {
    private fb = inject(FormBuilder)
    private authService = inject(AuthService)
    private router = inject(Router)
    private toastCtrl = inject(ToastController)

    forgotForm: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
    })

    isLoading: boolean = false

    onSubmit() {
        if (this.forgotForm.invalid) {
            this.presentToast('Inserisci un indirizzo email valido.', 'danger')
            return
        }

        const rawEmail = this.forgotForm.value.email?.trim()
        if (!rawEmail) {
            this.presentToast(
                'Il campo email non può contenere solo spazi vuoti.',
                'danger'
            )
            return
        }

        this.isLoading = true
        const payload = { email: rawEmail }

        this.authService.forgotPassword(payload).subscribe({
            next: (res: any) => {
                this.presentToast(
                    res.message || 'Controlla la tua casella di posta!',
                    'success'
                )
                this.isLoading = false
                this.router.navigate(['/login'])
            },
            error: (err) => {
                console.error('Errore HTTP Forgot Password:', err)
                this.isLoading = false
                this.presentToast(
                    err.error?.error ||
                        "Errore durante l'invio della richiesta.",
                    'danger'
                )
            },
        })
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 5000,
            color,
            position: 'bottom',
        })
        await toast.present()
    }
}
