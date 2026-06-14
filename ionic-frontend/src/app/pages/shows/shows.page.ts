import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router} from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonIcon, IonSpinner, IonSelect, IonSelectOption, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { play, heartOutline, heart, shareSocialOutline } from 'ionicons/icons';

// Importiamo forkJoin da RxJS per eseguire chiamate HTTP in parallelo
import { forkJoin } from 'rxjs';

import { BackendUrlPipe } from '../../pipes/backend-url-pipe';
import { EpisodeCardComponent } from '../../components/episode-card/episode-card.component';

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
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  isLoading = signal<boolean>(true);
  isEpisodesLoading = signal<boolean>(false);
  
  // Dati
  showId = signal<string>(''); // Salviamo l'ID dello show per usarlo nelle chiamate successive
  show = signal<any>(null);
  seasons = signal<any[]>([]);
  episodes = signal<any[]>([]);
  
  
  // Stato interattivo
  selectedSeasonId = signal<number | null>(null);
  resumeEpisode = signal<any>(null); // Episodio da inserire nel bottone Play principale

  constructor() {
    addIcons({ play, heartOutline, heart, shareSocialOutline });
  }

  ionViewWillEnter() {
    // Legge l'ID dello show dall'URL (es. /shows/5)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.showId.set(id);
      
      // Ora ogni volta che torni alla lista episodi, scaricherà i secondi aggiornati!
      this.loadShowsData(id);
    }
  }

  loadShowsData(id: string) {
    this.isLoading.set(true);
    
    // Eseguiamo 2 chiamate separate in parallelo: una per la serie, una per le sue stagioni
    forkJoin({
      showDetails: this.http.get<any>(`api/shows/${id}`),
      showSeasons: this.http.get<any[]>(`api/shows/${id}/seasons`)
    }).subscribe({
      next: (res) => {
        this.show.set(res.showDetails);
        this.seasons.set(res.showSeasons || []);
        
        // Se ci sono stagioni, selezioniamo la prima di default e carichiamo i suoi episodi
        if (this.seasons().length > 0) {
          const firstSeasonId = this.seasons()[0].SeasonID;
          this.selectedSeasonId.set(firstSeasonId);
          this.loadEpisodes(id, firstSeasonId);
        } else {
          this.isLoading.set(false); // Nessuna stagione, fermiamo il caricamento
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
    
    // Usiamo il nuovo signal per non distruggere la pagina!
    this.isEpisodesLoading.set(true); 
    this.loadEpisodes(this.showId(), seasonId);
  }

  // Chiamata RESTful per gli episodi di una specifica stagione di uno specifico show
  loadEpisodes(showId: string, seasonId: number) {
    this.http.get<any[]>(`api/shows/${showId}/seasons/${seasonId}/episodes`).subscribe({
      next: (eps) => {
        this.episodes.set(eps || []);
        if (eps && eps.length > 0) {
          
          // 🚀 CERCA L'EPISODIO INIZIATO MA NON FINITO
          const inProgressEp = eps.find(ep => ep.progress > 5 && ep.isCompleted === 0);
          
          // Imposta l'episodio da riprendere (se non c'è, usa il primo della lista)
          this.resumeEpisode.set(inProgressEp || eps[0]);
        } else {
          this.resumeEpisode.set(null);
        }
        
        // Spegniamo entrambi i caricamenti
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

  playEpisode(episodeId: number, event?: Event) {
    if (event && event.target) {
      // Toglie il focus dal bottone prima di cambiare pagina
      (event.target as HTMLElement).blur(); 
    }
    if (!episodeId) return;
    
    // 1. Troviamo l'episodio cliccato
    const targetEpisode = this.episodes().find(ep => ep.EpisodeID === episodeId);
    
    // 2. Estraiamo il progresso salvato
    const savedProgress = targetEpisode?.progress || 0;

    // 3. Navighiamo passando lo startAt!
    this.router.navigate(['/episode', episodeId], {
      queryParams: { 
        showId: this.showId(), 
        seasonId: this.selectedSeasonId(),
        startAt: savedProgress // 🚀 INIETTIAMO I SECONDI NELL'URL
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

    this.show.update(s => ({ ...s, isFavorited: newStatus }));

    const payload = { isLiked: newStatus };
    
    this.http.post(`api/shows/${this.showId()}/interact`, payload).subscribe({
      next: () => {
        this.showToast(newStatus ? $localize `:@@addedToFavouritesToast:Aggiunto ai Preferiti` : $localize `:@@removedFromFavouritesToast:Rimosso dai Preferiti`, 'success');
      },
      error: (err) => {
        console.error("Errore salvataggio preferito: ", err);
        this.show.update(s => ({ ...s, isFavorited: wasFavorited }));
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