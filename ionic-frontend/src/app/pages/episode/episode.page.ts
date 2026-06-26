import { CommonModule } from '@angular/common'
import {
    Component,
    inject,
    OnDestroy,
    OnInit,
    signal,
    ViewChild,
} from '@angular/core'
import {
    ActivatedRoute,
    Router,
    RouterLink,
    RouterModule,
} from '@angular/router'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'
import {
    AlertController,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonToolbar,
    ModalController,
    NavController,
    ToastController,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import {
    addCircleOutline,
    arrowBackOutline,
    chatbubblesOutline,
    chevronForwardOutline,
    createOutline,
    heart,
    heartOutline,
    playCircle,
    shareSocialOutline,
    trashOutline,
} from 'ionicons/icons'
import { combineLatest } from 'rxjs'

import { CommentsComponent } from '@app/components/comments/comments.component'
import { DiscussionModalComponent } from '@app/components/discussion-modal/discussion-modal.component'
import { VideoPlayerComponent } from '@app/components/video-player/video-player.component'
import { jwtDecodeHelper } from '@app/utils/jwt-helper'

// 🚀 NUOVI SERVIZI IMPORTATI
import { StreamingEpisode } from '@app/models/streaming'
import { EpisodeService } from '@app/services/episode'
import { ModService } from '@app/services/mod'

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
        RouterLink,
        IonToolbar,
        IonHeader,
        IonButtons,
    ],
    providers: [BackendUrlPipe],
})
export class EpisodePage implements OnInit, OnDestroy {
    //  INIEZIONE DEI SERVIZI
    private route = inject(ActivatedRoute)
    private router = inject(Router)
    public backendUrl = inject(BackendUrlPipe)
    private modalCtrl = inject(ModalController)
    private alertCtrl = inject(AlertController)
    private toastCtrl = inject(ToastController)
    private navCtrl = inject(NavController)
    private episodeService = inject(EpisodeService)
    private modService = inject(ModService)

    isCurrentEpisodeCompleted = signal<boolean>(false);
    isLoading = signal<boolean>(true)
    episode = signal<StreamingEpisode | null>(null)
    seasonEpisodes = signal<any[]>([])
    discussions = signal<any[]>([])
    isLoggedIn = signal<boolean>(false)

    showId = signal<string>('')
    seasonId = signal<string>('')
    episodeId = signal<string>('')

    startAtTime = signal<number>(0)
    isMod = signal<boolean>(false)
    expandedDiscussionId = signal<string | null>(null)

    private lastKnownProgress = 0
    private saveTimeout: any

    @ViewChild(IonContent) content!: IonContent
    @ViewChild(VideoPlayerComponent) videoPlayerComponent!: VideoPlayerComponent

    constructor() {
        addIcons({arrowBackOutline,chatbubblesOutline,createOutline,trashOutline,shareSocialOutline,addCircleOutline,playCircle,heartOutline,heart,chevronForwardOutline,});
    }

