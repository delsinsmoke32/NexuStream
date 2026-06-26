import { Component, OnInit, inject } from '@angular/core'
import { Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonContent, IonIcon, IonButton } from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { homeOutline, shieldOutline } from '@lib/ionicons/icons'

@Component({
    selector: 'app-forbidden',
    templateUrl: './forbidden.page.html',
    styleUrls: ['./forbidden.page.scss'],
    standalone: true,
    imports: [IonContent, IonIcon, IonButton, CommonModule, FormsModule],
})
export class ForbiddenPage implements OnInit {
    private router = inject(Router)

    constructor() {
        addIcons({shieldOutline,homeOutline});
    }

    ngOnInit() {}

    goToHome() {
        this.router.navigate(['/tabs/home'])
    }
}
