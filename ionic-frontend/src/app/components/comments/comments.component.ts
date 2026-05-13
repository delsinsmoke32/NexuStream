import { Component, OnInit } from '@angular/core'
import {
    IonButton,
    IonIcon,
    IonAvatar,
    IonTextarea,
    IonItem,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { chatbubblesOutline, thumbsUpOutline } from 'ionicons/icons'
import { CommonModule } from '@angular/common'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'

@Component({
    selector: 'app-comments',
    templateUrl: './comments.component.html',
    styleUrls: ['./comments.component.scss'],
    imports: [
        IonButton,
        IonIcon,
        IonAvatar,
        IonTextarea,
        IonItem,
        CommonModule,
        BackendUrlPipe,
    ],
})
export class CommentsComponent implements OnInit {
    public comments = [
        {
            username: 'jojolover69',
            time: '2 hours ago',
            text: 'idk man jojo is lowk better than ts',
            avatar: 'static/avatars/avatar-001.png',
        },
        {
            username: 'jjklover420',
            time: '1 hour ago',
            text: 'man jojolover shut up, gojo no diffs ur verse',
            avatar: 'static/avatars/avatar-002.png',
        },
    ]

    constructor() {
        addIcons({ chatbubblesOutline, thumbsUpOutline })
    }

    ngOnInit() {}
}
