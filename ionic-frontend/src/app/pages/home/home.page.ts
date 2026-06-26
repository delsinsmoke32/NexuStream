import { CommonModule } from '@angular/common'
import {
    Component,
    ElementRef,
    inject,
    OnDestroy,
    signal,
    ViewChild,
} from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { AlertController, ToastController } from '@ionic/angular'
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import {
    chevronBackOutline,
    chevronForwardOutline,
    eyeOutline,
    heartOutline,
    informationCircleOutline,
    libraryOutline,
    logInOutline,
    logOutOutline,
    personAddOutline,
    personCircleOutline,
    play,
    playCircle,
    searchOutline,
    settingsOutline,
    shieldCheckmarkOutline,
} from 'ionicons/icons'

import { ShowCardComponent } from '@app/components/show-card/show-card.component'
import { AuthService } from '@app/services/auth'
import { HomeService } from '@app/services/home'
import {
    ContinueWatchingItem,
    HomeShow,
} from '../../models/home'
import { BackendUrlPipe } from '../../pipes/backend-url-pipe'

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        BackendUrlPipe,
        IonContent,
        IonIcon,
        IonSpinner,
        ShowCardComponent,
    ],
})
export class HomePage implements OnDestroy {
    @ViewChild('continueWatchingScroll') continueWatchingScroll!: ElementRef
    @ViewChild('mostViewedScroll') mostViewedScroll!: ElementRef
    @ViewChild('mostLikedScroll') mostLikedScroll!: ElementRef
    @ViewChild('recentDiscScroll') recentDiscScroll!: ElementRef;

    private homeService = inject(HomeService)
    private authService = inject(AuthService)
    private router = inject(Router)
    private alertCtrl = inject(AlertController)
    private toastCtrl = inject(ToastController)

    isLoading = signal<boolean>(true)

    
    mostViewed = signal<HomeShow[]>([])
    mostLiked = signal<HomeShow[]>([])
    recentDisc = signal<HomeShow[]>([])
    continueWatching = signal<ContinueWatchingItem[]>([])

    
    heroList = signal<HomeShow[]>([])
    activeHeroIndex = signal<number>(0)
    private heroInterval: any

    constructor() {
        addIcons({play,informationCircleOutline,chevronBackOutline,chevronForwardOutline,logInOutline,personAddOutline,searchOutline,personCircleOutline,settingsOutline,heartOutline,shieldCheckmarkOutline,libraryOutline,eyeOutline,logOutOutline,playCircle,});
    }

    ionViewWillEnter() {
        this.loadHomeData()
    }

    ngOnDestroy() {
        this.stopHeroCarousel()
    }

    loadHomeData() {
        this.isLoading.set(true)

        this.homeService.getHomeData().subscribe({
            next: (res) => {
                const viewed = res.mostViewed || [];
                this.mostViewed.set(viewed);
                this.mostLiked.set(res.mostLiked || []);
                this.recentDisc.set(res.recentDisc || []);
                this.continueWatching.set(res.continueWatching || []);

                if (viewed.length > 0) {
                    this.heroList.set(viewed.slice(0, 5));
                    this.startHeroCarousel();
                }

                this.isLoading.set(false)
            },
            error: (err) => {
                console.error('Errore caricamento Home:', err)
                this.isLoading.set(false)
                this.showToast(
                    $localize`:@@impossibleLoading:Impossibile caricare i contenuti.`,
                    'danger'
                )
            },
        })
    }

    scrollRow(
        rowType: 'continueWatching' | 'mostViewed' | 'mostLiked' | 'recentDisc',
        direction: 'left' | 'right'
    ) {
        let containerRef: ElementRef | undefined;

        if (rowType === 'continueWatching') containerRef = this.continueWatchingScroll;
        else if (rowType === 'mostViewed') containerRef = this.mostViewedScroll;
        else if (rowType === 'mostLiked') containerRef = this.mostLikedScroll;
        else if (rowType === 'recentDisc') containerRef = this.recentDiscScroll;

        if (containerRef && containerRef.nativeElement) {
            const scrollAmount = window.innerWidth > 768 ? 600 : 300;
            containerRef.nativeElement.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    }

    startHeroCarousel() {
        this.stopHeroCarousel()
        this.heroInterval = setInterval(() => {
            const current = this.activeHeroIndex()
            const max = this.heroList().length - 1
            this.activeHeroIndex.set(current >= max ? 0 : current + 1)
        }, 7000)
    }

    stopHeroCarousel() {
        if (this.heroInterval) {
            clearInterval(this.heroInterval)
        }
    }

    playAnime(showId: number, event?: Event) {
        if (event) event.stopPropagation()
        this.router.navigate(['/shows', showId])
    }

    openSeriesInfo(showId: number, event?: Event) {
        if (event) event.stopPropagation()
        this.router.navigate(['/shows', showId])
    }

    resumeEpisode(item: ContinueWatchingItem) {
        if (!item || !item.EpisodeID) return
        this.router.navigate(['/episode', item.EpisodeID], {
            queryParams: {
                showId: item.ShowID,
                seasonId: item.SeasonID,
                startAt: item.Progress,
            },
        })
    }

    removeFromContinueWatching(showId: number) {
        const oldList = this.continueWatching()
        this.continueWatching.update((list) =>
            list.filter((cw) => cw.ShowID !== showId)
        )

        const targetItem = oldList.find((cw) => cw.ShowID === showId)
        if (!targetItem) return

        this.homeService
            .removeShowFromContinueWatching(
                showId,
            )
            .subscribe({
                next: () =>
                    this.showToast(
                        'Rimosso dal "Continua a guardare"',
                        'success'
                    ),
                error: (err) => {
                    console.error('Errore:', err)
                    this.continueWatching.set(oldList)
                    this.showToast('Errore di connessione', 'danger')
                },
            })
    }

    private async showToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 2500,
            color,
            position: 'bottom',
        })
        await toast.present()
    }
}
