import { Component, signal, inject, ViewChild } from '@angular/core'
import { Router, RouterLink, RouterLinkActive } from '@angular/router'
import {
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonPopover,
    IonList,
    IonItem,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import {
    homeOutline,
    searchOutline,
    heartOutline,
    personOutline,
    personCircleOutline,
    settingsOutline,
    shieldCheckmarkOutline,
    libraryOutline,
    eyeOutline,
    logOutOutline,
    logInOutline,
    personAddOutline,
} from 'ionicons/icons'
import { jwtDecodeHelper } from '@app/utils/jwt-helper'
import { AuthService } from '@app/services/auth' // Adatta il percorso se necessario
import { LanguageSwitcherComponent } from '@app/components/language-switcher/language-switcher.component'

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    standalone: true,
    imports: [
        RouterLink,
        RouterLinkActive,
        IonTabs,
        IonTabBar,
        IonTabButton,
        IonIcon,
        IonLabel,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonPopover,
        IonList,
        IonItem,
        LanguageSwitcherComponent,
    ],
})
export class TabsPage {
    private router = inject(Router)
    private authService = inject(AuthService)

    //  Catturiamo il popover usando il suo nome ID dell'HTML
    @ViewChild('profilePopover') popover?: IonPopover

    isAdmin = signal(false)
    isCat = signal(false)
    isMod = signal(false)
    isLoggedIn = signal(false)
    isPopoverOpen = false

    constructor() {
        addIcons({settingsOutline,shieldCheckmarkOutline,libraryOutline,eyeOutline,logOutOutline,logInOutline,personAddOutline,personCircleOutline,homeOutline,searchOutline,heartOutline,personOutline,});
    }

    ionViewWillEnter() {
        const token = localStorage.getItem('token')
        this.isLoggedIn.set(!!token)
        if (token) {
            const decoded = jwtDecodeHelper(token)
            this.isAdmin.set(decoded?.isAdmin === 1)
            this.isCat.set(decoded?.isCat === 1)
            this.isMod.set(decoded?.isMod === 1)
        }
    }

    
    async openProfileMenu(event: any) {
        this.isPopoverOpen = true
        
        await this.popover!.present(event)

       
        await this.popover!.onDidDismiss()

        
        this.isPopoverOpen = false
    }

    async logout() {
        this.popover?.dismiss()
        await this.authService.confirmLogout()
    }
}
