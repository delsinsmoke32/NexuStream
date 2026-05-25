import { CommonModule } from '@angular/common'
import { Component, ViewChild } from '@angular/core'
import { RouterModule } from '@angular/router'
import { MenuController } from '@ionic/angular'
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonList,
    IonMenuButton,
    IonPopover,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone'
import {
    heartOutline,
    logOutOutline,
    personCircleOutline,
    searchOutline,
    settingsOutline,
} from '@lib/ionicons/icons'
import { addIcons } from 'ionicons'

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
    imports: [
        IonButtons,
        IonContent,
        IonHeader,
        IonTitle,
        IonToolbar,
        IonItem,
        IonButton,
        CommonModule,
        IonIcon,
        IonPopover,
        IonList,
        IonMenuButton,
        RouterModule,
    ],
})
export class HomePage {
    // Usiamo ViewChild per accedere al popover definito nel template con #profilePopover
    @ViewChild('profilePopover') popover: any

    // Dati fittizi per popolare la tua home page come in watermarked_img_15529459739609634203.png
    popularAnimes = [
        { title: 'Attack on Titan', posterUrl: 'assets/imgs/aot.jpg' },
        { title: 'Jujutsu Kaisen', posterUrl: 'assets/imgs/jjk.jpg' },
        { title: 'Demon Slayer', posterUrl: 'assets/imgs/ds.jpg' },
        { title: 'Chainsaw Man', posterUrl: 'assets/imgs/csm.jpg' },
    ]

    recentlyAddedAnimes = [
        { title: 'Kaiju No. 8', posterUrl: 'assets/imgs/kaiju.jpg' },
        { title: 'Frieren', posterUrl: 'assets/imgs/frieren.jpg' },
        { title: 'Solo Leveling', posterUrl: 'assets/imgs/solo.jpg' },
    ]

    continueWatchingAnimes = [
        {
            title: 'One Piece',
            currentEpisode: 1092,
            posterUrl: 'assets/imgs/op.jpg',
        },
        {
            title: 'Spy x Family',
            currentEpisode: 25,
            posterUrl: 'assets/imgs/spy.jpg',
        },
    ]

    genres = [
        { id: 1, name: 'Azione' },
        { id: 2, name: 'Avventura' },
        { id: 3, name: 'Shonen' },
        { id: 4, name: 'Seinen' },
        { id: 5, name: 'Horror' },
    ]

    constructor(private menuController: MenuController) {
        addIcons({
            searchOutline,
            personCircleOutline,
            settingsOutline,
            heartOutline,
            logOutOutline,
        })
    }

    // Funzione per aprire il menu a tendina del profilo
    async openProfileMenu(ev: any) {
        // Passiamo l'evento 'ev' così il popover sa di dover apparire vicino al tasto cliccato
        this.popover.event = ev
        await this.popover.present()
    }

    onMenuOpen() {
        console.log('Menu generi aperto')
    }

    onMenuClose() {
        console.log('Menu generi chiuso')
    }

    // Funzioni per gestire il menu dei generi
    closeMenu() {
        this.menuController.close()
    }

    // Funzione chiamata dal (didDismiss)
    onPopoverDismiss() {
        console.log('Il menu profilo è stato chiuso')
    }

    // Azioni del menu profilo
    openUserSettings() {
        console.log('Apro le impostazioni...')
        this.popover.dismiss()
    }

    openFavorites() {
        console.log('Apro i preferiti...')
        this.popover.dismiss()
    }

    logout() {
        console.log('Eseguo il logout...')
        this.popover.dismiss()
    }
}
