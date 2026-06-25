import { Component, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { addIcons } from '@lib/ionicons'
import { FormsModule } from '@angular/forms'
import {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonItemGroup,
    IonItemDivider,
    IonItem,
    IonAvatar,
    IonLabel,
    IonIcon,
    IonModal,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonSelectOption,
    IonSelect,
    IonSpinner,
    IonFooter,
    ModalController,
} from '@ionic/angular/standalone'
import {
    pencil,
    checkmark,
    lockClosedOutline,
    notificationsOutline,
    videocamOutline,
    wifiOutline,
    helpCircleOutline,
    logOutOutline,
} from '@lib/ionicons/icons'
import { Router } from '@angular/router'
import { AlertController, ToastController } from '@ionic/angular'
import { HttpClient } from '@angular/common/http'
import { HttpHeaders } from '@angular/common/http'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'
import { AvatarPickerModalComponent } from '@app/components/avatar-picker-modal/avatar-picker-modal.component'
import { ChangePasswordModalComponent } from '@app/components/change-password-modal/change-password-modal.component'
import { Settings } from '@app/services/settings'

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    standalone: true,
    imports: [
        IonSpinner,
        IonIcon,
        IonContent,
        IonHeader,
        IonTitle,
        IonToolbar,
        IonButtons,
        IonBackButton,
        IonItemGroup,
        IonItemDivider,
        IonItem,
        IonAvatar,
        IonLabel,
        IonModal,
        IonButton,
        IonGrid,
        IonRow,
        IonCol,
        IonSelectOption,
        IonSelect,
        CommonModule,
        FormsModule,
        BackendUrlPipe,
        IonFooter,
        AvatarPickerModalComponent,
    ],
})
export class SettingsPage implements OnInit {
    private http = inject(HttpClient)
    private settingsService = inject(Settings)

    username = signal<string>('')
    isLoading = signal<boolean>(true)

    selected = signal('avatars/avatar-003.png')
    private modalCtrl = inject(ModalController)
    // Controllo visibilità della finestra di scelta
    isAvatarModalOpen = false

    // Avatar attualmente selezionato (di base mostriamo un placeholder)
    currentAvatar = signal<string>('')

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

    // Oggetto per mappare le preferenze dell'utente
    userPreferences = {
        appLanguage: 'it',
        defaultAudio: 'jp',
        defaultSubtitles: 'it',
    }

    ngOnInit() {
        this.loadSettingsData()
        this.loadPreferences()
    }

    // Carica le preferenze salvate o imposta i valori di default
    loadPreferences() {
        this.isLoading.set(true)
        const saved = localStorage.getItem('user_language_preferences')
        if (saved) {
            this.userPreferences = JSON.parse(saved)
        } else {
            // Se non c'è nulla, prova a leggere la lingua del browser dell'utente
            const browserLang = navigator.language.split('-')[0]
            this.userPreferences.appLanguage =
                browserLang === 'en' ? 'en' : 'it'
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
        localStorage.setItem(
            'user_language_preferences',
            JSON.stringify(this.userPreferences)
        )
        // 2. Controlla la lingua attualmente attiva nell'URL
        const currentLang = window.location.pathname.split('/')[1] // Prende 'it' o 'en'
        const targetLang = this.userPreferences.appLanguage // La lingua appena scelta

        // 3. Se la lingua scelta è diversa da quella attuale, ricarica l'app sul nuovo percorso
        if (currentLang !== targetLang) {
            // Costruisce il nuovo percorso (es. sostituisce /it/ con /en/)
            const newPath = window.location.pathname.replace(
                `/${currentLang}/`,
                `/${targetLang}/`
            )

            // Ricarica la pagina inviando l'utente alla nuova lingua
            window.location.href =
                window.location.origin + newPath + window.location.search
        }
        console.log('Impostazioni salvate:', this.userPreferences)
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
    // Funzioni click fittizie
    changePassword() {
        console.log('Cambia password...')
    }
    //openQualitySettings() { console.log('Apro selezione qualità...'); }
    openSupport() {
        console.log('Apro assistenza...')
    }

    private async showToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 2500,
            color,
            position: 'bottom',
        })
        await toast.present()
    }

    // Funzione Logout con messaggio di conferma (Alert)
    async logout() {
        const alert = await this.alertController.create({
            header: $localize`:@@disconnectHeader:Disconnetti`,
            message: $localize`:@@disconnectMessage:Sei sicuro di voler uscire da NexuStream?`,
            buttons: [
                { text: $localize`:@@cancelBtn:Annulla`, role: 'cancel' },
                {
                    text: $localize`:@@logOut:Esci`,
                    role: 'destructive',
                    handler: async () => {
                        const toast = await this.toastCtrl.create({
                            message: $localize`:@@closeSession:Sessione chiusa`,
                            duration: 2000,
                            color: 'dark',
                        })
                        await toast.present()
                        this.router.navigate(['/login'])
                    },
                },
            ],
        })
        await alert.present()
    }

    async openModifyPasswordModal() {
        const modal = await this.modalCtrl.create({
            component: ChangePasswordModalComponent,
            componentProps: {},
        })
        await modal.present()

        const { data } = await modal.onDidDismiss()
    }
}
