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
} from '@ionic/angular/standalone'

// 🚀 SERVICE E MODELLI
import { CataloguerService } from '../../services/cataloguer'
import { AuthService } from '../../services/auth'
import {
    CataloguerShow,
    CataloguerSeason,
    CataloguerEpisode,
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
    ],
})
export class CataloguerPage implements OnInit {
    private router = inject(Router)
    private cataloguerService = inject(CataloguerService)
    private authService = inject(AuthService)
    private toastController = inject(ToastController)
    private modalCtrl = inject(ModalController)

    currentLevel = signal<'shows' | 'seasons' | 'episodes'>('shows')

    shows = signal<CataloguerShow[]>([])
    seasons = signal<CataloguerSeason[]>([])
    episodes = signal<CataloguerEpisode[]>([])

    selectedShowId = signal<number | null>(null)
    selectedSeasonId = signal<number | null>(null)

    currentPage = 1
    pageSize = 20
    currentSearchTerm = ''

    ngOnInit() {
        this.loadShows()
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
    // METODO UNIFICATO APERTURA MODALE (ADD)
    // ==========================================
    async openAddModal() {
        const currentLvl = this.currentLevel()
        let targetComponent: any
        let componentProps: any = {}

        if (currentLvl === 'shows')
            targetComponent = CataloguerShowModalComponent
        else if (currentLvl === 'seasons') {
            targetComponent = CataloguerSeasonModalComponent
            const maxNum = this.seasons().reduce((max, s) => {
                const val = parseInt(s.SeasonNumber || s['seasonNumber'], 10)
                return !isNaN(val) && val > max ? val : max
            }, 0)
            componentProps = { autoSeasonNumber: maxNum + 1 }
        } else if (currentLvl === 'episodes') {
            targetComponent = CataloguerEpisodeModalComponent
            const maxNum = this.episodes().reduce((max, e) => {
                const val = parseInt(e.EpisodeNumber || e['episodeNumber'], 10)
                return !isNaN(val) && val > max ? val : max
            }, 0)
            componentProps = {
                seasonId: this.selectedSeasonId(),
                autoEpisodeNumber: maxNum + 1,
            }
        }

        const modal = await this.modalCtrl.create({
            component: targetComponent,
            componentProps: componentProps,
        })
        await modal.present()

        const { data } = await modal.onWillDismiss()
        if (!data) return

        let payload: any = {}

        if (currentLvl === 'shows') {
            payload = {
                title_it: data.payload.title_it,
                description_it: data.payload.description_it,
                title_en: data.payload.title_en || null,
                description_en: data.payload.description_en || null,
                dateStarted: data.payload.dateStarted,
                dateEnded: data.payload.dateEnded || null,
                thumbnailURI: data.payload.thumbnailURI || null,
                bannerURI: data.payload.bannerURI || null,
            }
        } else if (currentLvl === 'seasons') {
            payload = {
                title_it: data.payload.title_it,
                description_it: data.payload.description_it,
                title_en: data.payload.title_en || null,
                description_en: data.payload.description_en || null,
                dateStarted: data.payload.dateStarted,
                dateEnded: data.payload.dateEnded || null,
                seasonNumber: parseInt(data.payload.seasonNumber, 10),
                refShow: this.selectedShowId(),
            }
        } else if (currentLvl === 'episodes') {
            payload = {
                title_it: data.payload.title_it,
                description_it: data.payload.description_it,
                title_en: data.payload.title_en || null,
                description_en: data.payload.description_en || null,
                releaseDate: data.payload.releaseDate,
                duration: parseInt(data.payload.duration, 10),
                refSeason: this.selectedSeasonId(),
                episodeNumber: parseInt(data.payload.episodeNumber, 10),
                audioTracks: data.payload.audioTracks || [],
                subTracks: data.payload.subTracks || [],
                DubLanguages: ['it'],
                SubLanguages: ['it'],
                thumbnailURI: data.payload.thumbnailURI || null,
                rawVideoURI: data.payload.rawVideoURI || null,
                times: data.payload.times || [],
            }
        }

        this.cataloguerService.addItem(currentLvl, payload).subscribe({
            next: (res: any) => {
                this.presentToast('Elemento aggiunto con successo!', 'success')

                const newTitle = JSON.stringify({
                    it: data.payload.title_it,
                    en: data.payload.title_en,
                })
                const newDesc = JSON.stringify({
                    it: data.payload.description_it,
                    en: data.payload.description_en,
                })

                if (currentLvl === 'shows') {
                    const newShow: CataloguerShow = {
                        ShowID: res.showId || 1,
                        Title: newTitle,
                        Description: newDesc,
                        DateStarted: data.payload.dateStarted,
                        hasEnded: data.payload.dateEnded ? 1 : 0,
                    }
                    this.shows.update((items) => [newShow, ...items])
                } else if (currentLvl === 'seasons') {
                    const newSeason: CataloguerSeason = {
                        SeasonID: res.seasonId || 1,
                        Title: newTitle,
                        Description: newDesc,
                        DateStarted: data.payload.dateStarted,
                        SeasonNumber: parseInt(data.payload.seasonNumber, 10),
                    }
                    this.seasons.update((items) => {
                        const updated = [...items, newSeason]
                        return updated.sort(
                            (a, b) => a.SeasonNumber - b.SeasonNumber
                        )
                    })
                } else if (currentLvl === 'episodes') {
                    const newEpisodeId = res.episodeId || 1
                    const newEpisode: CataloguerEpisode = {
                        EpisodeID: newEpisodeId,
                        Title: newTitle,
                        Description: newDesc,
                        Duration: parseInt(data.payload.duration, 10),
                        EpisodeNumber: parseInt(data.payload.episodeNumber, 10),
                        ReleaseDate: data.payload.releaseDate,
                    }
                    this.episodes.update((items) => {
                        const updated = [...items, newEpisode]
                        return updated.sort(
                            (a, b) => a.EpisodeNumber - b.EpisodeNumber
                        )
                    })
                }
            },
            error: (err) => {
                console.error('Dettaglio Errore Add:', err)
                this.presentToast(
                    'Errore durante il salvataggio. Controlla la console.',
                    'danger'
                )
            },
        })
    }

    // ==========================================
    // MODIFICA UNIFICATA E SUPER-BLINDATA (EDIT)
    // ==========================================
    async openEditModalData(item: any) {
        const currentLvl = this.currentLevel()
        let targetComponent: any
        let componentProps: any = { data: item }

        if (currentLvl === 'shows')
            targetComponent = CataloguerShowModalComponent
        else if (currentLvl === 'seasons')
            targetComponent = CataloguerSeasonModalComponent
        else if (currentLvl === 'episodes') {
            targetComponent = CataloguerEpisodeModalComponent
            componentProps.seasonId = this.selectedSeasonId()
        }

        const modal = await this.modalCtrl.create({
            component: targetComponent,
            componentProps: componentProps,
        })
        await modal.present()

        const { data } = await modal.onWillDismiss()
        if (!data || !data.payload) return

        const id =
            currentLvl === 'shows'
                ? item.ShowID
                : currentLvl === 'seasons'
                  ? item.SeasonID
                  : item.EpisodeID

        try {
            const extraFields: any = {}

            if (currentLvl === 'shows') {
                if (data.payload.dateEnded !== undefined)
                    extraFields.dateEnded = data.payload.dateEnded
                if (data.payload.thumbnailURI)
                    extraFields.thumbnailURI = data.payload.thumbnailURI
                if (data.payload.bannerURI)
                    extraFields.bannerURI = data.payload.bannerURI
            } else if (currentLvl === 'seasons') {
                if (data.payload.dateEnded !== undefined)
                    extraFields.dateEnded = data.payload.dateEnded
            } else if (currentLvl === 'episodes') {
                if (data.payload.thumbnailURI)
                    extraFields.thumbnailURI = data.payload.thumbnailURI

                extraFields.DubLanguages =
                    typeof item.DubLanguages === 'string'
                        ? item.DubLanguages.split(',').filter(
                              (l: string) => l.trim() !== ''
                          )
                        : item.DubLanguages || ['it']

                extraFields.SubLanguages =
                    typeof item.SubLanguages === 'string'
                        ? item.SubLanguages.split(',').filter(
                              (l: string) => l.trim() !== ''
                          )
                        : item.SubLanguages || []

                if (data.payload.duration)
                    extraFields.duration = parseInt(data.payload.duration, 10)
                if (data.payload.episodeNumber)
                    extraFields.episodeNumber = parseInt(
                        data.payload.episodeNumber,
                        10
                    )
                if (
                    data.payload.audioTracks &&
                    data.payload.audioTracks.length > 0
                ) {
                    extraFields.audioTracks = data.payload.audioTracks
                }
                if (
                    data.payload.subTracks &&
                    data.payload.subTracks.length > 0
                ) {
                    extraFields.subTracks = data.payload.subTracks
                }
                if (data.payload.times) {
                    extraFields.times = data.payload.times
                }
            }

            const currentTitleIt =
                data.payload.title_it?.trim() ||
                this.getLangText(item.Title, 'it')
            const currentDescIt =
                data.payload.description_it?.trim() ||
                this.getLangText(item.Description, 'it')
            const currentTitleEn =
                data.payload.title_en?.trim() ||
                this.getLangText(item.Title, 'en')
            const currentDescEn =
                data.payload.description_en?.trim() ||
                this.getLangText(item.Description, 'en')

            // PATCH ITALIANO
            if (
                data.payload.title_it?.trim() ||
                data.payload.description_it?.trim() ||
                currentLvl === 'episodes'
            ) {
                const payloadIt: any = {
                    title_it: currentTitleIt,
                    description_it: currentDescIt,
                    title: currentTitleIt,
                    description: currentDescIt,
                    lang: 'it',
                    ...extraFields,
                }
                await firstValueFrom(
                    this.cataloguerService.updateItem(currentLvl, id, payloadIt)
                )
            }

            // Pulizia campi per evitare ridondanze e crash sul DB
            delete extraFields.audioTracks
            delete extraFields.subTracks
            delete extraFields.thumbnailURI
            delete extraFields.bannerURI
            delete extraFields.times

            // PATCH INGLESE
            if (
                data.payload.title_en?.trim() ||
                data.payload.description_en?.trim()
            ) {
                const payloadEn: any = {
                    title_it: currentTitleIt,
                    description_it: currentDescIt,
                    title: currentTitleEn,
                    description: currentDescEn,
                    lang: 'en',
                    ...extraFields,
                }
                await firstValueFrom(
                    this.cataloguerService.updateItem(currentLvl, id, payloadEn)
                )
            }

            this.presentToast('Elemento aggiornato con successo!', 'success')
            const updatedTitle = JSON.stringify({
                it: currentTitleIt,
                en: currentTitleEn,
            })
            const updatedDesc = JSON.stringify({
                it: currentDescIt,
                en: currentDescEn,
            })

            if (currentLvl === 'shows') {
                this.shows.update((items) =>
                    items.map((showItem) => {
                        if (showItem.ShowID === id) {
                            return {
                                ...showItem,
                                Title: updatedTitle,
                                Description: updatedDesc,
                                DateEnded:
                                    extraFields.dateEnded !== undefined
                                        ? extraFields.dateEnded
                                        : showItem.DateEnded,
                                hasEnded: extraFields.dateEnded ? 1 : 0,
                            }
                        }
                        return showItem
                    })
                )
            } else if (currentLvl === 'seasons') {
                this.seasons.update((items) =>
                    items.map((seasonItem) => {
                        if (seasonItem.SeasonID === id) {
                            return {
                                ...seasonItem,
                                Title: updatedTitle,
                                Description: updatedDesc,
                            }
                        }
                        return seasonItem
                    })
                )
            } else if (currentLvl === 'episodes') {
                let updatedDubs = item.DubLanguages
                    ? item.DubLanguages.split(',')
                    : ['it']
                if (data.payload.audioTracks) {
                    data.payload.audioTracks.forEach((t: any) => {
                        if (!updatedDubs.includes(t.lang))
                            updatedDubs.push(t.lang)
                    })
                }

                let updatedSubs = item.SubLanguages
                    ? item.SubLanguages.split(',')
                    : []
                if (data.payload.subTracks) {
                    data.payload.subTracks.forEach((t: any) => {
                        if (!updatedSubs.includes(t.lang))
                            updatedSubs.push(t.lang)
                    })
                }

                this.episodes.update((items) =>
                    items.map((ep) => {
                        if (ep.EpisodeID === id) {
                            return {
                                ...ep,
                                Title: updatedTitle,
                                Description: updatedDesc,
                                Duration:
                                    extraFields.duration !== undefined
                                        ? extraFields.duration
                                        : ep.Duration,
                                EpisodeNumber:
                                    extraFields.episodeNumber !== undefined
                                        ? extraFields.episodeNumber
                                        : ep.EpisodeNumber,
                                DubLanguages: updatedDubs.join(','),
                                SubLanguages: updatedSubs.join(','),
                            }
                        }
                        return ep
                    })
                )
                this.episodes.update((items) =>
                    items.sort((a, b) => a.EpisodeNumber - b.EpisodeNumber)
                )
            }
        } catch (err) {
            console.error('Dettaglio Errore 400 Backend:', err)
            this.presentToast(
                'Errore 400: Controlla i campi obbligatori del server.',
                'danger'
            )
        }
    }

    private refreshCurrentLevel() {
        if (this.currentLevel() === 'shows') {
            this.currentPage = 1
            this.loadShows(false)
        } else if (this.currentLevel() === 'seasons') {
            this.loadSeasons()
        } else {
            this.loadEpisodes()
        }
    }

    loadShows(isAppend: boolean = false, event?: InfiniteScrollCustomEvent) {
        this.cataloguerService
            .getShows(this.currentPage, this.pageSize, this.currentSearchTerm)
            .subscribe({
                next: (res) => {
                    if (isAppend) this.shows.update((old) => [...old, ...res])
                    else this.shows.set(res)
                    this.handleInfiniteScrollComplete(res.length, event)
                },
                error: (err) => console.error(err),
            })
    }

    deleteShow(showId: number) {
        if (!confirm('Eliminare la serie? Operazione irreversibile.')) return
        this.cataloguerService.deleteShow(showId).subscribe({
            next: () => {
                this.presentToast('Serie eliminata con successo.', 'success')
                this.currentPage = 1
                const infiniteScroll = document.querySelector(
                    'ion-infinite-scroll'
                ) as any
                if (infiniteScroll) infiniteScroll.disabled = false
                this.loadShows(false)
            },
            error: (err) => {
                console.error(err)
                this.presentToast("Errore durante l'eliminazione.", 'danger')
            },
        })
    }

    navigateToSeasons(showId: number) {
        this.selectedShowId.set(showId)
        this.currentLevel.set('seasons')
        this.loadSeasons()
    }

    loadSeasons() {
        if (!this.selectedShowId()) return
        this.cataloguerService.getSeasons(this.selectedShowId()!).subscribe({
            next: (res) => this.seasons.set(res),
            error: (err) => console.error(err),
        })
    }

    deleteSeason(seasonId: number) {
        if (!confirm('Eliminare la stagione a cascata?')) return
        this.cataloguerService.deleteSeason(seasonId).subscribe({
            next: () => {
                this.presentToast('Stagione rimossa.', 'success')
                this.seasons.update((old) =>
                    old.filter((s) => s.SeasonID !== seasonId)
                )
            },
        })
    }

    navigateToEpisodes(seasonId: number) {
        this.selectedSeasonId.set(seasonId)
        this.currentLevel.set('episodes')
        this.loadEpisodes()
    }

    loadEpisodes() {
        if (!this.selectedSeasonId()) return
        this.cataloguerService.getEpisodes(this.selectedSeasonId()!).subscribe({
            next: (res) => this.episodes.set(res),
            error: (err) => console.error(err),
        })
    }

    deleteEpisode(episodeId: number) {
        if (!confirm("Rimuovere l'episodio dal server?")) return
        this.cataloguerService.deleteEpisode(episodeId).subscribe({
            next: () => {
                this.presentToast('Episodio rimosso.', 'success')
                this.episodes.update((old) =>
                    old.filter((e) => e.EpisodeID !== episodeId)
                )
            },
        })
    }

    async openPropicModal() {
        const modal = await this.modalCtrl.create({
            component: PropicModalComponent,
            componentProps: { level: this.currentLevel() },
        })
        await modal.present()
    }

    navigateBack() {
        if (this.currentLevel() === 'episodes') {
            this.currentLevel.set('seasons')
            this.loadSeasons()
        } else if (this.currentLevel() === 'seasons') {
            this.currentLevel.set('shows')
            this.currentPage = 1
            this.loadShows(false)
        }
    }

    onSearch(event: SearchbarCustomEvent) {
        this.currentSearchTerm = event.detail.value?.trim() || ''
        this.currentPage = 1
        if (this.currentLevel() === 'shows') this.loadShows(false)
    }

    loadMoreData(event: InfiniteScrollCustomEvent) {
        if (this.currentLevel() === 'shows') {
            this.currentPage++
            this.loadShows(true, event)
        } else {
            event.target.complete()
        }
    }

    private handleInfiniteScrollComplete(
        length: number,
        event?: InfiniteScrollCustomEvent
    ) {
        if (event && event.target) {
            event.target.complete()
            if (length === 0 || length < this.pageSize) {
                event.target.disabled = true
            }
        }
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastController.create({
            message,
            duration: 2500,
            position: 'bottom',
            color,
        })
        await toast.present()
    }

    // async logout() {
    //     await this.authService.confirmLogout();
    // }
}
