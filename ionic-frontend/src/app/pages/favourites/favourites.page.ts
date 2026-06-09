import { Component, ViewChild, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, 
  IonButton, IonPopover, IonBackButton, IonButtons, 
  IonItem, IonList, IonSpinner, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heartDislikeOutline, personCircleOutline, settingsOutline, heartOutline, logOutOutline } from 'ionicons/icons';

// 🚀 Importiamo la nostra nuova fantastica card
import { ShowCardComponent } from '../../components/show-card/show-card.component';

@Component({
  selector: 'app-favourites',
  templateUrl: './favourites.page.html',
  styleUrls: ['./favourites.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, ShowCardComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, 
    IonButton, IonPopover, IonButtons, IonBackButton, 
    IonList, IonItem, IonSpinner
  ]
})
export class FavouritesPage {
  @ViewChild('profilePopover') popover: any;
  
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  isLoading = signal<boolean>(true);
  favorites = signal<any[]>([]);

  constructor() { 
    addIcons({ heartDislikeOutline, personCircleOutline, settingsOutline, heartOutline, logOutOutline });
  }

  ionViewWillEnter() {
    this.loadFavorites();
  }

  // 1. Recupero dei preferiti
  loadFavorites() {
    this.isLoading.set(true);
    this.http.get<any[]>('api/shows/favorites').subscribe({
      next: (res) => {
        this.favorites.set(res || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Errore nel recupero preferiti:', err);
        this.isLoading.set(false);
        this.showToast('Impossibile caricare i preferiti.', 'danger');
      }
    });
  }

  // 2. Rimozione dai preferiti
  removeFromFavorites(showId: number) {
    // Salviamo la lista vecchia in caso di errore di rete
    const oldFavs = this.favorites();
    
    // Aggiornamento ottimistico: filtriamo via la card istantaneamente!
    this.favorites.update(favs => favs.filter(anime => anime.ShowID !== showId));

    // Invio la chiamata POST all'API
    const payload = { showId: showId, isLiked: 0 };
    this.http.post(`api/shows/${showId}/interact`, payload).subscribe({
      next: () => {
        this.showToast('Rimosso dai Preferiti', 'success');
      },
      error: (err) => {
        console.error("Errore rimozione preferito:", err);
        // ROLLBACK: Se la chiamata fallisce, rimettiamo la card al suo posto
        this.favorites.set(oldFavs); 
        this.showToast('Errore di connessione. Riprova.', 'danger');
      }
    });
  }

  // --- AZIONI NAVIGAZIONE CARD ---
  openSeriesInfo(showId: number) {
    this.router.navigate(['/shows', showId]);
  }

  playAnime(show: any) {
    // Ricordati che l'evento (play) emette tutto l'oggetto, quindi estraiamo l'ID
    const id = show.ShowID || show.id;
    this.router.navigate(['/shows', id]);
  }

  // --- MENU PROFILO ---
  async openProfileMenu(ev: any) {
    this.popover.event = ev;
    await this.popover.present();
  }
  onPopoverDismiss() {}
  openUserSettings() { this.popover.dismiss(); }
  openFavorites() { this.popover.dismiss(); }
  
  logout() { 
    this.popover.dismiss();
    // Aggiungi qui la logica di pulizia localStorage se serve
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
  }
}