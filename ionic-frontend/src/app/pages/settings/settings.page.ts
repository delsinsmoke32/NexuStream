import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { addIcons } from '@lib/ionicons';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,IonBackButton,IonItemGroup,IonItemDivider,IonItem,IonAvatar,IonLabel,IonToggle, IonIcon, IonModal, IonButton, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { pencil, checkmark,lockClosedOutline, notificationsOutline, videocamOutline, wifiOutline, helpCircleOutline, logOutOutline } from '@lib/ionicons/icons';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, IonHeader, IonTitle, IonToolbar,IonButtons,IonBackButton,IonItemGroup,IonItemDivider,IonItem,IonAvatar,IonLabel,IonToggle ,IonModal, IonButton, IonGrid, IonRow, IonCol, CommonModule, FormsModule]
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

  ngOnInit() {
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
// Gestione interruttore notifiche
  toggleNotifications(event: any) {
    this.notificationsEnabled = event.detail.checked;
    console.log('Notifiche impostate a:', this.notificationsEnabled);
  }

  // Gestione interruttore Wi-Fi
  toggleWifi(event: any) {
    this.wifiOnly = event.detail.checked;
    console.log('Download solo Wi-Fi impostato a:', this.wifiOnly);
  }

  // Funzioni click fittizie
  goToProfileEdit() { console.log('Modifica profilo...'); }
  changePassword() { console.log('Cambia password...'); }
  openQualitySettings() { console.log('Apro selezione qualità...'); }
  openSupport() { console.log('Apro assistenza...'); }

  // Funzione Logout con messaggio di conferma (Alert)
  async logout() {
    const alert = await this.alertController.create({
      header: 'Disconnetti',
      message: 'Sei sicuro di voler uscire da NexuStream?',
      cssClass: 'custom-logout-alert', // Classe personalizzabile nel CSS globale
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel',
          handler: () => { console.log('Logout annullato'); }
        },
        {
          text: 'Esci',
          role: 'destructive',
          handler: async () => {
            console.log('Eseguo il logout...');
            
            // Mostra un piccolo feedback di conferma
            const toast = await this.toastController.create({
              message: 'Sessione chiusa correttamente',
              duration: 2000,
              color: 'dark'
            });
            await toast.present();

            // Reindirizza l'utente alla pagina di login (o home per ora)
            this.router.navigate(['/home']);
          }
        }
      ]
    });

    await alert.present();
  }
}
