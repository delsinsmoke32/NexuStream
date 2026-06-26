import { CommonModule } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import {
    AbstractControl,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { AvatarPickerModalComponent } from '@app/components/avatar-picker-modal/avatar-picker-modal.component'
import { LanguageSwitcherComponent } from '@app/components/language-switcher/language-switcher.component'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'
import { AuthService } from '@app/services/auth'
import { LanguageService } from '@app/services/language'
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonInputPasswordToggle,
    IonItem,
    IonLabel,
    IonToolbar,
    ModalController,
    ToastController,
} from '@ionic/angular/standalone'
import { swapHorizontalOutline } from '@lib/ionicons/icons'
import { addIcons } from 'ionicons'

@Component({
    selector: 'app-register',
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
    standalone: true,
    imports: [
        IonContent,
        IonHeader,
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
        LanguageSwitcherComponent,
        IonIcon,
    ],
})
export class RegisterPage implements OnInit {
    private router = inject(Router)
    private toastController = inject(ToastController)
    private authService = inject(AuthService)
    private modalCtrl = inject(ModalController)
    private langService = inject(LanguageService)

    
    registerForm = new FormGroup(
        {
            username: new FormControl('', {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(24),
                ],
            }),
            email: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.email],
            }),
            password: new FormControl('', {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.maxLength(24),
                ],
            }),
            conf_password: new FormControl('', {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.maxLength(24),
                ],
            }),
            
        },
        { validators: this.passwordMatchValidator }
    )

    selected = signal('avatars/avatar-003.png')
    constructor() {
        addIcons({swapHorizontalOutline});
        
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

    ngOnInit() {}

    register() {
        
        if (this.registerForm.invalid) {
            this.presentToast(
                $localize`:@@registerFormInvalid: 
                Compila tutti i campi correttamente. La password richiede almeno 8 caratteri e massimo 24.`,
                'danger'
            )
            return
        }

        const formData = this.registerForm.getRawValue()

        
        if (formData.password !== formData.conf_password) {
            this.presentToast(
                $localize`:@@passNotCoincide:Le password inserite non coincidono.`,
                'danger'
            )
            return
        }

        const payload = {
            username: formData.username.trim(),
            email: formData.email.trim(),
            password: formData.password,
            audioLanguageId: this.langService.getAudioLang(),
            textLanguageId: this.langService.getTextLang(),
            appLanguageId: this.langService.getAppLang(),
            propicURI: this.selected(),
        }

        
        this.authService.register(payload).subscribe({
            next: () => {
                this.presentToast(
                    $localize`:@@registerSuccess:
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
                    $localize`:@@registerError:Errore durante la registrazione.`
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

    async triggerImageSelection() {
        console.log(this.selected())
        const modal = await this.modalCtrl.create({
            component: AvatarPickerModalComponent,
            componentProps: { propic: this.selected() },
        })
        await modal.present()

        const { data } = await modal.onDidDismiss()

        console.log(data)
        console.log(this.selected())
        
        if (data && data.selectedAvatar) {
            this.selected.set(data.selectedAvatar)
            
        }
    }
}
