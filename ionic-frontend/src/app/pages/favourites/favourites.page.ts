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

//  Importiamo la card, il service e il model
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

    // 1. Recupero dei preferiti tramite il Service
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

    // 2. Rimozione dai preferiti tramite il Service
    removeFromFavorites(showId: number) {
        // Salviamo la lista vecchia in caso di errore di rete
        const oldFavs = this.favorites()

        // Aggiornamento ottimistico: filtriamo via la card istantaneamente!
        this.favorites.update((favs) =>
            favs.filter((anime) => anime.ShowID !== showId)
        )

        // Invio la chiamata al Service
        this.favoritesService.removeFavorite(showId).subscribe({
            next: () => {
                this.showToast('Rimosso dai Preferiti', 'success')
            },
            error: (err) => {
                console.error('Errore rimozione preferito:', err)
                // ROLLBACK: Se la chiamata fallisce, rimettiamo la card al suo posto
                this.favorites.set(oldFavs)
                this.showToast('Errore di connessione. Riprova.', 'danger')
            },
        })
    }

    // --- AZIONI NAVIGAZIONE CARD ---
    openSeriesInfo(showId: number) {
        this.router.navigate(['/shows', showId])
    }

    playAnime(show: FavoriteShow) {
        // Ricordati che l'evento (play) emette tutto l'oggetto, quindi estraiamo l'ID
        const id = show.ShowID || show.id
        if (id) {
            this.router.navigate(['/shows', id])
        }
    }

    // --- MENU PROFILO ---
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
        // Aggiungi qui la logica di pulizia localStorage se serve
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
