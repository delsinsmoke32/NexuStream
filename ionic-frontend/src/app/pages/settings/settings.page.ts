import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { AvatarPickerModalComponent } from '@app/components/avatar-picker-modal/avatar-picker-modal.component'
import { ChangePasswordModalComponent } from '@app/components/change-password-modal/change-password-modal.component'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'
import { AuthService } from '@app/services/auth'
import { LanguageService } from '@app/services/language'
import { Settings } from '@app/services/settings'
import { AlertController, ToastController } from '@ionic/angular'
import {
    IonAvatar,
    IonContent,
    IonFooter,
    IonIcon,
    IonItem,
    IonItemDivider,
    IonItemGroup,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    ModalController,
} from '@ionic/angular/standalone'
import { addIcons } from '@lib/ionicons'
import {
    checkmark,
    helpCircleOutline,
    lockClosedOutline,
    logOutOutline,
    notificationsOutline,
    pencil,
    videocamOutline,
    wifiOutline,
} from '@lib/ionicons/icons'

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    standalone: true,
    imports: [
        IonSpinner,
        IonIcon,
        IonContent,
        IonItemGroup,
        IonItemDivider,
        IonItem,
        IonAvatar,
        IonLabel,
        IonSelectOption,
        IonSelect,
        CommonModule,
        FormsModule,
        BackendUrlPipe,
        IonFooter,
    ],
})
export class SettingsPage implements OnInit {
    private http = inject(HttpClient)
    private settingsService = inject(Settings)
    private langService = inject(LanguageService)
    private authService = inject(AuthService)
    private modalCtrl = inject(ModalController)

    username = signal<string>('')
    isLoading = signal<boolean>(true)

    selected = signal('avatars/avatar-003.png')

    
    isAvatarModalOpen = false

    
    currentAvatar = signal<string>('')

    userPreferences = {
        appLanguage: 'it',
        defaultAudio: 'jp', 
        defaultSubtitles: 'it',
    }

    
    constructor(
        private router: Router,
        private alertController: AlertController,
        private toastCtrl: ToastController
    ) {
        addIcons({pencil,lockClosedOutline,logOutOutline,checkmark,notificationsOutline,videocamOutline,wifiOutline,helpCircleOutline,});
    }

    ngOnInit() {
        this.loadSettingsData()
        this.loadPreferences()
    }

    
    loadPreferences() {
        this.isLoading.set(true)
        this.userPreferences = {
            appLanguage: this.langService.getAppLang(),
            defaultSubtitles: this.langService.getTextLang(),
            defaultAudio: this.langService.getAudioLang(),
        }
        this.isLoading.set(false)
    }

    loadSettingsData() {
       
        const userString = localStorage.getItem('user')

        if (userString) {
            
            const user = JSON.parse(userString)

            
            this.username.set(user.Username)
            console.log('Username recuperato dal localStorage:', this.username)
            this.currentAvatar.set(user.REF_PropicURI)
        } else {
            console.warn('Nessun utente trovato nel localStorage')
        }
    }

    
    savePreferences() {
        
        this.langService.setLanguages(
            this.userPreferences.appLanguage,
            this.userPreferences.defaultSubtitles,
            this.userPreferences.defaultAudio
        )

        
        const currentLang = window.location.pathname.split('/')[1]
        if (['it', 'en'].includes(currentLang)) {
            const targetLang = this.userPreferences.appLanguage
            if (currentLang !== targetLang) {
                console.log(currentLang, targetLang)
                const newPath = window.location.pathname.replace(
                    `/${currentLang}/`,
                    `/${targetLang}/`
                )
                window.location.href =
                    window.location.origin + newPath + window.location.search
            }
        }

        this.presentToast($localize`:@@settingsPage_prefsUpdated:Impostazioni aggiornate con successo!`, 'success')
    }

    warnAppLanguage() {
        const currentLang = window.location.pathname.split('/')[1]
        if (!['it', 'en'].includes(currentLang))
            this.presentToast(
                $localize`:@@settingsPage_langWarning:Il cambio della lingua dell'applicazione non avrà effetto in questa modalità.`,
                'warning'
            )
    }

    async openAvatarSelector() {
        console.log(this.currentAvatar())
        const modal = await this.modalCtrl.create({
            component: AvatarPickerModalComponent,
            componentProps: { propic: this.currentAvatar() },
        })
        await modal.present()

        const { data } = await modal.onDidDismiss()

        console.log(data)
        console.log(this.currentAvatar())
        
        if (data && data.selectedAvatar) {
            this.currentAvatar.set(data.selectedAvatar)
            
            this.settingsService
                .changePropic({ propicURI: data.selectedAvatar })
                .subscribe({
                    next: async () => {
                        
                        const userString = localStorage.getItem('user');
                        
                        if (userString) {
                            const user = JSON.parse(userString);
                            
                            
                            user.REF_PropicURI = data.selectedAvatar;
                            
                            
                            localStorage.setItem('user', JSON.stringify(user));
                        }

                       
                        const timestamp = new Date().getTime();
                        this.currentAvatar.set(`${data.selectedAvatar}?t=${timestamp}`);
                        
                        this.presentToast($localize`:@@settingsPage_propicUpdated:Propic aggiornata con successo!`, 'success');
                    },
                    error: async (err) => {
                        this.presentToast($localize`:@@settingsPage_errorUpdate:Errore durante l'aggiornamento.`, 'danger')
                    },
                })
        }
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

    async logout() {
        await this.authService.confirmLogout()
    }

    async openModifyPasswordModal() {
        const modal = await this.modalCtrl.create({
            component: ChangePasswordModalComponent,
            componentProps: {},
        })
        await modal.present()

        const { data } = await modal.onDidDismiss()
    }

    async changeName() {
        const alert = await this.alertController.create({
            header: $localize`:@@settingsPage_changeNameHeader:Modifica nome`,
            subHeader: $localize`:@@settingsPage_changeNameSub:Il nuovo nome deve contenere tra 3 e 24 caratteri.`,
            inputs: [
                {
                    name: 'newUsername',
                    type: 'text',
                    placeholder: $localize`:@@settingsPage_newUsernamePlaceholder:Nuovo nome utente`,
                    value: this.username(),
                    attributes: {
                        minlength: 3,
                        maxlength: 24,
                    },
                },
            ],
            buttons: [
                {
                    text: $localize`:@@settingsPage_cancel:Annulla`,
                    role: 'cancel',
                    cssClass: 'secondary',
                },
                {
                    text: $localize`:@@settingsPage_save:Salva`,
                    handler: (data) => {
                        const name = data.newUsername
                            ? data.newUsername.trim()
                            : ''

                        
                        if (name.length >= 3 && name.length <= 24) {
                            this.saveNewName(name)
                            return true 
                        }

                        
                        return false
                    },
                },
            ],
        })

        await alert.present()
    }

    saveNewName(newName: string) {
        this.settingsService.changeUsername({ username: newName }).subscribe({
            next: async () => {
                this.username.set(newName)
                this.presentToast(
                    $localize`:@@settingsPage_usernameUpdated:Username aggiornato con successo!`,
                    'success'
                )
            },
            error: async (err) => {
                this.presentToast($localize`:@@settingsPage_errorUpdate:Errore durante l'aggiornamento.`, 'danger')
            },
        })
    }
}
