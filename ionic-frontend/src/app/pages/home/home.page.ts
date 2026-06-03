import { Component, ViewChild, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, 
  IonItem, IonIcon, IonPopover, IonMenuButton, IonButtons, 
  IonSpinner, IonList 
} from '@ionic/angular/standalone';
import { AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  searchOutline, personCircleOutline, settingsOutline, 
  heartOutline, logOutOutline, playCircle, informationCircleOutline,
  play
} from 'ionicons/icons';

import { BackendUrlPipe } from '../../pipes/backend-url-pipe';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, BackendUrlPipe,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, 
    IonItem, IonIcon, IonPopover, IonMenuButton, IonButtons, 
    IonSpinner, IonList
  ]
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('profilePopover') popover: any;
  
  private http = inject(HttpClient);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  isLoading = signal<boolean>(true);
  isLoggedIn = signal<boolean>(false);
  
  // Dati
  mostViewed = signal<any[]>([]);
  mostLiked = signal<any[]>([]);
  continueWatching = signal<any[]>([]);

  // Gestione Hero Banner
  heroList = signal<any[]>([]);
  activeHeroIndex = signal<number>(0);
  private heroInterval: any;

  constructor() {
    addIcons({ 
      searchOutline, personCircleOutline, settingsOutline, 
      heartOutline, logOutOutline, playCircle, informationCircleOutline, play 
    });
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    this.isLoggedIn.set(!!token);
    this.loadHomeData();
  }

  ngOnDestroy() {
    // Pulizia del timer quando si esce dalla pagina
    this.stopHeroCarousel();
  }

  loadHomeData() {
    this.isLoading.set(true);
    
    this.http.get<any>('api/home').subscribe({
      next: (res) => {
        const viewed = res.mostViewed || [];
        this.mostViewed.set(viewed);
        this.mostLiked.set(res.mostLiked || []);
        this.continueWatching.set(res.continueWatching || []);
        
        // Estraiamo i primi 5 anime più visti per il grande Banner in cima
        if (viewed.length > 0) {
          this.heroList.set(viewed.slice(0, 5));
          this.startHeroCarousel();
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Errore caricamento Home:', err);
        this.isLoading.set(false);
        this.showToast('Impossibile caricare i contenuti.', 'danger');
      }
    });
  }

  // --- LOGICA CAROSELLO HERO ---
  startHeroCarousel() {
    this.stopHeroCarousel();
    this.heroInterval = setInterval(() => {
      const current = this.activeHeroIndex();
      const max = this.heroList().length - 1;
      this.activeHeroIndex.set(current >= max ? 0 : current + 1);
    }, 7000); // Cambia immagine ogni 7 secondi
  }

  stopHeroCarousel() {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
    }
  }

  // --- LOGICA ROTTE (PLAY & INFO) ---
  playAnime(showId: number, event?: Event) {
    if (event) event.stopPropagation();
    console.log("▶️ Avvio Player per lo show: ", showId);
    // TODO: this.router.navigate(['/player', showId]);
    this.showToast('Avvio riproduzione...', 'success');
  }

  openSeriesInfo(showId: number, event?: Event) {
    if (event) event.stopPropagation();
    console.log("Apro Scheda Dettaglio per lo show: ", showId);
    
    // Viaggia verso la rotta configurata passando l'ID!
    this.router.navigate(['/shows', showId]); 
  }
  

  // --- GESTIONE MENU E PROFILO ---
  async openProfileMenu(ev: any) {
    this.popover.event = ev;
    await this.popover.present();
  }

  onPopoverDismiss() {}
  openUserSettings() { this.popover.dismiss(); }
  openFavorites() { this.popover.dismiss(); }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Disconnetti',
      message: 'Sei sicuro di voler uscire da NexuStream?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Esci',
          role: 'destructive',
          handler: async () => {
            const toast = await this.toastCtrl.create({
              message: 'Sessione chiusa',
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
    this.popover.dismiss();
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}