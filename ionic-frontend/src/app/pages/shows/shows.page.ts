import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonIcon, IonSpinner, IonSelect, IonSelectOption, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { play, heartOutline, heart, shareSocialOutline } from 'ionicons/icons';


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

    forkJoin({
        showDetails: this.showsService.getShowDetails(id),
        showSeasons: this.showsService.getShowSeasons(id)
    }).subscribe({
        next: (res) => {
            this.show.set(res.showDetails);
            this.seasons.set(res.showSeasons || []);

            

            // Impostiamo il progresso globale per il continua a guardare
            if (res.showDetails && res.showDetails.ResumeEpisodeID) {
                const globalResume = {
                    EpisodeID: res.showDetails.ResumeEpisodeID,
                    EpisodeNumber: res.showDetails.ResumeEpisodeNumber,
                    progress: res.showDetails.ResumeProgress,
                    SeasonID: res.showDetails.ResumeSeasonID,
                    SeasonNumber: res.showDetails.ResumeSeasonNumber
                } as unknown as Episode;
                
                this.resumeEpisode.set(globalResume);
                
            }

            // Carichiamo la stagione
            if (this.seasons().length > 0) {
                const firstSeasonId = this.seasons()[0].SeasonID;
                this.selectedSeasonId.set(firstSeasonId);
                this.loadEpisodes(id, firstSeasonId);
            } else {
                this.isLoading.set(false);
            }
        },
        error: (err) => {
            console.error("Errore durante il caricamento della serie:", err);
            this.isLoading.set(false);
        }
    });
}

loadEpisodes(showId: string, seasonId: number) {
    this.showsService.getEpisodes(showId, seasonId).subscribe({
        next: (eps) => {
            this.episodes.set(eps || []);
            
            const currentResume = this.resumeEpisode();
            
            if (!currentResume && eps && eps.length > 0) {
                this.resumeEpisode.set(eps[0]);
                
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

  onSeasonChange(event: any) {
    const seasonId = event.detail.value;
    this.selectedSeasonId.set(seasonId);
    
    this.isEpisodesLoading.set(true); 
    this.loadEpisodes(this.showId(), seasonId);
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

  playEpisode(passedEpisodeId?: number | string | Event, event?: Event) {
    
    const actualEvent = event || (passedEpisodeId instanceof Event ? passedEpisodeId : null);
    if (actualEvent && actualEvent.target) {
        (actualEvent.target as HTMLElement).blur(); 
    }
    
   
    let epIdNum: number | undefined;

    if (typeof passedEpisodeId === 'number' || typeof passedEpisodeId === 'string') {
        epIdNum = Number(passedEpisodeId);
    } else {
        
        const fallbackId = this.resumeEpisode()?.EpisodeID || (this.resumeEpisode() as any)?.id;
        epIdNum = fallbackId ? Number(fallbackId) : undefined;
    }

    if (!epIdNum) {
        return;
    }

    
    let targetEpisode = this.episodes().find(ep => Number(ep.EpisodeID) === epIdNum);
    
    
    if (!targetEpisode && Number(this.resumeEpisode()?.EpisodeID) === epIdNum) {
        targetEpisode = this.resumeEpisode() as any; 
    }

   
    const savedProgress = targetEpisode?.progress || 0;
    const targetSeasonId = targetEpisode?.SeasonID || this.selectedSeasonId();

    
   
    this.router.navigate(['/episode', epIdNum], {
        queryParams: { 
            showId: this.showId(), 
            seasonId: targetSeasonId,
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