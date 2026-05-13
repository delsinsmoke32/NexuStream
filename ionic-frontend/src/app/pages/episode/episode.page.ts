import { Component, OnInit } from '@angular/core'
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
import { playCircle } from '@lib/ionicons/icons'

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
    id = 10
    episode$: Observable<Episode>
    constructor(api: EpisodeApi) {
        this.episode$ = api.getEpisode(this.id)
        addIcons({ playCircle })
    }
    ngOnInit() {}
}
