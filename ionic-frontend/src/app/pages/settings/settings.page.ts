import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { addIcons } from '@lib/ionicons';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,IonBackButton,IonItemGroup,IonItemDivider,IonItem,IonAvatar,IonLabel,IonToggle, IonIcon, IonModal, IonButton, IonGrid, IonRow, IonCol, IonSelectOption, IonSelect } from '@ionic/angular/standalone';
import { pencil, checkmark,lockClosedOutline, notificationsOutline, videocamOutline, wifiOutline, helpCircleOutline, logOutOutline } from '@lib/ionicons/icons';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, IonHeader, IonTitle, IonToolbar,IonButtons,IonBackButton,IonItemGroup,IonItemDivider,IonItem,IonAvatar,IonLabel,IonToggle ,IonModal, IonButton, IonGrid, IonRow, IonCol,IonSelectOption,IonSelect, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit {
  notificationsEnabled = true;
  wifiOnly = false;
// Controllo visibilità della finestra di scelta
  isAvatarModalOpen = false;

  // Avatar attualmente selezionato (di base mostriamo un placeholder)
  currentAvatar = 'assets/imgs/avatars/aot-eren.jpg';

  // Elenco degli avatar che l'utente può scegliere
  availableAvatars = [
    'assets/imgs/avatars/aot-eren.jpg',
    'assets/imgs/avatars/tobi.jpg'
  ];
  constructor(private router: Router,
    private alertController: AlertController,
    private toastController: ToastController) { addIcons({pencil, checkmark,lockClosedOutline, notificationsOutline, videocamOutline, wifiOutline, helpCircleOutline, logOutOutline});}

  // Oggetto per mappare le preferenze dell'utente
  userPreferences = {
    appLanguage: 'it',
    defaultAudio: 'ja',
    defaultSubtitles: 'it'
  };

  ngOnInit() {
    this.loadPreferences();
  }

  // Carica le preferenze salvate o imposta i valori di default
  loadPreferences() {
    const saved = localStorage.getItem('user_language_preferences');
    if (saved) {
      this.userPreferences = JSON.parse(saved);
    } else {
      // Se non c'è nulla, prova a leggere la lingua del browser dell'utente
      const browserLang = navigator.language.split('-')[0];
      this.userPreferences.appLanguage = browserLang === 'en' ? 'en' : 'it';
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
    this.currentAvatar = avatarUrl;
    this.isAvatarModalOpen = false; // Chiude il pannello dopo la scelta
    console.log('Nuovo avatar salvato:', avatarUrl);
  }


  // Funzioni click fittizie
  changePassword() { console.log('Cambia password...'); }
  //openQualitySettings() { console.log('Apro selezione qualità...'); }
  openSupport() { console.log('Apro assistenza...'); }

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
            const toast = await this.toastController.create({
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
