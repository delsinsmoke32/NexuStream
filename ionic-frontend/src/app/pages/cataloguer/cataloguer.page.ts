import { Component, OnInit, signal, inject } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { firstValueFrom } from 'rxjs'
import {
    IonicModule,
    ToastController,
    AlertController,
    InfiniteScrollCustomEvent,
    SearchbarCustomEvent,
} from '@ionic/angular'

import { addIcons } from 'ionicons'
import {
    logOutOutline,
    filmOutline,
    addOutline,
    createOutline,
    trashOutline,
    arrowBackOutline,
    layersOutline,
    tvOutline,
    imageOutline,
} from 'ionicons/icons'

@Component({
    selector: 'app-cataloguer',
    templateUrl: './cataloguer.page.html',
    styleUrls: ['./cataloguer.page.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule],
})
export class CataloguerPage implements OnInit {
    private http = inject(HttpClient)
    private router = inject(Router)
    private toastController = inject(ToastController)
    private alertController = inject(AlertController)

    currentLevel = signal<'shows' | 'seasons' | 'episodes'>('shows')

    shows = signal<any[]>([])
    seasons = signal<any[]>([])
    episodes = signal<any[]>([])

    selectedShowId = signal<number | null>(null)
    selectedSeasonId = signal<number | null>(null)

    currentPage = 1
    pageSize = 20
    currentSearchTerm = ''

    private baseUrl = 'api/cataloguer'

    constructor() {
        addIcons({
            logOutOutline,
            filmOutline,
            addOutline,
            createOutline,
            trashOutline,
            arrowBackOutline,
            layersOutline,
            tvOutline,
            imageOutline,
        })
    }

    ngOnInit() {
        this.loadShows()
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token')
        return new HttpHeaders({ Authorization: `Bearer ${token}` })
    }

    /** Helper per estrarre il testo multilingua dalle stringhe JSON del DB */
    getLangText(jsonString: string, lang: string = 'it'): string {
        try {
            const obj = JSON.parse(jsonString)
            return obj[lang] || obj['it'] || ''
        } catch (e) {
            return jsonString || ''
        }
    }

    /** Utility per iniettare chirurgicamente una modifica locale in una stringa JSON senza fare una nuova GET */
    private updateJsonString(
        originalJson: string,
        lang: string,
        newText: string
    ): string {
        try {
            const obj = JSON.parse(originalJson)
            obj[lang] = newText
            return JSON.stringify(obj)
        } catch (e) {
            const fallback: any = { it: originalJson }
            fallback[lang] = newText
            return JSON.stringify(fallback)
        }
    }

    // ==========================================
    // OPERAZIONI: SERIE (SHOWS)
    // ==========================================

    loadShows(isAppend: boolean = false, event?: InfiniteScrollCustomEvent) {
        let url = `${this.baseUrl}/shows?page=${this.currentPage}&limit=${this.pageSize}`
        if (this.currentSearchTerm) url += `&search=${this.currentSearchTerm}`

        this.http
            .get<any[]>(url, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (res) => {
                    if (isAppend) {
                        this.shows.update((old) => [...old, ...res])
                    } else {
                        this.shows.set(res)
                    }
                    this.handleInfiniteScrollComplete(res.length, event)
                },
                error: (err) => console.error(err),
            })
    }

    // ==========================================
    // AGGIUNTA SERIE (MULTILINGUA CORRETTA)
    // ==========================================
    async openAddShowModal() {
        const alert = await this.alertController.create({
            header: 'Aggiungi Nuova Serie',
            inputs: [
                {
                    name: 'title_it',
                    type: 'text',
                    placeholder: 'Titolo (IT) *',
                },
                {
                    name: 'description_it',
                    type: 'textarea',
                    placeholder: 'Descrizione (IT) *',
                },
                { name: 'title_en', type: 'text', placeholder: 'Titolo (EN)' },
                {
                    name: 'description_en',
                    type: 'textarea',
                    placeholder: 'Descrizione (EN)',
                },
                { name: 'dateStarted', type: 'date', label: 'Data Inizio *' },
                { name: 'dateEnded', type: 'date', label: 'Data Fine' },
                {
                    name: 'thumbnailURI',
                    type: 'text',
                    placeholder: 'URI della thumbnail',
                },
                {
                    name: 'bannerURI',
                    type: 'text',
                    placeholder: 'URI del banner',
                },
            ],
            buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                    text: 'Salva',
                    handler: (data) => {
                        // L'italiano e la data di inizio sono i requisiti minimi strutturali del DB
                        if (
                            !data.title_it?.trim() ||
                            !data.description_it?.trim() ||
                            !data.dateStarted
                        ) {
                            this.presentToast(
                                "Il titolo IT, la descrizione IT e la data d'inizio sono obbligatori.",
                                'danger'
                            )
                            return false // Blocca la chiusura se mancano i dati fondamentali
                        }

                        // Impacchettiamo il payload duplicando i campi base per l'express-validator
                        const payload = {
                            title: data.title_it, // Per superare body('title').notEmpty()
                            description: data.description_it, // Per superare body('description').notEmpty()
                            title_it: data.title_it,
                            description_it: data.description_it,
                            title_en: data.title_en || null,
                            description_en: data.description_en || null,
                            dateStarted: data.dateStarted,
                            dateEnded: data.dateEnded || null,
                            thumbnailURI: data.thumbnailURI || null,
                            bannerURI: data.bannerURI || null,
                        }

                        this.http
                            .post(`${this.baseUrl}/shows/add`, payload, {
                                headers: this.getAuthHeaders(),
                            })
                            .subscribe({
                                next: () => {
                                    this.presentToast(
                                        'Serie creata con successo!',
                                        'success'
                                    )
                                    this.currentPage = 1
                                    this.loadShows(false) // Ricarica la lista aggiornata
                                },
                                error: (err) => {
                                    console.error(err)
                                    this.presentToast(
                                        'Errore durante la creazione della serie.',
                                        'danger'
                                    )
                                },
                            })

                        return true // Risolve ts(7030) e chiude l'alert al click positivo
                    },
                },
            ],
        })
        await alert.present()
    }

    /** Modifica una serie esistente supportando l'isolamento della lingua del backend */
    async openEditShowModal(show: any) {
        const alert = await this.alertController.create({
            header: 'Modifica Serie',
            inputs: [
                {
                    name: 'title_it',
                    type: 'text',
                    value: this.getLangText(show.Title, 'it'),
                    placeholder: 'Titolo (IT)',
                },
                {
                    name: 'description_it',
                    type: 'textarea',
                    value: this.getLangText(show.Description, 'it'),
                    placeholder: 'Trama (IT)',
                },
                {
                    name: 'title_en',
                    type: 'text',
                    value: this.getLangText(show.Title, 'en'),
                    placeholder: 'Titolo (EN)',
                },
                {
                    name: 'description_en',
                    type: 'textarea',
                    value: this.getLangText(show.Description, 'en'),
                    placeholder: 'Trama (EN)',
                },
                {
                    name: 'dateEnded',
                    type: 'date',
                    value: show.DateEnded,
                    label: 'Data Fine',
                },
                {
                    name: 'thumbnailURI',
                    type: 'text',
                    placeholder: 'URI della thumbnail',
                },
                {
                    name: 'bannerURI',
                    type: 'text',
                    placeholder: 'URI del banner',
                },
            ],
            buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                    text: 'Aggiorna',
                    handler: async (data) => {
                        const hasIt =
                            data.title_it?.trim() || data.description_it?.trim()
                        const hasEn =
                            data.title_en?.trim() || data.description_en?.trim()

                        if (!hasIt && !hasEn) {
                            this.presentToast(
                                'Modifica almeno un campo in una lingua a scelta.',
                                'danger'
                            )
                            return false
                        }

                        try {
                            // 1. PATCH Italiano: parte solo se l'utente ha compilato/modificato i campi IT
                            if (
                                data.title_it?.trim() ||
                                data.description_it?.trim()
                            ) {
                                const payloadIt: any = { lang: 'it' }
                                if (data.title_it?.trim())
                                    payloadIt.title = data.title_it
                                if (data.description_it?.trim())
                                    payloadIt.description = data.description_it
                                if (data.dateEnded !== undefined)
                                    payloadIt.dateEnded = data.dateEnded
                                if (data.thumbnailURI !== undefined)
                                    payloadIt.thumbnailURI = data.thumbnailURI
                                if (data.bannerURI !== undefined)
                                    payloadIt.bannerURI = data.bannerURI

                                await firstValueFrom(
                                    this.http.patch(
                                        `${this.baseUrl}/shows/${show.ShowID}`,
                                        payloadIt,
                                        { headers: this.getAuthHeaders() }
                                    )
                                )
                            }

                            // 2. PATCH Inglese: parte solo se l'utente ha compilato/modificato i campi EN
                            if (
                                data.title_en?.trim() ||
                                data.description_en?.trim()
                            ) {
                                const payloadEn: any = { lang: 'en' }
                                if (data.title_en?.trim())
                                    payloadEn.title = data.title_en
                                if (data.description_en?.trim())
                                    payloadEn.description = data.description_en
                                if (data.dateEnded !== undefined)
                                    payloadEn.dateEnded = data.dateEnded
                                if (data.thumbnailURI !== undefined)
                                    payloadEn.thumbnailURI = data.thumbnailURI
                                if (data.bannerURI !== undefined)
                                    payloadEn.bannerURI = data.bannerURI

                                await firstValueFrom(
                                    this.http.patch(
                                        `${this.baseUrl}/shows/${show.ShowID}`,
                                        payloadEn,
                                        { headers: this.getAuthHeaders() }
                                    )
                                )
                            }

                            this.presentToast(
                                'Serie aggiornata con successo!',
                                'success'
                            )
                            this.loadShows(false)
                        } catch (err) {
                            console.error(err)
                            this.presentToast(
                                "Errore durante l'aggiornamento della serie.",
                                'danger'
                            )
                        }
                        return true
                    },
                },
            ],
        })
        await alert.present()
    }

    deleteShow(showId: number) {
        this.http
            .delete(`${this.baseUrl}/shows/${showId}`, {
                headers: this.getAuthHeaders(),
            })
            .subscribe({
                next: () => {
                    this.presentToast('Serie eliminata.', 'success')
                    this.shows.update((old) =>
                        old.filter((s) => s.ShowID !== showId)
                    )
                },
            })
    }

    // ==========================================
    // OPERAZIONI: STAGIONI (SEASONS)
    // ==========================================

    navigateToSeasons(showId: number) {
        this.selectedShowId.set(showId)
        this.currentLevel.set('seasons')
        this.loadSeasons()
    }

    loadSeasons() {
        const url = `${this.baseUrl}/seasons?refShow=${this.selectedShowId()}`
        this.http
            .get<any[]>(url, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (res) => this.seasons.set(res),
                error: (err) => console.error(err),
            })
    }

    // ==========================================
    // AGGIUNTA STAGIONE (MULTILINGUA CORRETTA)
    // ==========================================
    async openAddSeasonModal() {
        const alert = await this.alertController.create({
            header: 'Aggiungi Stagione',
            inputs: [
                {
                    name: 'title_it',
                    type: 'text',
                    placeholder: 'Titolo Stagione (IT) *',
                },
                {
                    name: 'description_it',
                    type: 'textarea',
                    placeholder: 'Descrizione (IT) *',
                },
                {
                    name: 'title_en',
                    type: 'text',
                    placeholder: 'Titolo Stagione (EN)',
                },
                {
                    name: 'description_en',
                    type: 'textarea',
                    placeholder: 'Descrizione (EN)',
                },
                { name: 'dateStarted', type: 'date', label: 'Data Inizio *' },
                { name: 'dateEnded', type: 'date', label: 'Data Fine' },
                {
                    name: 'seasonNumber',
                    type: 'number',
                    placeholder: 'Numero di stagione *',
                },
            ],
            buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                    text: 'Salva',
                    handler: (data) => {
                        if (
                            !data.title_it?.trim() ||
                            !data.description_it?.trim() ||
                            !data.dateStarted ||
                            !data.seasonNumber
                        ) {
                            this.presentToast(
                                "Titolo IT, descrizione IT e data d'inizio sono obbligatori.",
                                'danger'
                            )
                            return false
                        }

                        const payload = {
                            title: data.title_it,
                            description: data.description_it,
                            title_it: data.title_it,
                            description_it: data.description_it,
                            title_en: data.title_en || null,
                            description_en: data.description_en || null,
                            dateStarted: data.dateStarted,
                            dateEnded: data.dateEnded || null,
                            seasonNumber: data.seasonNumber,
                            refShow: this.selectedShowId(), // Aggancia l'ID della serie attiva nel livello corrente
                        }

                        this.http
                            .post(`${this.baseUrl}/seasons/add`, payload, {
                                headers: this.getAuthHeaders(),
                            })
                            .subscribe({
                                next: () => {
                                    this.presentToast(
                                        'Stagione aggiunta con successo!',
                                        'success'
                                    )
                                    this.loadSeasons() // Rinfresca il livello stagioni
                                },
                                error: (err) => {
                                    console.error(err)
                                    this.presentToast(
                                        'Errore durante la creazione della stagione.',
                                        'danger'
                                    )
                                },
                            })

                        return true // Risolve ts(7030)
                    },
                },
            ],
        })
        await alert.present()
    }

    /** Modifica una stagione esistente e aggiorna il Signal in locale */
    async openEditSeasonModal(season: any) {
        const alert = await this.alertController.create({
            header: 'Modifica Stagione',
            inputs: [
                {
                    name: 'title_it',
                    type: 'text',
                    value: this.getLangText(season.Title, 'it'),
                    placeholder: 'Titolo (IT)',
                },
                {
                    name: 'description_it',
                    type: 'textarea',
                    value: this.getLangText(season.Description, 'it'),
                    placeholder: 'Descrizione (IT)',
                },
                {
                    name: 'title_en',
                    type: 'text',
                    value: this.getLangText(season.Title, 'en'),
                    placeholder: 'Titolo (EN)',
                },
                {
                    name: 'description_en',
                    type: 'textarea',
                    value: this.getLangText(season.Description, 'en'),
                    placeholder: 'Descrizione (EN)',
                },
                {
                    name: 'dateEnded',
                    type: 'date',
                    value: season.DateEnded,
                    label: 'Data Fine',
                },
            ],
            buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                    text: 'Aggiorna',
                    handler: async (data) => {
                        const hasIt =
                            data.title_it?.trim() || data.description_it?.trim()
                        const hasEn =
                            data.title_en?.trim() || data.description_en?.trim()

                        if (!hasIt && !hasEn) {
                            this.presentToast(
                                'Modifica almeno un campo in una lingua a scelta.',
                                'danger'
                            )
                            return false
                        }

                        try {
                            // 1. PATCH Italiano
                            if (
                                data.title_it?.trim() ||
                                data.description_it?.trim()
                            ) {
                                const payloadIt: any = { lang: 'it' }
                                if (data.title_it?.trim())
                                    payloadIt.title = data.title_it
                                if (data.description_it?.trim())
                                    payloadIt.description = data.description_it
                                if (data.dateEnded !== undefined)
                                    payloadIt.dateEnded = data.dateEnded

                                await firstValueFrom(
                                    this.http.patch(
                                        `${this.baseUrl}/seasons/${season.SeasonID}`,
                                        payloadIt,
                                        { headers: this.getAuthHeaders() }
                                    )
                                )
                            }

                            // 2. PATCH Inglese
                            if (
                                data.title_en?.trim() ||
                                data.description_en?.trim()
                            ) {
                                const payloadEn: any = { lang: 'en' }
                                if (data.title_en?.trim())
                                    payloadEn.title = data.title_en
                                if (data.description_en?.trim())
                                    payloadEn.description = data.description_en
                                if (data.dateEnded !== undefined)
                                    payloadEn.dateEnded = data.dateEnded

                                await firstValueFrom(
                                    this.http.patch(
                                        `${this.baseUrl}/seasons/${season.SeasonID}`,
                                        payloadEn,
                                        { headers: this.getAuthHeaders() }
                                    )
                                )
                            }

                            this.presentToast(
                                'Stagione aggiornata con successo!',
                                'success'
                            )
                            this.loadSeasons()
                        } catch (err) {
                            console.error(err)
                            this.presentToast(
                                "Errore durante l'aggiornamento della stagione.",
                                'danger'
                            )
                        }
                        return true
                    },
                },
            ],
        })
        await alert.present()
    }

    deleteSeason(seasonId: number) {
        this.http
            .delete(`${this.baseUrl}/seasons/${seasonId}`, {
                headers: this.getAuthHeaders(),
            })
            .subscribe({
                next: () => {
                    this.presentToast('Stagione rimossa.', 'success')
                    this.seasons.update((old) =>
                        old.filter((s) => s.SeasonID !== seasonId)
                    )
                },
            })
    }

    // ==========================================
    // OPERAZIONI: EPISODI (EPISODES)
    // ==========================================

    navigateToEpisodes(seasonId: number) {
        this.selectedSeasonId.set(seasonId)
        this.currentLevel.set('episodes')
        this.loadEpisodes()
    }

    loadEpisodes() {
        const url = `${this.baseUrl}/episodes?refSeason=${this.selectedSeasonId()}`
        this.http
            .get<any[]>(url, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (res) => this.episodes.set(res),
                error: (err) => console.error(err),
            })
    }

    // ==========================================
    // AGGIUNTA EPISODIO (MULTILINGUA CORRETTA)
    // ==========================================
    async openAddEpisodeModal() {
        const alert = await this.alertController.create({
            header: 'Aggiungi Episodio',
            inputs: [
                {
                    name: 'title_it',
                    type: 'text',
                    placeholder: 'Titolo Episodio (IT) *',
                },
                {
                    name: 'description_it',
                    type: 'textarea',
                    placeholder: 'Trama Episodio (IT) *',
                },
                {
                    name: 'title_en',
                    type: 'text',
                    placeholder: 'Titolo Episodio (EN)',
                },
                {
                    name: 'description_en',
                    type: 'textarea',
                    placeholder: 'Trama Episodio (EN)',
                },
                {
                    name: 'releaseDate',
                    type: 'date',
                    placeholder: 'Data di uscita',
                },
                {
                    name: 'duration',
                    type: 'number',
                    placeholder: 'Durata (in minuti) *',
                },
                {
                    name: 'episodeNumber',
                    type: 'number',
                    placeholder: 'Numero di episodio *',
                },
                {
                    name: 'thumbnailURI',
                    type: 'text',
                    placeholder: 'URI della thumbnail',
                },
            ],
            buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                    text: 'Salva',
                    handler: (data) => {
                        if (
                            !data.title_it?.trim() ||
                            !data.description_it?.trim() ||
                            !data.releaseDate ||
                            !data.duration ||
                            !data.episodeNumber
                        ) {
                            this.presentToast(
                                'Tutti i campi contrassegnati sono obbligatori.',
                                'danger'
                            )
                            return false
                        }

                        const payload = {
                            title: data.title_it,
                            description: data.description_it,
                            title_it: data.title_it,
                            description_it: data.description_it,
                            title_en: data.title_en || null,
                            description_en: data.description_en || null,
                            releaseDate: data.releaseDate,
                            duration: parseInt(data.duration, 10), // Forza il casting a intero richiesto da body('duration').isInt()
                            refSeason: this.selectedSeasonId(),
                            episodeNumber: data.episodeNumber,
                            DubLanguages: ['it'], // Inizializzazione pivot standard (modificabili poi via PATCH se necessario)
                            SubLanguages: ['it'],
                            thumbnailURI: data.thumbnailURI,
                        }

                        this.http
                            .post(`${this.baseUrl}/episodes/add`, payload, {
                                headers: this.getAuthHeaders(),
                            })
                            .subscribe({
                                next: () => {
                                    this.presentToast(
                                        'Episodio catalogato con successo!',
                                        'success'
                                    )
                                    this.loadEpisodes() // Rinfresca il livello episodi
                                },
                                error: (err) => {
                                    console.error(err)
                                    this.presentToast(
                                        "Errore durante il salvataggio dell'episodio.",
                                        'danger'
                                    )
                                },
                            })

                        return true // Risolve ts(7030)
                    },
                },
            ],
        })
        await alert.present()
    }

    /** Modifica un episodio esistente e sincronizza i testi JSON */
    // ==========================================
    // MODIFICA EPISODIO (MULTILINGUA INDIPENDENTE)
    // ==========================================
    async openEditEpisodeModal(episode: any) {
        const alert = await this.alertController.create({
            header: 'Modifica Episodio',
            inputs: [
                {
                    name: 'title_it',
                    type: 'text',
                    value: this.getLangText(episode.Title, 'it'),
                    placeholder: 'Titolo (IT)',
                },
                {
                    name: 'description_it',
                    type: 'textarea',
                    value: this.getLangText(episode.Description, 'it'),
                    placeholder: 'Trama (IT)',
                },
                {
                    name: 'title_en',
                    type: 'text',
                    value: this.getLangText(episode.Title, 'en'),
                    placeholder: 'Titolo (EN)',
                },
                {
                    name: 'description_en',
                    type: 'textarea',
                    value: this.getLangText(episode.Description, 'en'),
                    placeholder: 'Trama (EN)',
                },
            ],
            buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                    text: 'Aggiorna',
                    handler: async (data) => {
                        const hasIt =
                            data.title_it?.trim() || data.description_it?.trim()
                        const hasEn =
                            data.title_en?.trim() || data.description_en?.trim()

                        if (!hasIt && !hasEn) {
                            this.presentToast(
                                'Modifica almeno un campo in una lingua a scelta.',
                                'danger'
                            )
                            return false
                        }

                        try {
                            // 1. PATCH Italiano
                            if (
                                data.title_it?.trim() ||
                                data.description_it?.trim()
                            ) {
                                const payloadIt: any = { lang: 'it' }
                                if (data.title_it?.trim())
                                    payloadIt.title = data.title_it
                                if (data.description_it?.trim())
                                    payloadIt.description = data.description_it

                                await firstValueFrom(
                                    this.http.patch(
                                        `${this.baseUrl}/episodes/${episode.EpisodeID}`,
                                        payloadIt,
                                        { headers: this.getAuthHeaders() }
                                    )
                                )
                            }

                            // 2. PATCH Inglese
                            if (
                                data.title_en?.trim() ||
                                data.description_en?.trim()
                            ) {
                                const payloadEn: any = { lang: 'en' }
                                if (data.title_en?.trim())
                                    payloadEn.title = data.title_en
                                if (data.description_en?.trim())
                                    payloadEn.description = data.description_en

                                await firstValueFrom(
                                    this.http.patch(
                                        `${this.baseUrl}/episodes/${episode.EpisodeID}`,
                                        payloadEn,
                                        { headers: this.getAuthHeaders() }
                                    )
                                )
                            }

                            this.presentToast(
                                'Episodio modificato con successo!',
                                'success'
                            )
                            this.loadEpisodes()
                        } catch (err) {
                            console.error(err)
                            this.presentToast(
                                "Errore durante l'aggiornamento dell'episodio.",
                                'danger'
                            )
                        }
                        return true
                    },
                },
            ],
        })
        await alert.present()
    }

    deleteEpisode(episodeId: number) {
        this.http
            .delete(`${this.baseUrl}/episodes/${episodeId}`, {
                headers: this.getAuthHeaders(),
            })
            .subscribe({
                next: () => {
                    this.presentToast('Episodio rimosso.', 'success')
                    this.episodes.update((old) =>
                        old.filter((e) => e.EpisodeID !== episodeId)
                    )
                },
            })
    }

    // ==========================================
    // GESTIONE IMMAGINI PROFILO (PROPICS)
    // ==========================================

    /**
     * Apre un pannello di controllo rapido per aggiungere o rimuovere URI di Propic.
     * Gestisce entrambe le operazioni (POST e DELETE) dalla stessa modale.
     */
    async managePropics() {
        const alert = await this.alertController.create({
            header: 'Gestione Propic',
            message:
                "Inserisci l'URI dell'immagine per aggiungerla o rimuoverla dal database globale.",
            inputs: [
                {
                    name: 'propicURI',
                    type: 'text',
                    placeholder: 'es. static/avatars/avatar-000.png',
                },
            ],
            buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                    text: 'Rimuovi',
                    role: 'destructive',
                    handler: (data) => {
                        if (!data.propicURI) {
                            this.presentToast(
                                'Devi inserire un URI valido per rimuoverlo.',
                                'danger'
                            )
                            return false
                        }

                        // ⚠️ ATTENZIONE: In Angular, il body di una DELETE si passa nell'oggetto 'options'
                        this.http
                            .delete(`${this.baseUrl}/propic`, {
                                headers: this.getAuthHeaders(),
                                body: { propicURI: data.propicURI },
                            })
                            .subscribe({
                                next: () =>
                                    this.presentToast(
                                        'Propic rimossa con successo!',
                                        'success'
                                    ),
                                error: (err) => {
                                    console.error(err)
                                    this.presentToast(
                                        err.error?.error ||
                                            'Errore durante la rimozione.',
                                        'danger'
                                    )
                                },
                            })
                        return true
                    },
                },
                {
                    text: 'Aggiungi',
                    handler: (data) => {
                        if (!data.propicURI) {
                            this.presentToast(
                                'Devi inserire un URI valido per aggiungerlo.',
                                'danger'
                            )
                            return false
                        }

                        // Nella POST il body si passa come secondo parametro standard
                        this.http
                            .post(
                                `${this.baseUrl}/propic`,
                                { propicURI: data.propicURI },
                                {
                                    headers: this.getAuthHeaders(),
                                }
                            )
                            .subscribe({
                                next: () =>
                                    this.presentToast(
                                        'Propic aggiunta al database!',
                                        'success'
                                    ),
                                error: (err) => {
                                    console.error(err)
                                    this.presentToast(
                                        err.error?.error ||
                                            "Errore durante l'aggiunta.",
                                        'danger'
                                    )
                                },
                            })
                        return true
                    },
                },
            ],
        })
        await alert.present()
    }

    // ==========================================
    // NAVIGAZIONE GENERALIZZATA
    // ==========================================

    navigateBack() {
        if (this.currentLevel() === 'episodes') {
            this.currentLevel.set('seasons')
            this.loadSeasons()
        } else if (this.currentLevel() === 'seasons') {
            this.currentLevel.set('shows')
            this.currentPage = 1
            this.loadShows(false)
        }
    }

    onSearch(event: SearchbarCustomEvent) {
        this.currentSearchTerm = event.detail.value?.trim() || ''
        this.currentPage = 1
        if (this.currentLevel() === 'shows') this.loadShows(false)
    }

    loadMoreData(event: InfiniteScrollCustomEvent) {
        if (this.currentLevel() === 'shows') {
            this.currentPage++
            this.loadShows(true, event)
        } else {
            event.target.complete()
        }
    }

    private handleInfiniteScrollComplete(
        length: number,
        event?: InfiniteScrollCustomEvent
    ) {
        if (event && event.target) {
            event.target.complete()
            if (length < this.pageSize) event.target.disabled = true
        }
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastController.create({
            message,
            duration: 3000,
            position: 'bottom',
            color,
        })
        await toast.present()
    }

    logout() {
        localStorage.clear()
        this.router.navigate(['/login'])
    }
}
