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
import { Settings } from '@app/services/settings'

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
    private settingsService = inject(Settings)

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

        
        if (newPassword !== confirmPasswordControl.value) {
            
            confirmPasswordControl.setErrors({
                ...confirmPasswordControl.errors,
                mismatch: true,
            })
            return { mismatch: true }
        } else {
            
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
            return $localize`:@@changePassModal_errCurrentRequired:La password attuale è obbligatoria.`
        } else if (control?.touched && control.hasError('minlength')) {
            return $localize`:@@changePassModal_errMinLen:La password deve essere di almeno 8 caratteri.`
        }
        return ''
    }

    getNewPasswordError(): string {
        const control = this.passwordForm.get('newPassword')
        if (control?.touched) {
            if (control.hasError('required'))
                return $localize`:@@changePassModal_errNewRequired:La nuova password è obbligatoria.`
            if (control.hasError('minlength'))
                return $localize`:@@changePassModal_errMinLenN:La password deve essere di almeno 8 caratteri.`
        }
        return ''
    }

    getConfirmPasswordError(): string {
        const control = this.passwordForm.get('confirmPassword')
        if (control?.touched) {
            if (control.hasError('required'))
                return $localize`:@@changePassModal_errConfirmRequired:Conferma la tua nuova password.`
            if (control.hasError('minlength'))
                return $localize`:@@changePassModal_errMinLen:La password deve essere di almeno 8 caratteri.`
            if (this.passwordForm.hasError('mismatch'))
                return $localize`:@@changePassModal_errMismatch:Le password non corrispondono.`
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
            message: $localize`:@@changePassModal_loading:Aggiornamento in corso...`,
        })
        await loading.present()

        const { currentPassword, newPassword } = this.passwordForm.getRawValue()

        this.settingsService
            .changePassword({ currentPassword, newPassword })
            .subscribe({
                next: async () => {
                    await loading.dismiss()
                    this.presentToast(
                        $localize`:@@changePassModal_success:Password aggiornata con successo!`,
                        'success'
                    )
                    this.dismiss({ success: true })
                },
                error: async (err) => {
                    await loading.dismiss()
                        
                    this.presentToast($localize`:@@changePassModal_errUpdate:Errore durante l'aggiornamento.`, 'danger')
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
