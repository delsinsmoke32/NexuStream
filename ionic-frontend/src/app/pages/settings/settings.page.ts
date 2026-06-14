import { Component, OnInit, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { addIcons } from '@lib/ionicons';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,IonBackButton,IonItemGroup,IonItemDivider,IonItem,IonAvatar,IonLabel,IonToggle, IonIcon, IonModal, IonButton, IonGrid, IonRow, IonCol, IonSelectOption, IonSelect, IonSpinner } from '@ionic/angular/standalone';
import { pencil, checkmark,lockClosedOutline, notificationsOutline, videocamOutline, wifiOutline, helpCircleOutline, logOutOutline } from '@lib/ionicons/icons';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar,IonButtons,IonBackButton,IonItemGroup,IonItemDivider,IonItem,IonAvatar,IonLabel,IonToggle ,IonModal, IonButton, IonGrid, IonRow, IonCol,IonSelectOption,IonSelect, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit {
  private http = inject(HttpClient);

  username = signal<string>('');
  isLoading = signal<boolean>(true);
// Controllo visibilità della finestra di scelta
  isAvatarModalOpen = false;

  // Avatar attualmente selezionato (di base mostriamo un placeholder)
  currentAvatar = signal<string>('');

  // Elenco degli avatar che l'utente può scegliere
  availableAvatars = [
    'assets/imgs/avatars/aot-eren.jpg',
    'assets/imgs/avatars/tobi.jpg'
  ];
  constructor(private router: Router,
    private alertController: AlertController,
    private toastCtrl: ToastController) { addIcons({pencil, checkmark,lockClosedOutline, notificationsOutline, videocamOutline, wifiOutline, helpCircleOutline, logOutOutline});}

  // Oggetto per mappare le preferenze dell'utente
  userPreferences = {
    appLanguage: 'it',
    defaultAudio: 'ja',
    defaultSubtitles: 'it'
  };

  ngOnInit() {
    this.loadSettingsData();
    this.loadPreferences();
  }

  // Carica le preferenze salvate o imposta i valori di default
  loadPreferences() {
    this.isLoading.set(true);
    const saved = localStorage.getItem('user_language_preferences');
    if (saved) {
      this.userPreferences = JSON.parse(saved);
    } else {
      // Se non c'è nulla, prova a leggere la lingua del browser dell'utente
      const browserLang = navigator.language.split('-')[0];
      this.userPreferences.appLanguage = browserLang === 'en' ? 'en' : 'it';
    }
    this.isLoading.set(false);
  }

  loadSettingsData(){
    // 1. Recupera la stringa dal localStorage
  const userString = localStorage.getItem('user');

  if (userString) {
    // 2. Trasforma la stringa di testo nuovamente in un oggetto JavaScript reale
    const user = JSON.parse(userString);
    
    // 3. Assegna l'username (fai attenzione a come si chiama il campo esatto nell'oggetto, es. user.username o user.name)
    this.username.set(user.Username);
    console.log("Username recuperato dal localStorage:", this.username);
    this.currentAvatar.set(user.REF_PropicURI);
  } else {
    console.warn("Nessun utente trovato nel localStorage");
    
  }

}

  // Salva le preferenze ogni volta che l'utente cambia un valore
  savePreferences() {
    localStorage.setItem('user_language_preferences', JSON.stringify(this.userPreferences));
    // 2. Controlla la lingua attualmente attiva nell'URL
    const currentLang = window.location.pathname.split('/')[1]; // Prende 'it' o 'en'
    const targetLang = this.userPreferences.appLanguage; // La lingua appena scelta

    // 3. Se la lingua scelta è diversa da quella attuale, ricarica l'app sul nuovo percorso
    if (currentLang !== targetLang) {
    
      // Costruisce il nuovo percorso (es. sostituisce /it/ con /en/)
      const newPath = window.location.pathname.replace(`/${currentLang}/`, `/${targetLang}/`);
    
      // Ricarica la pagina inviando l'utente alla nuova lingua
      window.location.href = window.location.origin + newPath + window.location.search;
    }
    console.log('Impostazioni salvate:', this.userPreferences);
  }

  // Apre la schermata di selezione
  openAvatarSelector() {
    this.isAvatarModalOpen = true;
  }

  // Cambia l'avatar e chiude la finestra
  selectAvatar(avatarUrl: string) {
    this.currentAvatar.set(avatarUrl);
    this.isAvatarModalOpen = false; // Chiude il pannello dopo la scelta
    localStorage.setItem('REF_PropicURI', 'avatarURL');
    console.log('Nuovo avatar salvato:', avatarUrl);
  }


  // Funzioni click fittizie
  changePassword() { console.log('Cambia password...'); }
  //openQualitySettings() { console.log('Apro selezione qualità...'); }
  openSupport() { console.log('Apro assistenza...'); }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }

  // Funzione Logout con messaggio di conferma (Alert)
  async logout() {
    const alert = await this.alertController.create({
      header: $localize `:@@disconnectHeader:Disconnetti`,
      message:$localize `:@@disconnectMessage:Sei sicuro di voler uscire da NexuStream?`,
      buttons: [
        { text: $localize `:@@cancelBtn:Annulla`, role: 'cancel' },
        {
          text: $localize `:@@logOut:Esci`,
          role: 'destructive',
          handler: async () => {
            const toast = await this.toastCtrl.create({
              message: $localize `:@@closeSession:Sessione chiusa`,
              duration: 2000,
              color: 'dark'
            });
            await toast.present();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

}
