import { Component, ElementRef, OnInit, viewChild } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon,
    IonSkeletonText,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { CommentsComponent } from '@app/components/comments/comments.component'
import { Episode, EpisodeApi } from '@app/services/episode-api'
import { Observable } from '@lib/rxjs/dist/types'
import {
    playCircle,
    shareSocialOutline,
    addCircleOutline,
} from '@lib/ionicons/icons'
import videojs from 'video.js'
//import 'videojs-theme-kit' aggiunto alla angular.json in styles

@Component({
    selector: 'app-episode',
    templateUrl: './episode.page.html',
    styleUrls: ['./episode.page.scss'],
    standalone: true,
    imports: [
        IonContent,
        IonHeader,
        IonTitle,
        IonToolbar,
        IonCard,
        IonRow,
        IonCol,
        IonItem,
        IonCardHeader,
        IonCardContent,
        IonCardTitle,
        IonButton,
        CommonModule,
        FormsModule,
        IonLabel,
        IonInput,
        IonIcon,
        CommentsComponent,
        IonSkeletonText,
    ],
})
export class EpisodePage implements OnInit {
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
                        src: 'http://localhost:3000/api/shows/1/seasons/1/episodes/1/stream',
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
