import { CommonModule } from '@angular/common'
import { Component, ViewChild, inject, signal } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import {
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
    ToastController,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import {
    heartDislikeOutline,
    heartOutline,
    logOutOutline,
    personCircleOutline,
    settingsOutline,
} from 'ionicons/icons'


import { ShowCardComponent } from '../../components/show-card/show-card.component'
import { FavoriteShow } from '../../models/favorites'
import { FavoritesService } from '../../services/favorites'

@Component({
    selector: 'app-favourites',
    templateUrl: './favourites.page.html',
    styleUrls: ['./favourites.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ShowCardComponent,
        IonContent,
        IonHeader,
        IonTitle,
        IonToolbar,
        IonIcon,
        IonButton,
        IonSpinner,
    ],
})
export class FavouritesPage {
    @ViewChild('profilePopover') popover: any

    private favoritesService = inject(FavoritesService)
    private router = inject(Router)
    private toastCtrl = inject(ToastController)

    isLoading = signal<boolean>(true)
    favorites = signal<FavoriteShow[]>([])

    constructor() {
        addIcons({
            heartDislikeOutline,
            personCircleOutline,
            settingsOutline,
            heartOutline,
            logOutOutline,
        })
    }

    ionViewWillEnter() {
        this.loadFavorites()
    }

    
    loadFavorites() {
        this.isLoading.set(true)
        this.favoritesService.getFavorites().subscribe({
            next: (res) => {
                this.favorites.set(res || [])
                this.isLoading.set(false)
            },
            error: (err) => {
                console.error('Errore nel recupero preferiti:', err)
                this.isLoading.set(false)
                this.showToast('Impossibile caricare i preferiti.', 'danger')
            },
        })
    }

    
    removeFromFavorites(showId: number) {
        
        const oldFavs = this.favorites()

        
        this.favorites.update((favs) =>
            favs.filter((anime) => anime.ShowID !== showId)
        )

        
        this.favoritesService.removeFavorite(showId).subscribe({
            next: () => {
                this.showToast('Rimosso dai Preferiti', 'success')
            },
            error: (err) => {
                console.error('Errore rimozione preferito:', err)
                
                this.favorites.set(oldFavs)
                this.showToast('Errore di connessione. Riprova.', 'danger')
            },
        })
    }

    
    openSeriesInfo(showId: number) {
        this.router.navigate(['/shows', showId])
    }

    playAnime(show: FavoriteShow) {
        
        const id = show.ShowID || show.id
        if (id) {
            this.router.navigate(['/shows', id])
        }
    }

    
    async openProfileMenu(ev: any) {
        this.popover.event = ev
        await this.popover.present()
    }

    onPopoverDismiss() {}

    openUserSettings() {
        this.popover.dismiss()
    }

    openFavorites() {
        this.popover.dismiss()
    }

    logout() {
        this.popover.dismiss()
        
    }

    private async showToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 2000,
            color,
            position: 'bottom',
        })
        await toast.present()
    }
}
