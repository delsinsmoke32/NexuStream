import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

// IONIC STANDALONE
import {
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
    IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent,
    ModalController, ToastController, InfiniteScrollCustomEvent, SearchbarCustomEvent,
} from '@ionic/angular/standalone';

// IMPORT NUOVE MODALI SEPARATE
import { CataloguerShowModalComponent } from '../../components/cataloguer-show-modal/cataloguer-show-modal.component';
import { CataloguerSeasonModalComponent } from '../../components/cataloguer-season-modal/cataloguer-season-modal.component';
import { CataloguerEpisodeModalComponent } from '../../components/cataloguer-episode-modal/cataloguer-episode-modal.component';
import { PropicModalComponent } from '@app/components/propic-modal/propic-modal.component';

@Component({
    selector: 'app-cataloguer',
    templateUrl: './cataloguer.page.html',
    styleUrls: ['./cataloguer.page.scss'],
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
        IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent,
    ],
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
        const currentLvl = this.currentLevel();
        let targetComponent: any;
        let componentProps: any = {};

        // 1. Selezioniamo il componente corretto
        if (currentLvl === 'shows') targetComponent = CataloguerShowModalComponent;
        else if (currentLvl === 'seasons') targetComponent = CataloguerSeasonModalComponent;
        else if (currentLvl === 'episodes') {
            targetComponent = CataloguerEpisodeModalComponent;
            componentProps = { seasonId: this.selectedSeasonId() }; // Passiamo l'ID stagione
        }

        const modal = await this.modalCtrl.create({
            component: targetComponent,
            componentProps: componentProps,
        });
        await modal.present();

        const { data } = await modal.onWillDismiss();
        if (!data) return;

        let endpoint = '';
        let payload: any = {};

        // 2. Costruiamo il Payload pulito
        if (currentLvl === 'shows') {
            endpoint = `${this.baseUrl}/shows/add`;
            payload = {
                title_it: data.payload.title_it,
                description_it: data.payload.description_it,
                title_en: data.payload.title_en || null,
                description_en: data.payload.description_en || null,
                dateStarted: data.payload.dateStarted,
                dateEnded: data.payload.dateEnded || null,
                thumbnailURI: data.payload.thumbnailURI || null,
                bannerURI: data.payload.bannerURI || null,
            };
        } else if (currentLvl === 'seasons') {
            endpoint = `${this.baseUrl}/seasons/add`;
            payload = {
                title_it: data.payload.title_it,
                description_it: data.payload.description_it,
                title_en: data.payload.title_en || null,
                description_en: data.payload.description_en || null,
                dateStarted: data.payload.dateStarted,
                dateEnded: data.payload.dateEnded || null,
                seasonNumber: parseInt(data.payload.seasonNumber, 10),
                refShow: this.selectedShowId(),
            };
        } else if (currentLvl === 'episodes') {
            endpoint = `${this.baseUrl}/episodes/add`;
            payload = {
                title_it: data.payload.title_it,
                description_it: data.payload.description_it,
                title_en: data.payload.title_en || null,
                description_en: data.payload.description_en || null,
                releaseDate: data.payload.releaseDate,
                duration: parseInt(data.payload.duration, 10),
                refSeason: this.selectedSeasonId(),
                episodeNumber: parseInt(data.payload.episodeNumber, 10),
                DubLanguages: ['it'], // Dummy per ora
                SubLanguages: ['it'], // Dummy per ora
                thumbnailURI: data.payload.thumbnailURI || null,
            };
        }

        this.http.post(endpoint, payload, { headers: this.getAuthHeaders() })
        .subscribe({
            next: (res: any) => {
                this.presentToast('Elemento aggiunto con successo!', 'success');
                
                // Prepariamo i testi in formato JSON
                const newTitle = JSON.stringify({ 
                    it: data.payload.title_it, 
                    en: data.payload.title_en 
                });
                const newDesc = JSON.stringify({ 
                    it: data.payload.description_it, 
                    en: data.payload.description_en 
                });

                if (currentLvl === 'shows') {
                    const newShow = {
                        ShowID: res.showId || 1, // Prende l'ID dal backend o usa un fallback
                        Title: newTitle,
                        Description: newDesc,
                        DateStarted: data.payload.dateStarted,
                        hasEnded: data.payload.dateEnded ? 1 : 0
                    };
                    // Inseriamo la nuova serie in CIMA alla lista
                    this.shows.update(items => [newShow, ...items]); 
                    
                } else if (currentLvl === 'seasons') {
                    const newSeason = {
                        SeasonID: res.seasonId || 1,
                        Title: newTitle,
                        Description: newDesc,
                        DateStarted: data.payload.dateStarted,
                        SeasonNumber: parseInt(data.payload.seasonNumber, 10)
                    };
                    // Aggiungiamo la stagione e riordiniamo per Numero Stagione
                    this.seasons.update(items => {
                        const updated = [...items, newSeason];
                        return updated.sort((a, b) => a.SeasonNumber - b.SeasonNumber);
                    });

                } else if (currentLvl === 'episodes') {
                    const newEpisode = {
                        EpisodeID: res.episodeId || 1,
                        Title: newTitle,
                        Description: newDesc,
                        Duration: parseInt(data.payload.duration, 10),
                        EpisodeNumber: parseInt(data.payload.episodeNumber, 10),
                        ReleaseDate: data.payload.releaseDate
                    };
                    // Aggiungiamo l'episodio e riordiniamo per Numero Episodio
                    this.episodes.update(items => {
                        const updated = [...items, newEpisode];
                        return updated.sort((a, b) => a.EpisodeNumber - b.EpisodeNumber);
                    });
                }
            },
            error: (err) => {
                console.error("Dettaglio Errore Add:", err);
                this.presentToast('Errore durante il salvataggio. Controlla la console.', 'danger');
            },
        });
    }

    // ==========================================
    // MODIFICA UNIFICATA E SUPER-BLINDATA (EDIT)
    // ==========================================
    async openEditModalData(item: any) {
        const currentLvl = this.currentLevel();
        let targetComponent: any;
        let componentProps: any = { data: item };

        // 1. Selezioniamo il componente corretto
        if (currentLvl === 'shows') targetComponent = CataloguerShowModalComponent;
        else if (currentLvl === 'seasons') targetComponent = CataloguerSeasonModalComponent;
        else if (currentLvl === 'episodes') {
            targetComponent = CataloguerEpisodeModalComponent;
            componentProps.seasonId = this.selectedSeasonId();
        }

        const modal = await this.modalCtrl.create({
            component: targetComponent,
            componentProps: componentProps,
        });
        await modal.present();

        const { data } = await modal.onWillDismiss();
        if (!data || !data.payload) return;

        const id = currentLvl === 'shows' ? item.ShowID : currentLvl === 'seasons' ? item.SeasonID : item.EpisodeID;
        const subPath = currentLvl === 'shows' ? 'shows' : currentLvl === 'seasons' ? 'seasons' : 'episodes';

        try {
            const extraFields: any = {};

            if (currentLvl === 'shows') {
                if (data.payload.dateEnded !== undefined) extraFields.dateEnded = data.payload.dateEnded;
                if (data.payload.thumbnailURI) extraFields.thumbnailURI = data.payload.thumbnailURI;
                if (data.payload.bannerURI) extraFields.bannerURI = data.payload.bannerURI;
            } else if (currentLvl === 'seasons') {
                if (data.payload.dateEnded !== undefined) extraFields.dateEnded = data.payload.dateEnded;
            } else if (currentLvl === 'episodes') {
                if (data.payload.thumbnailURI) extraFields.thumbnailURI = data.payload.thumbnailURI;
                extraFields.DubLanguages = item.DubLanguages || ['it'];
                extraFields.SubLanguages = item.SubLanguages || ['it'];
                if (data.payload.duration) extraFields.duration = parseInt(data.payload.duration, 10);
                if (data.payload.episodeNumber) extraFields.episodeNumber = parseInt(data.payload.episodeNumber, 10);
            }

            const currentTitleIt = data.payload.title_it?.trim() || this.getLangText(item.Title, 'it');
            const currentDescIt = data.payload.description_it?.trim() || this.getLangText(item.Description, 'it');
            const currentTitleEn = data.payload.title_en?.trim() || this.getLangText(item.Title, 'en');
            const currentDescEn = data.payload.description_en?.trim() || this.getLangText(item.Description, 'en');

            // PATCH ITALIANO (Invia i campi per il validatore e quelli per il controller)
            if (data.payload.title_it?.trim() || data.payload.description_it?.trim() || currentLvl === 'episodes') {
                const payloadIt: any = { 
                    title_it: currentTitleIt,       // Accontenta il Validatore
                    description_it: currentDescIt,  // Accontenta il Validatore
                    title: currentTitleIt,          // Accontenta il Controller
                    description: currentDescIt,     // Accontenta il Controller
                    lang: 'it',                     // Specifica la lingua
                    ...extraFields 
                };
                await firstValueFrom(this.http.patch(`${this.baseUrl}/${subPath}/${id}`, payloadIt, { headers: this.getAuthHeaders() }));
            }

            // PATCH INGLESE
            if (data.payload.title_en?.trim() || data.payload.description_en?.trim()) {
                const payloadEn: any = { 
                    title_it: currentTitleIt,       // Obbligatorio per bypassare il Validatore
                    description_it: currentDescIt,  // Obbligatorio per bypassare il Validatore
                    title: currentTitleEn,          // Accontenta il Controller per l'inglese
                    description: currentDescEn,     // Accontenta il Controller per l'inglese
                    lang: 'en',
                    ...extraFields 
                };
                await firstValueFrom(this.http.patch(`${this.baseUrl}/${subPath}/${id}`, payloadEn, { headers: this.getAuthHeaders() }));
            }

            
            this.presentToast('Elemento aggiornato con successo!', 'success');
            // 1. Ricostruiamo i JSON per i campi multilingua (per far funzionare getLangText nell'HTML)
            const updatedTitle = JSON.stringify({ it: currentTitleIt, en: currentTitleEn });
            const updatedDesc = JSON.stringify({ it: currentDescIt, en: currentDescEn });

            // 2. Aggiorniamo a caldo i Signal in base al livello
            if (currentLvl === 'shows') {
                this.shows.update(items => items.map(item => {
                    if (item.ShowID === id) {
                        return {
                            ...item,
                            Title: updatedTitle,
                            Description: updatedDesc,
                            DateEnded: extraFields.dateEnded !== undefined ? extraFields.dateEnded : item.DateEnded,
                            hasEnded: extraFields.dateEnded ? 1 : 0 // Aggiorna il badge "In Corso / Conclusa"
                        };
                    }
                    return item;
                }));
            } else if (currentLvl === 'seasons') {
                this.seasons.update(items => items.map(item => {
                    if (item.SeasonID === id) {
                        return { ...item, Title: updatedTitle, Description: updatedDesc };
                    }
                    return item;
                }));
            } else if (currentLvl === 'episodes') {
                this.episodes.update(items => items.map(item => {
                    if (item.EpisodeID === id) {
                        return {
                            ...item,
                            Title: updatedTitle,
                            Description: updatedDesc,
                            Duration: extraFields.duration !== undefined ? extraFields.duration : item.Duration,
                            EpisodeNumber: extraFields.episodeNumber !== undefined ? extraFields.episodeNumber : item.EpisodeNumber
                        };
                    }
                    return item;
                }));
                // Opzionale: Riordiniamo gli episodi se hai modificato il Numero Episodio
                this.episodes.update(items => items.sort((a, b) => a.EpisodeNumber - b.EpisodeNumber));
            }

        } catch (err) {
            console.error('Dettaglio Errore 400 Backend:', err);
            this.presentToast('Errore 400: Controlla i campi obbligatori del server.', 'danger');
        }
    }

    private refreshCurrentLevel() {
        if (this.currentLevel() === 'shows') {
            this.currentPage = 1;
            this.loadShows(false);
        } else if (this.currentLevel() === 'seasons') {
            this.loadSeasons();
        } else {
            this.loadEpisodes();
        }
    }

    loadShows(isAppend: boolean = false, event?: InfiniteScrollCustomEvent) {
        let url = `${this.baseUrl}/shows?page=${this.currentPage}&limit=${this.pageSize}`;
        if (this.currentSearchTerm) url += `&search=${this.currentSearchTerm}`;

        this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).subscribe({
            next: (res) => {
                if (isAppend) this.shows.update((old) => [...old, ...res]);
                else this.shows.set(res);
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
                if (infiniteScroll) infiniteScroll.disabled = false;
                this.loadShows(false);
            },
            error: (err) => {
                console.error(err);
                this.presentToast("Errore durante l'eliminazione.", 'danger');
            },
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
        if (!confirm("Rimuovere l'episodio dal server?")) return;
        this.http.delete(`${this.baseUrl}/episodes/${episodeId}`, { headers: this.getAuthHeaders() }).subscribe({
            next: () => {
                this.presentToast('Episodio rimosso.', 'success');
                this.episodes.update((old) => old.filter((e) => e.EpisodeID !== episodeId));
            },
        });
    }

    async openPropicModal() {
        const modal = await this.modalCtrl.create({
            component: PropicModalComponent,
            componentProps: { level: this.currentLevel() },
        });
        await modal.present();
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
        // Se riceviamo meno elementi di quelli richiesti, o esattamente 0, siamo alla fine.
        if (length === 0 || length < this.pageSize) {
            event.target.disabled = true;
        }
    }
}

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastController.create({
            message, duration: 2500, position: 'bottom', color,
        });
        await toast.present();
    }

    logout() {
        localStorage.clear();
        this.router.navigate(['/login']);
    }
}