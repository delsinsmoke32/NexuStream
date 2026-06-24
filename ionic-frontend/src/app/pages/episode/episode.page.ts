import {
    Component,
    inject,
    OnInit,
    OnDestroy,
    signal,
    ViewChild,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, RouterModule, Router, RouterLink } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'
import { combineLatest } from 'rxjs'
import {
    IonContent, // 🚀 Fondamentale per lo scroll
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonSpinner,
    ToastController,
    ModalController,
    AlertController,
    IonBackButton,
    IonToolbar,
    IonButtons,
    IonHeader,
    NavController
} from '@ionic/angular/standalone'
import {
    addCircleOutline,
    playCircle,
    shareSocialOutline,
    heartOutline,
    heart,
    chatbubblesOutline,
    chevronForwardOutline,
    createOutline,
    trashOutline, arrowBackOutline } from 'ionicons/icons'
import { addIcons } from 'ionicons'
import { CommentsComponent } from '@app/components/comments/comments.component'
import { DiscussionModalComponent } from '@app/components/discussion-modal/discussion-modal.component'
import { jwtDecodeHelper } from '@app/utils/jwt-helper'
import { VideoPlayerComponent } from '@app/components/video-player/video-player.component'

@Component({
    selector: 'app-episode',
    templateUrl: './episode.page.html',
    styleUrls: ['./episode.page.scss'],
    standalone: true,
    imports: [
        IonContent,
        IonButton,
        IonCard,
        IonCardContent,
        CommonModule,
        IonIcon,
        IonSpinner,
        RouterModule,
        CommentsComponent,
        VideoPlayerComponent,
        BackendUrlPipe,
        IonBackButton,
        RouterLink,
        IonToolbar,
        IonHeader,
        IonButtons
    ],
    providers: [BackendUrlPipe],
})
export class EpisodePage implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute)
    private router = inject(Router)
    private http = inject(HttpClient)
    public backendUrl = inject(BackendUrlPipe)
    private modalCtrl = inject(ModalController)
    private alertCtrl = inject(AlertController)
    private toastCtrl = inject(ToastController)
    private navCtrl = inject(NavController);

    isLoading = signal<boolean>(true)
    episode = signal<any>(null)
    seasonEpisodes = signal<any[]>([])
    discussions = signal<any[]>([])
    isLoggedIn = signal<boolean>(false);

    showId = signal<string>('')
    seasonId = signal<string>('')
    episodeId = signal<string>('')

    startAtTime = signal<number>(0)
    isMod = signal<boolean>(false)
    expandedDiscussionId = signal<string | null>(null)

    private lastKnownProgress = 0
    private saveTimeout: any

    // 🚀 1. Catturiamo IonContent per poter fare lo scroll
    @ViewChild(IonContent) content!: IonContent
    
    @ViewChild(VideoPlayerComponent) videoPlayerComponent!: VideoPlayerComponent

    constructor() {
        addIcons({arrowBackOutline,chatbubblesOutline,createOutline,trashOutline,shareSocialOutline,addCircleOutline,playCircle,heartOutline,heart,chevronForwardOutline,});
    }

    ngOnInit() {
        const token = localStorage.getItem('token');
        this.isLoggedIn.set(!!token);
        if (token) {
            const decodedToken = jwtDecodeHelper(token)
            if (decodedToken && decodedToken.isMod === 1) this.isMod.set(true)
        }

        combineLatest([
            this.route.paramMap,
            this.route.queryParamMap,
        ]).subscribe(async ([params, queryParams]) => {
            const epId = params.get('id') || params.get('episodeId')

            // 🚀 Rimosso il blocco isNavigating che causava conflitti
            if (epId) {
                
                // Se l'ID dell'episodio sta cambiando (l'utente naviga ad un altro episodio)
                if (this.episodeId() && this.episodeId() !== epId) {
                    this.saveProgress(this.lastKnownProgress, 0, true)
                    if (this.videoPlayerComponent) {
                        await this.videoPlayerComponent.killPlayer()
                    }
                }

                const sId = queryParams.get('showId') || '1'
                const seaId = queryParams.get('seasonId') || '1'
                const startParam = queryParams.get('startAt')

                this.startAtTime.set(startParam ? parseInt(startParam, 10) : 0)

                this.showId.set(sId)
                this.seasonId.set(seaId)
                this.episodeId.set(epId)

                this.isLoading.set(true)

                this.loadEpisodeData(sId, seaId, epId)
                this.loadSeasonEpisodes(sId, seaId)
                this.loadDiscussions(sId, seaId, epId)
            }
        })
    }

    loadEpisodeData(showId: string, seasonId: string, episodeId: string) {
        this.http
            .get<any>(
                `api/shows/${showId}/seasons/${seasonId}/episodes/${episodeId}`
            )
            .subscribe({
                next: (res) => {
                    this.episode.set(res)
                    this.isLoading.set(false) 
                },
                error: (err) => {
                    console.error('Errore nel recupero episodio:', err)
                    this.isLoading.set(false)
                },
            })
    }

    loadSeasonEpisodes(showId: string, seasonId: string) {
        this.http
            .get<any[]>(`api/shows/${showId}/seasons/${seasonId}/episodes`)
            .subscribe({
                next: (res) => this.seasonEpisodes.set(res),
                error: (err) =>
                    console.error('Errore nel recupero stagione:', err),
            })
    }

    loadDiscussions(showId: string, seasonId: string, episodeId: string) {
        this.http
            .get<
                any[]
            >(`api/shows/${showId}/seasons/${seasonId}/episodes/${episodeId}/discussions`)
            .subscribe({
                next: (res) => this.discussions.set(res || []),
                error: (err) => this.discussions.set([]),
            })
    }

    getComputedStartTime(): number {
        if (this.startAtTime() > 0) return this.startAtTime()
        return (
            this.episode()?.userInteraction?.progress ||
            this.episode()?.progress ||
            0
        )
    }

    handlePlayerPause(currentTime: number) {
        this.lastKnownProgress = currentTime
        this.saveProgress(currentTime, 0)
    }

    handlePlayerEnded(currentTime: number) {
        this.lastKnownProgress = currentTime
        this.saveProgress(currentTime, 1, true)
    }

    handlePlayerDestroySave(currentTime: number) {
        this.saveProgress(currentTime, 0, true)
    }

    handleCommentTimestamp(seconds: number) {
        if (this.videoPlayerComponent) {
            this.videoPlayerComponent.seekTo(seconds);
            // 🚀 2. Scorriamo fluidamente in cima alla pagina per mostrare il video!
            if (this.content) {
                this.content.scrollToTop(500); // 500 = millisecondi di durata dell'animazione
            }
        }
    }

    // 🚀 Modificato in ASYNC per attendere la morte del player prima di navigare
    async handleNextEpisode() {
        const currentEpId = parseInt(this.episodeId(), 10)
        const eps = this.seasonEpisodes()

        const currentEp = eps.find((e) => e.EpisodeID === currentEpId)
        if (!currentEp) return

        // Uccidiamo il player PRIMA di cambiare URL
        if (this.videoPlayerComponent) {
            await this.videoPlayerComponent.killPlayer();
        }

        const nextEp = eps.find(
            (e) => e.EpisodeNumber === currentEp.EpisodeNumber + 1
        )

        if (nextEp) {
            this.router.navigate(['/episode', nextEp.EpisodeID], {
                queryParams: {
                    showId: this.showId(),
                    seasonId: this.seasonId(),
                },
            })
        } else {
            this.checkAndNavigateToNextSeason()
        }
    }

    async checkAndNavigateToNextSeason() {
        // Uccidiamo il player anche nel caso di salto di stagione
        if (this.videoPlayerComponent) {
            await this.videoPlayerComponent.killPlayer();
        }

        this.http.get<any[]>(`api/shows/${this.showId()}/seasons`).subscribe({
            next: (seasons) => {
                const currentSeasonId = parseInt(this.seasonId(), 10)
                const currentSeason = seasons.find(
                    (s) => s.SeasonID === currentSeasonId
                )

                if (!currentSeason) return

                const nextSeason = seasons.find(
                    (s) => s.SeasonNumber === currentSeason.SeasonNumber + 1
                )

                if (nextSeason) {
                    this.http
                        .get<
                            any[]
                        >(`api/shows/${this.showId()}/seasons/${nextSeason.SeasonID}/episodes`)
                        .subscribe({
                            next: (nextSeasonEps) => {
                                const firstEp = nextSeasonEps.find(
                                    (e) => e.EpisodeNumber === 1
                                )

                                if (firstEp) {
                                    this.showToast(
                                        `Inizio Stagione ${nextSeason.SeasonNumber}...`,
                                        'success'
                                    )
                                    this.router.navigate(
                                        ['/episode', firstEp.EpisodeID],
                                        {
                                            queryParams: {
                                                showId: this.showId(),
                                                seasonId: nextSeason.SeasonID,
                                            },
                                        }
                                    )
                                }
                            },
                        })
                } else {
                    this.showToast('Hai concluso la serie!', 'success')
                }
            },
            error: (err) => console.error('Errore salto di stagione:', err),
        })
    }

    saveProgress(
        currentTime: number,
        isCompleted: number,
        immediate: boolean = false
    ) {
        if (!this.episode() || currentTime <= 5) return

        const body = {
            progress: currentTime,
            isCompleted: isCompleted,
            isDropped: 0,
            isLiked:
                this.episode()?.isLiked ??
                this.episode()?.userInteraction?.isLiked ??
                0,
        }

        if (this.saveTimeout) clearTimeout(this.saveTimeout)

        if (immediate) {
            this.http
                .post(
                    `api/shows/${this.showId()}/seasons/${this.seasonId()}/episodes/${this.episodeId()}/interact`,
                    body
                )
                .subscribe({
                    error: (err) =>
                        console.error('Errore salvataggio in chiusura:', err),
                })
        } else {
            this.saveTimeout = setTimeout(() => {
                this.http
                    .post(
                        `api/shows/${this.showId()}/seasons/${this.seasonId()}/episodes/${this.episodeId()}/interact`,
                        body
                    )
                    .subscribe({
                        error: (err) =>
                            console.error('Errore salvataggio ritardato:', err),
                    })
            }, 1000)
        }
    }

    toggleLike() {
        const currentEp = this.episode()
        if (!currentEp) return

        const userToken = localStorage.getItem('token')
        if (!userToken) {
            this.showToast(
                $localize`:@@logInToLike:Devi accedere per mettere Mi Piace!`,
                'danger'
            )
            return
        }

        const wasLiked =
            currentEp.isLiked || currentEp.userInteraction?.isLiked ? 1 : 0
        const newStatus = wasLiked ? 0 : 1

        this.episode.update((ep) => ({
            ...ep,
            isLiked: newStatus,
            userInteraction: ep.userInteraction
                ? { ...ep.userInteraction, isLiked: newStatus }
                : undefined,
        }))

        const isCompleted =
            currentEp.isCompleted ?? currentEp.userInteraction?.isCompleted ?? 0
        const body = {
            progress: this.lastKnownProgress,
            isCompleted: isCompleted,
            isDropped: 0,
            isLiked: newStatus,
        }

        this.http
            .post(
                `api/shows/${this.showId()}/seasons/${this.seasonId()}/episodes/${this.episodeId()}/interact`,
                body
            )
            .subscribe({
                error: (err) => {
                    this.episode.update((ep) => ({
                        ...ep,
                        isLiked: wasLiked,
                        userInteraction: ep.userInteraction
                            ? { ...ep.userInteraction, isLiked: wasLiked }
                            : undefined,
                    }))
                    this.showToast(
                        $localize`:@@connessionErr:Errore di connessione.`,
                        'danger'
                    )
                },
            })
    }

    async openDiscussionModal(discussion?: any, event?: Event) {
        if (event) {
            event.stopPropagation()
            event.preventDefault()
        }

        const modal = await this.modalCtrl.create({
            component: DiscussionModalComponent,
            componentProps: {
                discussion: discussion,
                episodeId: this.episodeId(),
            },
        })

        await modal.present()

        const { data } = await modal.onDidDismiss()
        if (data?.payload) {
            if (data.isEdit) {
                this.http
                    .patch(
                        `api/mod/discussions/${data.discussionId}`,
                        data.payload
                    )
                    .subscribe({
                        next: () =>
                            this.loadDiscussions(
                                this.showId(),
                                this.seasonId(),
                                this.episodeId()
                            ),
                        error: (err) =>
                            console.error('Errore aggiornamento:', err),
                    })
            } else {
                this.http.post(`api/mod/discussions`, data.payload).subscribe({
                    next: () =>
                        this.loadDiscussions(
                            this.showId(),
                            this.seasonId(),
                            this.episodeId()
                        ),
                    error: (err) => console.error('Errore creazione:', err),
                })
            }
        }
    }

    async deleteDiscussion(discussionId: string, event: Event) {
        event.stopPropagation()
        event.preventDefault()

        const alert = await this.alertCtrl.create({
            header: $localize`:@@deleteDiscussionHeader:Conferma Eliminazione`,
            message: $localize`:@@deleteDiscussionMessage:Sei sicuro di voler eliminare questa discussione? L'azione è irreversibile.`,
            buttons: [
                { text: $localize`:@@cancelBtn:Annulla`, role: 'cancel' },
                {
                    text: $localize`:@@deleteBtn:Elimina`,
                    role: 'destructive',
                    handler: () => {
                        this.http
                            .delete(`api/mod/discussions/${discussionId}`)
                            .subscribe({
                                next: () =>
                                    this.loadDiscussions(
                                        this.showId(),
                                        this.seasonId(),
                                        this.episodeId()
                                    ),
                                error: (err) =>
                                    console.error('Errore eliminazione:', err),
                            })
                    },
                },
            ],
        })
        await alert.present()
    }

    toggleDiscussion(discussionId: string) {
        this.expandedDiscussionId.update((id) =>
            id === discussionId ? null : discussionId
        )
    }

    private async showToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            color,
            position: 'bottom',
        })
        await toast.present()
    }

    async goBackToSeries() {
        // Uccidiamo il player PRIMA di cambiare pagina
        if (this.videoPlayerComponent) {
            await this.videoPlayerComponent.killPlayer();
        }
        // Navighiamo all'indietro usando NavController per l'animazione corretta
        this.navCtrl.navigateBack(['/shows', this.showId()]);
    }

    // 🚀 2. GESTIONE SWIPE iOS / TASTO FISICO ANDROID
    async ionViewWillLeave() {
        // Questo evento scatta un attimo prima che la pagina sparisca,
        // garantendo la morte del player in qualsiasi caso l'utente abbandoni l'episodio.
        if (this.videoPlayerComponent) {
            await this.videoPlayerComponent.killPlayer();
        }
    }

    ngOnDestroy() {}
}