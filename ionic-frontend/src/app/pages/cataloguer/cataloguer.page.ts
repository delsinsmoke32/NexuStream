import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

// 🚀 IMPORTAZIONI STANDALONE CHIRURGICHE
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonContent, 
  IonSearchbar, 
  IonInfiniteScroll, 
  IonInfiniteScrollContent, 
  ModalController, 
  ToastController,
  InfiniteScrollCustomEvent,
  SearchbarCustomEvent
} from '@ionic/angular/standalone';

import { CataloguerModalComponent } from '../../components/cataloguer-modal/cataloguer-modal.component';

@Component({
    selector: 'app-cataloguer',
    templateUrl: './cataloguer.page.html',
    styleUrls: ['./cataloguer.page.scss'],
    standalone: true,
    imports: [
      CommonModule, 
      FormsModule, 
      CataloguerModalComponent,
      // 🚀 Registriamo singolarmente i componenti Ionic usati nell'HTML
      IonHeader, 
      IonToolbar, 
      IonTitle, 
      IonButtons, 
      IonButton, 
      IonContent, 
      IonSearchbar, 
      IonInfiniteScroll, 
      IonInfiniteScrollContent
    ]
})
export class CataloguerPage implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    private toastController = inject(ToastController);
    private modalCtrl = inject(ModalController);

    currentLevel = signal<'shows' | 'seasons' | 'episodes'>('shows');

    shows = signal<any[]>([]);
    seasons = signal<any[]>([]);
    episodes = signal<any[]>([]);

    selectedShowId = signal<number | null>(null);
    selectedSeasonId = signal<number | null>(null);

    currentPage = 1;
    pageSize = 20;
    currentSearchTerm = '';

    private baseUrl = 'api/cataloguer';

    ngOnInit() {
        this.loadShows();
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    /** Helper per estrarre il testo multilingua dalle stringhe JSON del DB */
    getLangText(jsonString: string, lang: string = 'it'): string {
        try {
            const obj = JSON.parse(jsonString);
            return obj[lang] || obj['it'] || '';
        } catch (e) {
            return jsonString || '';
        }
    }

    // ==========================================
    // METODO UNIFICATO APERTURA MODALE (ADD)
    // ==========================================
    async openAddModal() {
        const modal = await this.modalCtrl.create({
          component: CataloguerModalComponent,
          componentProps: { level: this.currentLevel() }
        });
        await modal.present();

        const { data } = await modal.onWillDismiss();
        if (!data) return;

        let endpoint = '';
        let payload = {};

        if (this.currentLevel() === 'shows') {
          endpoint = `${this.baseUrl}/shows/add`;
          payload = {
            title: data.payload.title_it,
            description: data.payload.description_it,
            title_it: data.payload.title_it,
            description_it: data.payload.description_it,
            title_en: data.payload.title_en || null,
            description_en: data.payload.description_en || null,
            dateStarted: data.payload.dateStarted,
            dateEnded: data.payload.dateEnded || null,
            thumbnailURI: data.payload.thumbnailURI || null,
            bannerURI: data.payload.bannerURI || null
          };
        } 
        else if (this.currentLevel() === 'seasons') {
          endpoint = `${this.baseUrl}/seasons/add`;
          payload = {
            title: data.payload.title_it,
            description: data.payload.description_it,
            title_it: data.payload.title_it,
            description_it: data.payload.description_it,
            title_en: data.payload.title_en || null,
            description_en: data.payload.description_en || null,
            dateStarted: data.payload.dateStarted,
            dateEnded: data.payload.dateEnded || null,
            seasonNumber: data.payload.seasonNumber,
            refShow: this.selectedShowId()
          };
        } 
        else if (this.currentLevel() === 'episodes') {
          endpoint = `${this.baseUrl}/episodes/add`;
          payload = {
            title: data.payload.title_it,
            description: data.payload.description_it,
            title_it: data.payload.title_it,
            description_it: data.payload.description_it,
            title_en: data.payload.title_en || null,
            description_en: data.payload.description_en || null,
            releaseDate: data.payload.releaseDate,
            duration: parseInt(data.payload.duration, 10),
            refSeason: this.selectedSeasonId(),
            episodeNumber: data.payload.episodeNumber,
            DubLanguages: ['it'],
            SubLanguages: ['it'],
            thumbnailURI: data.payload.thumbnailURI || null
          };
        }

        this.http.post(endpoint, payload, { headers: this.getAuthHeaders() }).subscribe({
          next: () => {
            this.presentToast('Elemento aggiunto con successo!', 'success');
            this.refreshCurrentLevel();
          },
          error: () => this.presentToast('Errore durante il salvataggio.', 'danger')
        });
    }

    // ==========================================
    // MODIFICA UNIFICATA E SUPER-BLINDATA (EDIT)
    // ==========================================
    async openEditModalData(item: any) {
        const modal = await this.modalCtrl.create({
          component: CataloguerModalComponent,
          componentProps: { level: this.currentLevel(), data: item }
        });
        await modal.present();

        const { data } = await modal.onWillDismiss();
        if (!data || !data.payload) return;

        const currentLvl = this.currentLevel();
        const id = currentLvl === 'shows' ? item.ShowID : currentLvl === 'seasons' ? item.SeasonID : item.EpisodeID;
        const subPath = currentLvl === 'shows' ? 'shows' : currentLvl === 'seasons' ? 'seasons' : 'episodes';

        try {
          const extraFields: any = {};
          
          if (currentLvl === 'shows') {
            if (data.payload.dateEnded) extraFields.dateEnded = data.payload.dateEnded;
            if (data.payload.thumbnailURI) extraFields.thumbnailURI = data.payload.thumbnailURI;
            if (data.payload.bannerURI) extraFields.bannerURI = data.payload.bannerURI;
          } 
          else if (currentLvl === 'seasons') {
            if (data.payload.dateEnded) extraFields.dateEnded = data.payload.dateEnded;
          } 
          else if (currentLvl === 'episodes') {
            if (data.payload.thumbnailURI) extraFields.thumbnailURI = data.payload.thumbnailURI;
            
            extraFields.DubLanguages = item.DubLanguages || ['it'];
            extraFields.SubLanguages = item.SubLanguages || ['it'];
            if (item.Duration) extraFields.duration = parseInt(item.Duration, 10);
            if (item.EpisodeNumber) extraFields.episodeNumber = parseInt(item.EpisodeNumber, 10);
          }

          const currentTitleIt = data.payload.title_it?.trim() || this.getLangText(item.Title, 'it');
          const currentDescIt = data.payload.description_it?.trim() || this.getLangText(item.Description, 'it');
          const currentTitleEn = data.payload.title_en?.trim() || this.getLangText(item.Title, 'en');
          const currentDescEn = data.payload.description_en?.trim() || this.getLangText(item.Description, 'en');

          // PATCH ITALIANO
          if (data.payload.title_it?.trim() || data.payload.description_it?.trim() || currentLvl === 'episodes') {
            const payloadIt: any = { 
              lang: 'it', 
              title: currentTitleIt, 
              description: currentDescIt,
              ...extraFields 
            };
            await firstValueFrom(this.http.patch(`${this.baseUrl}/${subPath}/${id}`, payloadIt, { headers: this.getAuthHeaders() }));
          }

          // PATCH INGLESE
          if (data.payload.title_en?.trim() || data.payload.description_en?.trim()) {
            const payloadEn: any = { 
              lang: 'en', 
              title: currentTitleEn, 
              description: currentDescEn,
              ...extraFields 
            };
            await firstValueFrom(this.http.patch(`${this.baseUrl}/${subPath}/${id}`, payloadEn, { headers: this.getAuthHeaders() }));
          }

          this.presentToast('Elemento aggiornato con successo!', 'success');
          this.refreshCurrentLevel();
        } catch (err) {
          console.error("Dettaglio Errore 400 Backend:", err);
          this.presentToast('Errore 400: Controlla i campi obbligatori del server.', 'danger');
        }
    }

    private refreshCurrentLevel() {
      if (this.currentLevel() === 'shows') { this.currentPage = 1; this.loadShows(false); }
      else if (this.currentLevel() === 'seasons') { this.loadSeasons(); }
      else { this.loadEpisodes(); }
    }

    loadShows(isAppend: boolean = false, event?: InfiniteScrollCustomEvent) {
        let url = `${this.baseUrl}/shows?page=${this.currentPage}&limit=${this.pageSize}`;
        if (this.currentSearchTerm) url += `&search=${this.currentSearchTerm}`;

        this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).subscribe({
            next: (res) => {
                if (isAppend) { this.shows.update((old) => [...old, ...res]); } 
                else { this.shows.set(res); }
                this.handleInfiniteScrollComplete(res.length, event);
            },
            error: (err) => console.error(err),
        });
    }

    deleteShow(showId: number) {
        if (!confirm('Eliminare la serie? Operazione irreversibile.')) return;
        this.http.delete(`${this.baseUrl}/shows/${showId}`, { headers: this.getAuthHeaders() }).subscribe({
            next: () => {
                this.presentToast('Serie eliminata con successo.', 'success');
                this.currentPage = 1;
                
                const infiniteScroll = document.querySelector('ion-infinite-scroll') as any;
                if (infiniteScroll) {
                    infiniteScroll.disabled = false;
                }

                this.loadShows(false);
            },
            error: (err) => {
                console.error(err);
                this.presentToast('Errore durante l\'eliminazione.', 'danger');
            }
        });
    }

    navigateToSeasons(showId: number) {
        this.selectedShowId.set(showId);
        this.currentLevel.set('seasons');
        this.loadSeasons();
    }

    loadSeasons() {
        const url = `${this.baseUrl}/seasons?refShow=${this.selectedShowId()}`;
        this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).subscribe({
            next: (res) => this.seasons.set(res),
            error: (err) => console.error(err),
        });
    }

    deleteSeason(seasonId: number) {
        if (!confirm('Eliminare la stagione a cascata?')) return;
        this.http.delete(`${this.baseUrl}/seasons/${seasonId}`, { headers: this.getAuthHeaders() }).subscribe({
            next: () => {
                this.presentToast('Stagione rimossa.', 'success');
                this.seasons.update((old) => old.filter((s) => s.SeasonID !== seasonId));
            },
        });
    }

    navigateToEpisodes(seasonId: number) {
        this.selectedSeasonId.set(seasonId);
        this.currentLevel.set('episodes');
        this.loadEpisodes();
    }

    loadEpisodes() {
        const url = `${this.baseUrl}/episodes?refSeason=${this.selectedSeasonId()}`;
        this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).subscribe({
            next: (res) => this.episodes.set(res),
            error: (err) => console.error(err),
        });
    }

    deleteEpisode(episodeId: number) {
        if (!confirm('Rimuovere l\'episodio dal server?')) return;
        this.http.delete(`${this.baseUrl}/episodes/${episodeId}`, { headers: this.getAuthHeaders() }).subscribe({
            next: () => {
                this.presentToast('Episodio rimosso.', 'success');
                this.episodes.update((old) => old.filter((e) => e.EpisodeID !== episodeId));
            },
        });
    }

    async managePropics() {
        const uri = prompt("Inserisci l'URI completo della Propic:");
        if (!uri?.trim()) return;

        const action = confirm("Clicca OK per AGGIUNGERE la propic, ANNULLA per RIMUOVERLA.");
        if (action) {
            this.http.post(`${this.baseUrl}/propic`, { propicURI: uri }, { headers: this.getAuthHeaders() }).subscribe({
                next: () => this.presentToast('Propic aggiunta!', 'success'),
                error: (err) => this.presentToast(err.error?.error || 'Errore', 'danger')
            });
        } else {
            this.http.delete(`${this.baseUrl}/propic`, { headers: this.getAuthHeaders(), body: { propicURI: uri } }).subscribe({
                next: () => this.presentToast('Propic rimossa!', 'success'),
                error: (err) => this.presentToast(err.error?.error || 'Errore', 'danger')
            });
        }
    }

    navigateBack() {
        if (this.currentLevel() === 'episodes') {
            this.currentLevel.set('seasons');
            this.loadSeasons();
        } else if (this.currentLevel() === 'seasons') {
            this.currentLevel.set('shows');
            this.currentPage = 1;
            this.loadShows(false);
        }
    }

    onSearch(event: SearchbarCustomEvent) {
        this.currentSearchTerm = event.detail.value?.trim() || '';
        this.currentPage = 1;
        if (this.currentLevel() === 'shows') this.loadShows(false);
    }

    loadMoreData(event: InfiniteScrollCustomEvent) {
        if (this.currentLevel() === 'shows') {
            this.currentPage++;
            this.loadShows(true, event);
        } else {
            event.target.complete();
        }
    }

    private handleInfiniteScrollComplete(length: number, event?: InfiniteScrollCustomEvent) {
        if (event && event.target) {
            event.target.complete();
            if (length < this.pageSize) event.target.disabled = true;
        }
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastController.create({ message, duration: 2500, position: 'bottom', color });
        await toast.present();
    }

    logout() {
        localStorage.clear();
        this.router.navigate(['/login']);
    }
}