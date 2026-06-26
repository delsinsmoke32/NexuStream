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

    // Controllo visibilità della finestra di scelta
    isAvatarModalOpen = false

    // Avatar attualmente selezionato (di base mostriamo un placeholder)
    currentAvatar = signal<string>('')

    userPreferences = {
        appLanguage: 'it',
        defaultAudio: 'jp', // Usa 'jp' invece di 'ja' per coerenza col DB
        defaultSubtitles: 'it',
    }

    // Elenco degli avatar che l'utente può scegliere
    constructor(
        private router: Router,
        private alertController: AlertController,
        private toastCtrl: ToastController
    ) {
        addIcons({
            pencil,
            lockClosedOutline,
            logOutOutline,
            checkmark,
            notificationsOutline,
            videocamOutline,
            wifiOutline,
            helpCircleOutline,
        })
    }

    ngOnInit() {
        this.loadSettingsData()
        this.loadPreferences()
    }

    // Carica le preferenze salvate o imposta i valori di default
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
        // 1. Recupera la stringa dal localStorage
        const userString = localStorage.getItem('user')

        if (userString) {
            // 2. Trasforma la stringa di testo nuovamente in un oggetto JavaScript reale
            const user = JSON.parse(userString)

            // 3. Assegna l'username (fai attenzione a come si chiama il campo esatto nell'oggetto, es. user.username o user.name)
            this.username.set(user.Username)
            console.log('Username recuperato dal localStorage:', this.username)
            this.currentAvatar.set(user.REF_PropicURI)
        } else {
            console.warn('Nessun utente trovato nel localStorage')
        }
    }

    // Salva le preferenze ogni volta che l'utente cambia un valore
    savePreferences() {
        // 1. Chiamiamo il service, che aggiornerà il localStorage E farà la chiamata PATCH al backend!
        this.langService.setLanguages(
            this.userPreferences.appLanguage,
            this.userPreferences.defaultSubtitles,
            this.userPreferences.defaultAudio
        )

        // 2. Logica di refresh per la lingua dell'App (come avevi già fatto benissimo)
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

        this.presentToast('Impostazioni aggiornate con successo!', 'success')
    }

    warnAppLanguage() {
        const currentLang = window.location.pathname.split('/')[1]
        if (!['it', 'en'].includes(currentLang))
            this.presentToast(
                "Il cambio della lingua dell'applicazione non avrà effetto in questa modalità.",
                'warning'
            )
    }

    // Apre la schermata di selezione
    // openAvatarSelector() {
    //     this.isAvatarModalOpen = true
    // }

    // Cambia l'avatar e chiude la finestra
    // selectAvatar(avatarUrl: string) {
    //     this.currentAvatar.set(avatarUrl)
    //     this.isAvatarModalOpen = false // Chiude il pannello dopo la scelta
    //     localStorage.setItem('REF_PropicURI', 'avatarURL')
    //     console.log('Nuovo avatar salvato:', avatarUrl)
    // }

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
        // Se l'utente ha selezionato un avatar, aggiorna il signal della pagina principale
        if (data && data.selectedAvatar) {
            this.currentAvatar.set(data.selectedAvatar)
            // this.registerForm.patchValue({ propic: this.selected() })
            this.settingsService
                .changePropic({ propicURI: data.selectedAvatar })
                .subscribe({
                    next: async () => {
                        this.presentToast(
                            'Propic aggiornata con successo!',
                            'success'
                        )
                    },
                    error: async (err) => {
                        const errorMsg =
                            err.error?.message ||
                            "Errore durante l'aggiornamento."
                        this.presentToast(errorMsg, 'danger')
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
            header: 'Modifica nome',
            subHeader: 'Il nuovo nome deve contenere tra 3 e 24 caratteri.',
            inputs: [
                {
                    name: 'newUsername',
                    type: 'text',
                    placeholder: 'Nuovo nome utente',
                    value: this.username(),
                    attributes: {
                        minlength: 3,
                        maxlength: 24,
                    },
                },
            ],
            buttons: [
                {
                    text: 'Annulla',
                    role: 'cancel',
                    cssClass: 'secondary',
                },
                {
                    text: 'Salva',
                    handler: (data) => {
                        const name = data.newUsername
                            ? data.newUsername.trim()
                            : ''

                        // Controllo lunghezza tra 3 e 24 caratteri
                        if (name.length >= 3 && name.length <= 24) {
                            this.saveNewName(name)
                            return true // Chiude il modal con successo
                        }

                        // Impedisce la chiusura del modal se i requisiti falliscono
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
                    'Username aggiornato con successo!',
                    'success'
                )
            },
            error: async (err) => {
                const errorMsg = "Errore durante l'aggiornamento."
                this.presentToast(errorMsg, 'danger')
            },
        })
    }
}
