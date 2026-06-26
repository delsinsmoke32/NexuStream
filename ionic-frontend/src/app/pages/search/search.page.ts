import { CommonModule } from '@angular/common'
import { Component, ViewChild, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { AlertController, ToastController } from '@ionic/angular'
import {
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonLabel,
    IonSearchbar,
    IonSpinner,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import {
    alertCircleOutline,
    heartOutline,
    informationCircleOutline,
    logOutOutline,
    personCircleOutline,
    playCircle,
    searchOutline,
    settingsOutline,
} from 'ionicons/icons'

// Componenti esterni, Service e Modelli
import { ShowCardComponent } from '@app/components/show-card/show-card.component'
import { Genre, SearchResult } from '../../models/search'
import { SearchService } from '../../services/search'

@Component({
    selector: 'app-search',
    templateUrl: './search.page.html',
    styleUrls: ['./search.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        IonIcon,
        IonSearchbar,
        IonContent,
        IonHeader,
        IonTitle,
        IonToolbar,
        IonChip,
        IonLabel,
        IonSpinner,
        ShowCardComponent,
    ],
})
export class SearchPage {
    @ViewChild('profilePopover') popover: any

    private searchService = inject(SearchService)
    private router = inject(Router)
    private alertCtrl = inject(AlertController)
    private toastCtrl = inject(ToastController)

    // Stati reattivi
    searchQuery = signal<string>('')
    selectedGenre = signal<number | null>(null)
    filteredResults = signal<SearchResult[]>([])
    isLoading = signal<boolean>(false)
    isLoggedIn = signal<boolean>(false)

    // Lista dei generi dal database
    genres = signal<Genre[]>([])

    constructor() {
        addIcons({
            alertCircleOutline,
            searchOutline,
            personCircleOutline,
            settingsOutline,
            heartOutline,
            logOutOutline,
            playCircle,
            informationCircleOutline,
        })
    }

    ionViewWillEnter() {
        const token = localStorage.getItem('token')
        this.isLoggedIn.set(!!token)
        this.loadGenres()
    }

    // 1. Carica i generi disponibili dal backend tramite il Service
    loadGenres() {
        this.searchService.getGenres().subscribe({
            next: (res) => this.genres.set(res),
            error: (err) =>
                console.error('Errore nel caricamento dei generi:', err),
        })
    }

    // 2. L'utente digita nella barra di ricerca
    onSearchChange(event: any) {
        this.searchQuery.set(event.detail.value || '')
        this.triggerSearch()
    }

    // 3. L'utente clicca su un genere ("Chip")
    selectGenre(genreId: number | null) {
        if (this.selectedGenre() === genreId) {
            this.selectedGenre.set(null)
        } else {
            this.selectedGenre.set(genreId)
        }
        this.triggerSearch()
    }

    // 4. Esegue la ricerca vera e propria combinando Testo + Genere tramite il Service
    triggerSearch() {
        const q = this.searchQuery().trim()
        const g = this.selectedGenre()

        if (!q && !g) {
            this.filteredResults.set([])
            return
        }

        this.isLoading.set(true)

        this.searchService.searchShows(q, g).subscribe({
            next: (risultati) => {
                this.filteredResults.set(risultati)
                this.isLoading.set(false)
            },
            error: (err) => {
                console.error('Errore durante la ricerca:', err)
                this.isLoading.set(false)
            },
        })
    }

    // Navigazione
    openSeriesInfo(showId: string | number, event?: Event) {
        if (event) event.stopPropagation()
        this.router.navigate(['/shows', showId])
    }

    // Menu Profilo
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

    async logout() {
        const alert = await this.alertCtrl.create({
            header: 'Disconnetti',
            message: 'Sei sicuro di voler uscire da NexuStream?',
            buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                    text: 'Esci',
                    role: 'destructive',
                    handler: async () => {
                        const toast = await this.toastCtrl.create({
                            message: 'Sessione chiusa',
                            duration: 2000,
                            color: 'dark',
                        })
                        await toast.present()
                        this.router.navigate(['/login'])
                    },
                },
            ],
        })
        await alert.present()
        this.popover.dismiss()
    }
}