    ngOnInit() {
        const token = localStorage.getItem('token')
        this.isLoggedIn.set(!!token)
        if (token) {
            const decodedToken = jwtDecodeHelper(token)
            if (decodedToken && decodedToken.isMod === 1) this.isMod.set(true)
        }

        combineLatest([
            this.route.paramMap,
            this.route.queryParamMap,
        ]).subscribe(async ([params, queryParams]) => {
            const epId = params.get('id') || params.get('episodeId')

            if (epId) {
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
        this.isCurrentEpisodeCompleted.set(false);
        this.episodeService.getEpisode(showId, seasonId, episodeId).subscribe({
            next: (res) => {
                this.checkMockEpisode(res)
                this.episode.set(res)
                this.isLoading.set(false)
            },
            error: (err) => {
                console.error(err)
                this.isLoading.set(false)
            },
        })
    }

    checkMockEpisode(ep: StreamingEpisode) {
        console.log(ep.StreamURI)
        if (ep.StreamURI == 'test') {
            this.showToast(
                $localize`:@@episodePage_mockWarning:Per motivi di spazio, la stream di questo episodio è un mock e non corrisponde al reale episodio.`,
                'warning'
            )
        }
    }

    loadSeasonEpisodes(showId: string, seasonId: string) {
        this.episodeService.getSeasonEpisodes(showId, seasonId).subscribe({
            next: (res) => this.seasonEpisodes.set(res),
            error: (err) => console.error(err),
        })
    }

    loadDiscussions(showId: string, seasonId: string, episodeId: string) {
        this.episodeService
            .getDiscussions(showId, seasonId, episodeId)
            .subscribe({
                next: (res) => this.discussions.set(res || []),
                error: () => this.discussions.set([]),
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
        this.lastKnownProgress = currentTime;
        this.isCurrentEpisodeCompleted.set(true);
        this.saveProgress(currentTime, 1, true);
    }

    handlePlayerDestroySave(currentTime: number) {
        this.saveProgress(currentTime, 0, true)
    }

    handleCommentTimestamp(seconds: number) {
        if (this.videoPlayerComponent) {
            this.videoPlayerComponent.seekTo(seconds)
            if (this.content) this.content.scrollToTop(500)
        }
    }

    async handleNextEpisode() {
        const currentEpId = parseInt(this.episodeId(), 10)
        const eps = this.seasonEpisodes()
        const currentEp = eps.find((e) => e.EpisodeID === currentEpId)

        if (!currentEp) return
        if (this.videoPlayerComponent)
            await this.videoPlayerComponent.killPlayer()

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
        if (this.videoPlayerComponent)
            await this.videoPlayerComponent.killPlayer()

        this.episodeService.getShowSeasons(this.showId()).subscribe({
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
                    this.episodeService
                        .getSeasonEpisodes(
                            this.showId(),
                            nextSeason.SeasonID.toString()
                        )
                        .subscribe({
                            next: (nextSeasonEps) => {
                                const firstEp = nextSeasonEps.find(
                                    (e) => e.EpisodeNumber === 1
                                )
                                if (firstEp) {
                                    this.showToast(
                                        $localize`:@@episodePage_nextSeasonStart:Inizio Stagione ${nextSeason.SeasonNumber}...`,
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
                    this.showToast($localize`:@@episodePage_seriesFinished:Hai concluso la serie!`, 'success')
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
        if (!this.episode() || currentTime <= 5) return;

        
        const finalIsCompleted = this.isCurrentEpisodeCompleted() ? 1 : isCompleted;

        const body = {
            progress: currentTime,
            isCompleted: finalIsCompleted, 
            isDropped: 0,
            isLiked: this.episode()?.isLiked ?? this.episode()?.userInteraction?.isLiked ?? 0,
        };
        if (this.saveTimeout) clearTimeout(this.saveTimeout)

        if (immediate) {
            this.episodeService
                .interact(
                    this.showId(),
                    this.seasonId(),
                    this.episodeId(),
                    body
                )
                .subscribe({
                    error: (err) =>
                        console.error('Errore salvataggio in chiusura:', err),
                })
        } else {
            this.saveTimeout = setTimeout(() => {
                this.episodeService
                    .interact(
                        this.showId(),
                        this.seasonId(),
                        this.episodeId(),
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
        const currentEp = this.episode();
        if (!currentEp) return;

        const userToken = localStorage.getItem('token');
        if (!userToken) {
            this.showToast($localize`:@@episodePage_logInToLike:Devi accedere per mettere Mi Piace!`, 'danger');
            return;
        }

        const wasLiked = currentEp.userInteraction?.isLiked ? 1 : 0;
        const newStatus = wasLiked ? 0 : 1;
        
        
        const currentLikes = currentEp.Likes || 0;
        const newLikes = newStatus === 1 ? currentLikes + 1 : currentLikes - 1;

        // aggiornamento signal
        this.episode.set({
            ...currentEp,
            isLiked: newStatus,
            Likes: newLikes,
            userInteraction: currentEp.userInteraction
                ? { ...currentEp.userInteraction, isLiked: newStatus }
                : { isLiked: newStatus, isCompleted: currentEp.isCompleted ?? 0 },
        });

        const body = {
            progress: this.lastKnownProgress,
            isCompleted: currentEp.isCompleted ?? 0,
            isDropped: 0,
            isLiked: newStatus,
        };

        this.episodeService
            .interact(this.showId(), this.seasonId(), this.episodeId(), body)
            .subscribe({
                error: () => {
                    
                    this.episode.set({
                        ...currentEp,
                        isLiked: wasLiked,
                        Likes: currentLikes,
                        userInteraction: currentEp.userInteraction
                            ? { ...currentEp.userInteraction, isLiked: wasLiked }
                            : undefined,
                    });
                    this.showToast($localize`:@@episodePage_connErr:Errore di connessione.`, 'danger');
                },
            });
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
                this.modService
                    .updateDiscussion(data.discussionId, data.payload)
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
                this.modService.createDiscussion(data.payload).subscribe({
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
            header: $localize`:@@episodePage_deleteDiscussionHeader:Conferma Eliminazione`,
            message: $localize`:@@episodePage_deleteDiscussionMessage:Sei sicuro di voler eliminare questa discussione? L'azione è irreversibile.`,
            buttons: [
                { text: $localize`:@@episodePage_cancelBtn:Annulla`, role: 'cancel' },
                {
                    text: $localize`:@@episodePage_deleteBtn:Elimina`,
                    role: 'destructive',
                    handler: () => {
                        this.modService
                            .deleteDiscussion(parseInt(discussionId))
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

    private async showToast(
        message: string,
        color: 'success' | 'danger' | 'warning'
    ) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            color,
            position: 'bottom',
        })
        await toast.present()
    }

    async goBackToSeries() {
        if (this.videoPlayerComponent)
            await this.videoPlayerComponent.killPlayer()
        this.navCtrl.navigateBack(['/shows', this.showId()])
    }

    isDiscussionClosed(disc: any): boolean {
        const isForced = disc.ForceClosed === 1 || disc.ForceClosed === true
        if (isForced) return true

        if (disc.CloseDate) {
            const closeDate = new Date(disc.CloseDate);
            return new Date() > closeDate; 
        }

        return false
    }

    async ionViewWillLeave() {
        if (this.videoPlayerComponent)
            await this.videoPlayerComponent.killPlayer()
    }

    getStreamWithParams() {
        const audioLang = localStorage.getItem('audioLang')
        const textLang = localStorage.getItem('textLang')
        return this.backendUrl.transform(
            'api/shows/' +
                this.showId() +
                '/seasons/' +
                this.seasonId() +
                '/episodes/' +
                this.episodeId() +
                '/stream?dub=' +
                audioLang +
                '&sub=' +
                textLang
        )
    }
    ngOnDestroy() {}
}
