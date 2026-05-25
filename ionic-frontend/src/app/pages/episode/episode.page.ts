import { CommonModule } from '@angular/common'
import { Component, ElementRef, inject, OnInit, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CommentsComponent } from '@app/components/comments/comments.component'
import { Episode, EpisodeApi } from '@app/services/episode-api'
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonIcon,
} from '@ionic/angular/standalone'
import {
    addCircleOutline,
    playCircle,
    shareSocialOutline,
} from '@lib/ionicons/icons'
import { Observable } from '@lib/rxjs/dist/types'
import { addIcons } from 'ionicons'
import videojs from 'video.js'
//import 'videojs-theme-kit' aggiunto alla angular.json in styles
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'

@Component({
    selector: 'app-episode',
    templateUrl: './episode.page.html',
    styleUrls: ['./episode.page.scss'],
    standalone: true,
    imports: [
        IonContent,
        IonCard,
        IonCardContent,
        IonButton,
        CommonModule,
        FormsModule,
        IonIcon,
        CommentsComponent,
    ],
    providers: [BackendUrlPipe],
})
export class EpisodePage implements OnInit {
    backendUrl = inject(BackendUrlPipe)
    videoElement =
        viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer')
    player: any

    id = 1
    episode$: Observable<Episode>
    constructor(api: EpisodeApi) {
        this.episode$ = api.getEpisode(this.id)
        addIcons({ shareSocialOutline, addCircleOutline, playCircle })
    }
    ngOnInit() {
        this.initPlayer()
    }

    initPlayer() {
        // Configura il player
        this.player = videojs(
            this.videoElement().nativeElement,
            {
                autoplay: false,
                controls: true,
                responsive: true,
                fluid: true,
                sources: [
                    {
                        src: this.backendUrl.transform(
                            'api/shows/1/seasons/1/episodes/1/stream'
                        ),
                        type: 'application/x-mpegURL',
                    },
                ],
            },
            () => {
                console.log('Player Pronto!')
            }
        )

        // this.player.on('ready', () => {
        //     this.player.theme({ skin: 'sleek' })
        // })
    }

    // Fondamentale: pulire il player quando si cambia pagina
    ngOnDestroy() {
        if (this.player) {
            this.player.dispose()
        }
    }
}
