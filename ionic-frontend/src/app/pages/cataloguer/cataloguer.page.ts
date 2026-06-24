import { Component, OnInit, signal, inject } from '@angular/core'
import { Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { firstValueFrom } from 'rxjs'

// IONIC STANDALONE
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonSearchbar,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonBackButton,
    ModalController,
    ToastController,
    InfiniteScrollCustomEvent,
    SearchbarCustomEvent,
    IonSegment,
    IonSegmentButton, 
    IonLabel, 
    IonIcon,
    IonButton
} from '@ionic/angular/standalone'
import { trashOutline, addCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe';

// 🚀 SERVICE E MODELLI
import { CataloguerService } from '../../services/cataloguer'
import { AuthService } from '../../services/auth'
import {
    CataloguerShow,
    CataloguerSeason,
    CataloguerEpisode,
    PropicGroup
} from '../../models/cataloguer'

import { CataloguerShowModalComponent } from '../../components/cataloguer-show-modal/cataloguer-show-modal.component'
import { CataloguerSeasonModalComponent } from '../../components/cataloguer-season-modal/cataloguer-season-modal.component'
import { CataloguerEpisodeModalComponent } from '../../components/cataloguer-episode-modal/cataloguer-episode-modal.component'
import { PropicModalComponent } from '../../components/propic-modal/propic-modal.component'

@Component({
    selector: 'app-cataloguer',
    templateUrl: './cataloguer.page.html',
    styleUrls: ['./cataloguer.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonBackButton,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonContent,
        IonSearchbar,
        IonInfiniteScroll,
        IonInfiniteScrollContent,
        IonSegment, 
        IonSegmentButton, 
        IonLabel, 
        IonIcon,
        BackendUrlPipe,
        IonButton
    ],
})
export class CataloguerPage implements OnInit {
    private router = inject(Router);
    private cataloguerService = inject(CataloguerService);
    private authService = inject(AuthService);
    private toastController = inject(ToastController);
    private modalCtrl = inject(ModalController);

    currentLevel = signal<'shows' | 'seasons' | 'episodes'>('shows');
    activeTab = signal<'catalogo' | 'propics'>('catalogo');
    groupedPropics = signal<PropicGroup[]>([]);

    shows = signal<CataloguerShow[]>([]);
    seasons = signal<CataloguerSeason[]>([]);
    episodes = signal<CataloguerEpisode[]>([]);

    selectedShowId = signal<number | null>(null);
    selectedSeasonId = signal<number | null>(null);

    currentPage = 1;
    pageSize = 20;
    currentSearchTerm = '';

    constructor() {
        addIcons({addCircleOutline, trashOutline});
    }

    ngOnInit() {
        this.loadShows();
    }

    getLangText(jsonString: string, lang: string = 'it'): string {
        try {
            const obj = JSON.parse(jsonString)
            return obj[lang] || obj['it'] || ''
        } catch (e) {
            return jsonString || ''
        }
    }

    // ==========================================
    // MODALE ADD
    // ==========================================
    async openAddModal() {
        const currentLvl = this.currentLevel();
        
        // 1. Prepariamo la modale giusta
        const { targetComponent, componentProps } = this.getAddModalConfig(currentLvl);

        const modal = await this.modalCtrl.create({
            component: targetComponent,
            componentProps: componentProps,
        });
        await modal.present();

        // 2. Attendiamo la chiusura
        const { data } = await modal.onWillDismiss();
        if (!data) return;

        // 3. Costruiamo il payload
        const payload = this.buildAddPayload(currentLvl, data.payload);

        // 4. Inviamo al Backend
        this.cataloguerService.addItem(currentLvl, payload).subscribe({
            next: (res: any) => {
                this.presentToast('Elemento aggiunto con successo!', 'success');
                // 5. Aggiorniamo l'interfaccia visiva
                this.updateSignalsAfterAdd(currentLvl, res, data.payload);
            },
            error: (err) => {
                console.error('Dettaglio Errore Add:', err);
                this.presentToast('Errore durante il salvataggio. Controlla la console.', 'danger');
            },
        });
    }

    // ==========================================
    // MODALE EDIT
    // ==========================================
    async openEditModalData(item: any) {
        const currentLvl = this.currentLevel();
        
        // 1. Prepariamo la modale
        const { targetComponent, componentProps } = this.getEditModalConfig(currentLvl, item);

        const modal = await this.modalCtrl.create({
            component: targetComponent,
            componentProps: componentProps,
        });
        await modal.present();

        // 2. Attendiamo la chiusura
        const { data } = await modal.onWillDismiss();
        if (!data || !data.payload) return;

        const id = currentLvl === 'shows' ? item.ShowID : currentLvl === 'seasons' ? item.SeasonID : item.EpisodeID;

        try {
            // 3. Estraiamo campi extra e traduzioni
            const extraFields = this.buildEditExtraFields(currentLvl, item, data.payload);
            const translations = this.getEditTranslations(item, data.payload);

            // 4. Inviamo le patch al backend (Italiano e Inglese)
            await this.sendEditPatches(currentLvl, id, data.payload, extraFields, translations);

            // 5. Aggiorniamo l'interfaccia visiva
            this.presentToast('Elemento aggiornato con successo!', 'success');
            this.updateSignalsAfterEdit(currentLvl, id, item, data.payload, extraFields, translations);

        } catch (err) {
            console.error('Dettaglio Errore 400 Backend:', err);
            this.presentToast('Errore 400: Controlla i campi obbligatori del server.', 'danger');
        }
    }


    // ==========================================
    // LOGICA TAB E GESTIONE PROPIC (AVATAR)
    // ==========================================

    onTabChange(event: any) {
        const selectedTab = event.detail.value;
        this.activeTab.set(selectedTab);

        if (selectedTab === 'propics' && this.groupedPropics().length === 0) {
            this.loadPropics();
        }
    }

    async openPropicModal(prefillBundle: string = '') {
        const modal = await this.modalCtrl.create({
            component: PropicModalComponent,
            componentProps: { 
                level: this.currentLevel(), 
                bundleName: prefillBundle 
            },
        });
        await modal.present();

        const { data } = await modal.onDidDismiss();
        
        if (this.activeTab() === 'propics') {
            this.loadPropics();
        }
    }

    loadPropics() {
        this.cataloguerService.getPropics().subscribe({
            next: (res) => this.groupedPropics.set(res),
            error: (err) => {
                console.error("Errore caricamento propics:", err);
                this.presentToast("Errore nel caricamento delle immagini.", "danger");
            }
        });
    }

    deletePropic(uri: string) {
        if (!confirm("Sei sicuro di voler eliminare questa immagine? Verrà rimossa fisicamente dal server.")) return;

        this.cataloguerService.deletePropic(uri).subscribe({
            next: () => {
                this.presentToast("Immagine eliminata con successo.", "success");
                this.loadPropics(); 
            },
            error: (err) => {
                console.error(err);
                this.presentToast("Impossibile eliminare l'immagine.", "danger");
            }
        });
    }

    // ==========================================
    // LOGICA LISTE, RICERCA, NAVIGAZIONE E DELETE
    // ==========================================

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
        this.cataloguerService
            .getShows(this.currentPage, this.pageSize, this.currentSearchTerm)
            .subscribe({
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
        this.cataloguerService.deleteShow(showId).subscribe({
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
        if (!this.selectedShowId()) return;
        this.cataloguerService.getSeasons(this.selectedShowId()!).subscribe({
            next: (res) => this.seasons.set(res),
            error: (err) => console.error(err),
        });
    }

    deleteSeason(seasonId: number) {
        if (!confirm('Eliminare la stagione a cascata?')) return;
        this.cataloguerService.deleteSeason(seasonId).subscribe({
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
        if (!this.selectedSeasonId()) return;
        this.cataloguerService.getEpisodes(this.selectedSeasonId()!).subscribe({
            next: (res) => this.episodes.set(res),
            error: (err) => console.error(err),
        });
    }

    deleteEpisode(episodeId: number) {
        if (!confirm("Rimuovere l'episodio dal server?")) return;
        this.cataloguerService.deleteEpisode(episodeId).subscribe({
            next: () => {
                this.presentToast('Episodio rimosso.', 'success');
                this.episodes.update((old) => old.filter((e) => e.EpisodeID !== episodeId));
            },
        });
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
            if (length === 0 || length < this.pageSize) {
                event.target.disabled = true;
            }
        }
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastController.create({
            message,
            duration: 2500,
            position: 'bottom',
            color,
        });
        await toast.present();
    }


    // ==========================================
    // HELPER METHODS 
    // ==========================================

    // --- Helpers per ADD ---
    private getAddModalConfig(currentLvl: string) {
        let targetComponent: any;
        let componentProps: any = {};

        if (currentLvl === 'shows') {
            targetComponent = CataloguerShowModalComponent;
        } else if (currentLvl === 'seasons') {
            targetComponent = CataloguerSeasonModalComponent;
            const maxNum = this.seasons().reduce((max, s) => {
                const val = parseInt(s.SeasonNumber || s['seasonNumber'], 10);
                return !isNaN(val) && val > max ? val : max;
            }, 0);
            componentProps = { autoSeasonNumber: maxNum + 1 };
        } else if (currentLvl === 'episodes') {
            targetComponent = CataloguerEpisodeModalComponent;
            const maxNum = this.episodes().reduce((max, e) => {
                const val = parseInt(e.EpisodeNumber || e['episodeNumber'], 10);
                return !isNaN(val) && val > max ? val : max;
            }, 0);
            componentProps = { seasonId: this.selectedSeasonId(), autoEpisodeNumber: maxNum + 1 };
        }

        return { targetComponent, componentProps };
    }

    private buildAddPayload(currentLvl: string, rawData: any): any {
        if (currentLvl === 'shows') {
            return {
                title_it: rawData.title_it,
                description_it: rawData.description_it,
                title_en: rawData.title_en || null,
                description_en: rawData.description_en || null,
                dateStarted: rawData.dateStarted,
                dateEnded: rawData.dateEnded || null,
                thumbnailURI: rawData.thumbnailURI || null,
                bannerURI: rawData.bannerURI || null,
            };
        } else if (currentLvl === 'seasons') {
            return {
                title_it: rawData.title_it,
                description_it: rawData.description_it,
                title_en: rawData.title_en || null,
                description_en: rawData.description_en || null,
                dateStarted: rawData.dateStarted,
                dateEnded: rawData.dateEnded || null,
                seasonNumber: parseInt(rawData.seasonNumber, 10),
                refShow: this.selectedShowId(),
            };
        } else {
            return {
                title_it: rawData.title_it,
                description_it: rawData.description_it,
                title_en: rawData.title_en || null,
                description_en: rawData.description_en || null,
                releaseDate: rawData.releaseDate,
                duration: parseInt(rawData.duration, 10),
                refSeason: this.selectedSeasonId(),
                episodeNumber: parseInt(rawData.episodeNumber, 10),
                audioTracks: rawData.audioTracks || [],
                subTracks: rawData.subTracks || [],
                DubLanguages: ['it'],
                SubLanguages: ['it'],
                thumbnailURI: rawData.thumbnailURI || null,
                rawVideoURI: rawData.rawVideoURI || null,
                times: rawData.times || [],
            };
        }
    }

    private updateSignalsAfterAdd(currentLvl: string, res: any, rawData: any) {
        const newTitle = JSON.stringify({ it: rawData.title_it, en: rawData.title_en });
        const newDesc = JSON.stringify({ it: rawData.description_it, en: rawData.description_en });

        if (currentLvl === 'shows') {
            const newShow: CataloguerShow = {
                ShowID: res.showId || 1,
                Title: newTitle,
                Description: newDesc,
                DateStarted: rawData.dateStarted,
                hasEnded: rawData.dateEnded ? 1 : 0,
            };
            this.shows.update((items) => [newShow, ...items]);
        } else if (currentLvl === 'seasons') {
            const newSeason: CataloguerSeason = {
                SeasonID: res.seasonId || 1,
                Title: newTitle,
                Description: newDesc,
                DateStarted: rawData.dateStarted,
                SeasonNumber: parseInt(rawData.seasonNumber, 10),
            };
            this.seasons.update((items) => [...items, newSeason].sort((a, b) => a.SeasonNumber - b.SeasonNumber));
        } else if (currentLvl === 'episodes') {
            const newEpisode: CataloguerEpisode = {
                EpisodeID: res.episodeId || 1,
                Title: newTitle,
                Description: newDesc,
                Duration: parseInt(rawData.duration, 10),
                EpisodeNumber: parseInt(rawData.episodeNumber, 10),
                ReleaseDate: rawData.releaseDate,
            };
            this.episodes.update((items) => [...items, newEpisode].sort((a, b) => a.EpisodeNumber - b.EpisodeNumber));
        }
    }

    // --- Helpers per EDIT ---
    private getEditModalConfig(currentLvl: string, item: any) {
        let targetComponent: any;
        let componentProps: any = { data: item };

        if (currentLvl === 'shows') targetComponent = CataloguerShowModalComponent;
        else if (currentLvl === 'seasons') targetComponent = CataloguerSeasonModalComponent;
        else if (currentLvl === 'episodes') {
            targetComponent = CataloguerEpisodeModalComponent;
            componentProps.seasonId = this.selectedSeasonId();
        }

        return { targetComponent, componentProps };
    }

    private buildEditExtraFields(currentLvl: string, item: any, payload: any): any {
        const extraFields: any = {};
        if (currentLvl === 'shows') {
            if (payload.dateEnded !== undefined) extraFields.dateEnded = payload.dateEnded;
            if (payload.thumbnailURI) extraFields.thumbnailURI = payload.thumbnailURI;
            if (payload.bannerURI) extraFields.bannerURI = payload.bannerURI;
        } else if (currentLvl === 'seasons') {
            if (payload.dateEnded !== undefined) extraFields.dateEnded = payload.dateEnded;
        } else if (currentLvl === 'episodes') {
            if (payload.thumbnailURI) extraFields.thumbnailURI = payload.thumbnailURI;
            extraFields.DubLanguages = typeof item.DubLanguages === 'string' ? item.DubLanguages.split(',').filter((l: string) => l.trim() !== '') : item.DubLanguages || ['it'];
            extraFields.SubLanguages = typeof item.SubLanguages === 'string' ? item.SubLanguages.split(',').filter((l: string) => l.trim() !== '') : item.SubLanguages || [];
            if (payload.duration) extraFields.duration = parseInt(payload.duration, 10);
            if (payload.episodeNumber) extraFields.episodeNumber = parseInt(payload.episodeNumber, 10);
            if (payload.audioTracks?.length > 0) extraFields.audioTracks = payload.audioTracks;
            if (payload.subTracks?.length > 0) extraFields.subTracks = payload.subTracks;
            if (payload.times) extraFields.times = payload.times;
        }
        return extraFields;
    }

    private getEditTranslations(item: any, payload: any) {
        return {
            it: {
                title: payload.title_it?.trim() || this.getLangText(item.Title, 'it'),
                desc: payload.description_it?.trim() || this.getLangText(item.Description, 'it')
            },
            en: {
                title: payload.title_en?.trim() || this.getLangText(item.Title, 'en'),
                desc: payload.description_en?.trim() || this.getLangText(item.Description, 'en')
            }
        };
    }

    private async sendEditPatches(currentLvl: 'shows'|'seasons'|'episodes', id: number, payload: any, extraFields: any, trans: any) {
        // PATCH ITALIANO
        if (payload.title_it?.trim() || payload.description_it?.trim() || currentLvl === 'episodes') {
            const payloadIt = {
                title_it: trans.it.title, description_it: trans.it.desc,
                title: trans.it.title, description: trans.it.desc,
                lang: 'it',
                ...extraFields,
            };
            await firstValueFrom(this.cataloguerService.updateItem(currentLvl, id, payloadIt));
        }

        // Cloniamo gli extraFields togliendo quelli che manderebbero in crash il DB se rimandati
        const cleanFields = { ...extraFields };
        delete cleanFields.audioTracks;
        delete cleanFields.subTracks;
        delete cleanFields.thumbnailURI;
        delete cleanFields.bannerURI;
        delete cleanFields.times;

        // PATCH INGLESE
        if (payload.title_en?.trim() || payload.description_en?.trim()) {
            const payloadEn = {
                title_it: trans.it.title, description_it: trans.it.desc,
                title: trans.en.title, description: trans.en.desc,
                lang: 'en',
                ...cleanFields,
            };
            await firstValueFrom(this.cataloguerService.updateItem(currentLvl, id, payloadEn));
        }
    }

    private updateSignalsAfterEdit(currentLvl: string, id: number, item: any, payload: any, extraFields: any, trans: any) {
        const updatedTitle = JSON.stringify({ it: trans.it.title, en: trans.en.title });
        const updatedDesc = JSON.stringify({ it: trans.it.desc, en: trans.en.desc });

        if (currentLvl === 'shows') {
            this.shows.update((items) => items.map((showItem) => {
                if (showItem.ShowID === id) {
                    return {
                        ...showItem,
                        Title: updatedTitle, Description: updatedDesc,
                        DateEnded: extraFields.dateEnded !== undefined ? extraFields.dateEnded : showItem.DateEnded,
                        hasEnded: extraFields.dateEnded ? 1 : 0,
                    };
                }
                return showItem;
            }));
        } else if (currentLvl === 'seasons') {
            this.seasons.update((items) => items.map((seasonItem) => {
                if (seasonItem.SeasonID === id) {
                    return { ...seasonItem, Title: updatedTitle, Description: updatedDesc };
                }
                return seasonItem;
            }));
        } else if (currentLvl === 'episodes') {
            let updatedDubs = item.DubLanguages ? item.DubLanguages.split(',') : ['it'];
            payload.audioTracks?.forEach((t: any) => { if (!updatedDubs.includes(t.lang)) updatedDubs.push(t.lang); });

            let updatedSubs = item.SubLanguages ? item.SubLanguages.split(',') : [];
            payload.subTracks?.forEach((t: any) => { if (!updatedSubs.includes(t.lang)) updatedSubs.push(t.lang); });

            this.episodes.update((items) => items.map((ep) => {
                if (ep.EpisodeID === id) {
                    return {
                        ...ep,
                        Title: updatedTitle, Description: updatedDesc,
                        Duration: extraFields.duration !== undefined ? extraFields.duration : ep.Duration,
                        EpisodeNumber: extraFields.episodeNumber !== undefined ? extraFields.episodeNumber : ep.EpisodeNumber,
                        DubLanguages: updatedDubs.join(','),
                        SubLanguages: updatedSubs.join(','),
                    };
                }
                return ep;
            }).sort((a, b) => a.EpisodeNumber - b.EpisodeNumber));
        }
    }
}