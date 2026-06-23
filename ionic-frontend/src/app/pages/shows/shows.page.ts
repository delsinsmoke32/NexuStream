import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonIcon, IonSpinner, IonSelect, IonSelectOption, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { play, heartOutline, heart, shareSocialOutline } from 'ionicons/icons';

// Iniezione di forkJoin da RxJS
import { forkJoin } from 'rxjs';

import { BackendUrlPipe } from '../../pipes/backend-url-pipe';
import { EpisodeCardComponent } from '../../components/episode-card/episode-card.component';
import { ShowsService } from '../../services/shows';
import { ShowDetails, Season, Episode } from '../../models/shows';

@Component({
  selector: 'app-shows',
  templateUrl: './shows.page.html',
  styleUrls: ['./shows.page.scss'],
  standalone: true,
  imports: [
    CommonModule, BackendUrlPipe, EpisodeCardComponent,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonIcon, IonSpinner, IonSelect, IonSelectOption
  ]
})
export class ShowsPage {
  private showsService = inject(ShowsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  isLoading = signal<boolean>(true);
  isEpisodesLoading = signal<boolean>(false);
  
  // Dati tipizzati tramite i Modelli
  showId = signal<string>('');
  show = signal<ShowDetails | null>(null);
  seasons = signal<Season[]>([]);
  episodes = signal<Episode[]>([]);
  
  // Stato interattivo
  selectedSeasonId = signal<number | null>(null);
  resumeEpisode = signal<Episode | null>(null);

  constructor() {
    addIcons({ play, heartOutline, heart, shareSocialOutline });
  }

  ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.showId.set(id);
      this.loadShowsData(id);
    }
  }

  loadShowsData(id: string) {
    this.isLoading.set(true);
    
    // Sfruttiamo il service all'interno della forkJoin originaria
    forkJoin({
      showDetails: this.showsService.getShowDetails(id),
      showSeasons: this.showsService.getShowSeasons(id)
    }).subscribe({
      next: (res) => {
        this.show.set(res.showDetails);
        this.seasons.set(res.showSeasons || []);
        
        if (this.seasons().length > 0) {
          const firstSeasonId = this.seasons()[0].SeasonID;
          this.selectedSeasonId.set(firstSeasonId);
          this.loadEpisodes(id, firstSeasonId);
        } else {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Errore nel recupero della serie o delle stagioni:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSeasonChange(event: any) {
    const seasonId = event.detail.value;
    this.selectedSeasonId.set(seasonId);
    
    this.isEpisodesLoading.set(true); 
    this.loadEpisodes(this.showId(), seasonId);
  }

  loadEpisodes(showId: string, seasonId: number) {
    this.showsService.getEpisodes(showId, seasonId).subscribe({
      next: (eps) => {
        this.episodes.set(eps || []);
        if (eps && eps.length > 0) {
          const inProgressEp = eps.find(ep => ep.progress > 5 && ep.isCompleted === 0);
          this.resumeEpisode.set(inProgressEp || eps[0]);
        } else {
          this.resumeEpisode.set(null);
        }
        
        this.isLoading.set(false); 
        this.isEpisodesLoading.set(false); 
      },
      error: (err) => {
        console.error('Errore nel recupero degli episodi:', err);
        this.isLoading.set(false);
        this.isEpisodesLoading.set(false);
      }
    });
  }

  openEpisodeInfo(episodeId: number) {
    if (!episodeId) return;

    this.router.navigate(['/episode', episodeId], {
      queryParams: { 
        showId: this.showId(), 
        seasonId: this.selectedSeasonId() 
      }
    });
  }

  playEpisode(episodeId: number | undefined, event?: Event) {
    if (event && event.target) {
      (event.target as HTMLElement).blur(); 
    }
    if (!episodeId) return;
    
    const targetEpisode = this.episodes().find(ep => ep.EpisodeID === episodeId);
    const savedProgress = targetEpisode?.progress || 0;

    this.router.navigate(['/episode', episodeId], {
      queryParams: { 
        showId: this.showId(), 
        seasonId: this.selectedSeasonId(),
        startAt: savedProgress
      }
    });
  }

  getSelectedSeason() {
    return this.seasons().find(s => s.SeasonID === this.selectedSeasonId());
  }

  toggleFavorite() {
    const currentShow = this.show();
    if (!currentShow) return;

    const userToken = localStorage.getItem('token'); 
    
    if (!userToken) {
      this.showToast($localize `:@@loginRequiredFavouritesToast:Devi accedere per aggiungere ai preferiti!`, 'danger');
      return; 
    }

    const wasFavorited = currentShow.isFavorited;
    const newStatus = wasFavorited ? 0 : 1;

    this.show.update(s => s ? { ...s, isFavorited: newStatus } : null);

    this.showsService.toggleFavoriteStatus(this.showId(), newStatus).subscribe({
      next: () => {
        this.showToast(newStatus ? $localize `:@@addedToFavouritesToast:Aggiunto ai Preferiti` : $localize `:@@removedFromFavouritesToast:Rimosso dai Preferiti`, 'success');
      },
      error: (err) => {
        console.error("Errore salvataggio preferito: ", err);
        this.show.update(s => s ? { ...s, isFavorited: wasFavorited } : null);
        this.showToast($localize `:@@connessionErr:Errore di connessione. Riprova.`, 'danger');
      }
    });
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}