import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
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
export class ShowsPage implements OnInit {
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

  ngOnInit() {
    // Legge l'ID dello show dall'URL (es. /shows/5)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.showId.set(id);
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
          this.resumeEpisode.set(eps[0]);
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

  getSelectedSeason() {
    return this.seasons().find(s => s.SeasonID === this.selectedSeasonId());
  }

  playEpisode(episodeId: number) {
    console.log("▶️ Avvio player per l'episodio ID:", episodeId);
    // TODO: Aggiungi il routing al tuo player video
    // this.router.navigate(['/player', episodeId]);
  }

  openEpisodeInfo(episodeId: number) {
    console.log("ℹ️ Apro la pagina dettagli dell'episodio ID:", episodeId);
    // this.router.navigate(['/episode', episodeId]);
    this.showToast('Pagina episodio in sviluppo', 'success');
  }

  toggleFavorite() {
    const currentShow = this.show();
    if (!currentShow) return;

    const userToken = localStorage.getItem('token'); 
    
    if (!userToken) {
      // L'utente non è loggato: mostra errore e interrompi la funzione
      this.showToast('Devi accedere per aggiungere ai preferiti!', 'danger');
      return; 
    }

    // 1. Calcoliamo lo stato futuro (se era preferito diventa 0, altrimenti 1)
    // Assumiamo che il backend ci passi "isFavorited" come flag per l'utente loggato
    const wasFavorited = currentShow.isFavorited;
    const newStatus = wasFavorited ? 0 : 1;

    // 2. Aggiornamento Ottimistico della UI (Sembra istantaneo all'utente)
    this.show.update(s => ({ ...s, isFavorited: newStatus }));

    // 3. Chiamata API per il salvataggio reale
    const payload = { isLiked: newStatus };
    
    this.http.post(`api/shows/${this.showId()}/interact`, payload).subscribe({
      next: () => {
        // Mostriamo la conferma
        this.showToast(newStatus ? 'Aggiunto ai Preferiti' : 'Rimosso dai Preferiti', 'success');
      },
      error: (err) => {
        console.error("Errore salvataggio preferito: ", err);
        // Rollback: se il server dà errore, rimettiamo il segnalibro come prima
        this.show.update(s => ({ ...s, isFavorited: wasFavorited }));
        this.showToast('Errore di connessione. Riprova.', 'danger');
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