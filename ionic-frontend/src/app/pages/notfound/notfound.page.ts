import { CommonModule } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { homeOutline, compassOutline } from '@lib/ionicons/icons'

@Component({
    selector: 'app-notfound',
    templateUrl: './notfound.page.html',
    styleUrls: ['./notfound.page.scss'],
    standalone: true,
    imports: [IonContent, IonButton, IonIcon, CommonModule, FormsModule],
})
export class NotfoundPage implements OnInit {
    private router = inject(Router)

    constructor() {
        addIcons({ compassOutline, homeOutline })
    }

    ngOnInit() {}

    goToHome() {
        console.log('Ritorno alla home avviato...')
        this.router.navigate(['/tabs/home'])
    }
}
