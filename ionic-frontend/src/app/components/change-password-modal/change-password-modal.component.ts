import { Component, OnInit, inject } from '@angular/core'
import {
    NonNullableFormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms'
import {
    ModalController,
    LoadingController,
    ToastController,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
} from '@ionic/angular/standalone'
import { HttpClient } from '@angular/common/http'

@Component({
    selector: 'app-change-password-modal',
    templateUrl: './change-password-modal.component.html',
    styleUrls: ['./change-password-modal.component.scss'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonContent,
        IonInput,
        IonInputPasswordToggle,
    ],
})
export class ChangePasswordModalComponent implements OnInit {
    private fb = inject(NonNullableFormBuilder)
    private modalCtrl = inject(ModalController)
    private loadingCtrl = inject(LoadingController)
    private toastCtrl = inject(ToastController)
    private http = inject(HttpClient)

    passwordForm!: FormGroup

    ngOnInit() {
        this.passwordForm = this.fb.group(
            {
                currentPassword: [
                    '',
                    [Validators.required, Validators.minLength(8)],
                ],
                newPassword: [
                    '',
                    [Validators.required, Validators.minLength(8)],
                ],
                confirmPassword: [
                    '',
                    [Validators.required, Validators.minLength(8)],
                ],
            },
            { validators: this.passwordMatchValidator }
        )
    }

    passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
        const newPassword = g.get('newPassword')?.value
        const confirmPasswordControl = g.get('confirmPassword')

        if (!confirmPasswordControl) return null

        // Se i campi non coincidono
        if (newPassword !== confirmPasswordControl.value) {
            // Impostiamo l'errore direttamente sul controllo di conferma
            confirmPasswordControl.setErrors({
                ...confirmPasswordControl.errors,
                mismatch: true,
            })
            return { mismatch: true }
        } else {
            // Se coincidono, rimuoviamo l'errore 'mismatch' mantenendo eventuali altri errori (es. required)
            if (confirmPasswordControl.errors) {
                const { mismatch, ...remainingErrors } =
                    confirmPasswordControl.errors
                const hasErrors = Object.keys(remainingErrors).length > 0
                confirmPasswordControl.setErrors(
                    hasErrors ? remainingErrors : null
                )
            }
            return null
        }
    }

    // --- Funzioni Helper per errorText ---

    getCurrentPasswordError(): string {
        const control = this.passwordForm.get('currentPassword')
        if (control?.touched && control.hasError('required')) {
            return 'La password attuale è obbligatoria.'
        } else if (control?.touched && control.hasError('minlength')) {
            return 'La password deve essere di almeno 8 caratteri.'
        }
        return ''
    }

    getNewPasswordError(): string {
        const control = this.passwordForm.get('newPassword')
        if (control?.touched) {
            if (control.hasError('required'))
                return 'La nuova password è obbligatoria.'
            if (control.hasError('minlength'))
                return 'La password deve essere di almeno 8 caratteri.'
        }
        return ''
    }

    getConfirmPasswordError(): string {
        const control = this.passwordForm.get('confirmPassword')
        if (control?.touched) {
            if (control.hasError('required'))
                return 'Conferma la tua nuova password.'
            if (control.hasError('minlength'))
                return 'La password deve essere di almeno 8 caratteri.'
            if (this.passwordForm.hasError('mismatch'))
                return 'Le password non corrispondono.'
        }
        return ''
    }

    // --- Gestione Invio e Chiusura ---

    dismiss(data?: any) {
        this.modalCtrl.dismiss(data)
    }

    async onSubmit() {
        if (this.passwordForm.invalid) return

        const loading = await this.loadingCtrl.create({
            message: 'Aggiornamento in corso...',
        })
        await loading.present()

        const { currentPassword, newPassword } = this.passwordForm.getRawValue()

        this.http
            .post('api/users/change-password', { currentPassword, newPassword })
            .subscribe({
                next: async () => {
                    await loading.dismiss()
                    this.presentToast(
                        'Password aggiornata con successo!',
                        'success'
                    )
                    this.dismiss({ success: true })
                },
                error: async (err) => {
                    await loading.dismiss()
                    const errorMsg =
                        err.error?.message || "Errore durante l'aggiornamento."
                    this.presentToast(errorMsg, 'danger')
                },
            })
    }

    private async presentToast(message: string, color: string) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            color,
            position: 'bottom',
        })
        await toast.present()
    }
}
