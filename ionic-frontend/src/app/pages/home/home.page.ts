import { Component, ViewChild, ElementRef, OnDestroy, signal, inject } from '@angular/core';
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
  play, chevronBackOutline, chevronForwardOutline // 🚀 Aggiunte icone frecce
} from 'ionicons/icons';

import { BackendUrlPipe } from '../../pipes/backend-url-pipe';
import { ShowCardComponent } from '@app/components/show-card/show-card.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, BackendUrlPipe,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, 
    IonItem, IonIcon, IonPopover, IonMenuButton, IonButtons, 
    IonSpinner, IonList, ShowCardComponent
  ]
})
export class HomePage implements OnDestroy {
  @ViewChild('profilePopover') popover: any;
  
  // 🚀 Riferimenti alle 3 righe a scorrimento
  @ViewChild('continueWatchingScroll') continueWatchingScroll!: ElementRef;
  @ViewChild('mostViewedScroll') mostViewedScroll!: ElementRef;
  @ViewChild('mostLikedScroll') mostLikedScroll!: ElementRef;
  
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
      heartOutline, logOutOutline, playCircle, informationCircleOutline, 
      play, chevronBackOutline, chevronForwardOutline // 🚀 Registrate icone
    });
  }

  ionViewWillEnter() {
    const token = localStorage.getItem('token');
    this.isLoggedIn.set(!!token);
    this.loadHomeData();
  }
  
  ngOnDestroy() {
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

  // 🚀 Funzione universale per scorrere qualsiasi riga!
  scrollRow(rowType: 'continueWatching' | 'mostViewed' | 'mostLiked', direction: 'left' | 'right') {
    let containerRef: ElementRef | undefined;
    
    if (rowType === 'continueWatching') containerRef = this.continueWatchingScroll;
    else if (rowType === 'mostViewed') containerRef = this.mostViewedScroll;
    else if (rowType === 'mostLiked') containerRef = this.mostLikedScroll;

    if (containerRef && containerRef.nativeElement) {
      const scrollAmount = window.innerWidth > 768 ? 600 : 300; // Scorre di più su PC
      containerRef.nativeElement.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  // --- LOGICA CAROSELLO HERO ---
  startHeroCarousel() {
    this.stopHeroCarousel();
    this.heroInterval = setInterval(() => {
      const current = this.activeHeroIndex();
      const max = this.heroList().length - 1;
      this.activeHeroIndex.set(current >= max ? 0 : current + 1);
    }, 7000); 
  }

  stopHeroCarousel() {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
    }
  }

  playAnime(showId: number, event?: Event) {
    if (event) event.stopPropagation();
    this.router.navigate(['/shows', showId]); 
  }

  openSeriesInfo(showId: number, event?: Event) {
    if (event) event.stopPropagation();
    this.router.navigate(['/shows', showId]); 
  }
  
  async openProfileMenu(ev: any) {
    this.popover.event = ev;
    await this.popover.present();
  }

  onPopoverDismiss() {}
  openUserSettings() { this.popover.dismiss(); }
  openFavorites() { this.popover.dismiss(); }

  resumeEpisode(item: any) {
    if (!item || !item.EpisodeID) return;
    this.router.navigate(['/episode', item.EpisodeID], {
      queryParams: { 
        showId: item.ShowID, 
        seasonId: item.SeasonID,
        startAt: item.Progress 
      }
    });
  }

  removeFromContinueWatching(showId: number) {
    // 1. Aggiornamento UI immediato: la card sparisce all'istante
    const oldList = this.continueWatching();
    this.continueWatching.update(list => list.filter(cw => cw.ShowID !== showId));

    const targetItem = oldList.find(cw => cw.ShowID === showId);
    if (!targetItem) return;

    // 2. Chiamata al backend per rimuovere la cronologia
    const body = {
      progress: 0,
      isCompleted: 0,
      isDropped: 1, 
      isLiked: targetItem.isLiked || 0
    };

    this.http.post(`api/shows/${showId}/seasons/${targetItem.SeasonID}/episodes/${targetItem.EpisodeID}/interact`, body)
      .subscribe({
        next: () => this.showToast('Rimosso dal "Continua a guardare"', 'success'),
        error: (err) => {
          console.error("Errore:", err);
          this.continueWatching.set(oldList); // Rollback
          this.showToast('Errore di connessione', 'danger');
        }
      });
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }

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

}
