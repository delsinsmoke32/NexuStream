import { Component, OnInit, signal, inject } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import {
    ToastController,
    AlertController,
    InfiniteScrollCustomEvent,
    SearchbarCustomEvent,
    IonBadge,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonIcon,
    IonSelectOption,
    IonSelect,
    IonLabel,
    IonAvatar,
    IonItem,
    IonList,
    IonSearchbar,
    IonContent,
    IonButton,
    IonButtons,
    IonTitle,
    IonToolbar,
    IonHeader,
} from '@ionic/angular/standalone'

import { addIcons } from 'ionicons'
import { logOutOutline, peopleOutline, createOutline } from 'ionicons/icons'
import { BackendUrlPipe } from '../../pipes/backend-url-pipe'

@Component({
    selector: 'app-admin',
    templateUrl: './admin.page.html',
    styleUrls: ['./admin.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BackendUrlPipe,
        IonBadge,
        IonInfiniteScrollContent,
        IonInfiniteScroll,
        IonIcon,
        IonSelectOption,
        IonSelect,
        IonLabel,
        IonAvatar,
        IonItem,
        IonList,
        IonSearchbar,
        IonContent,
        IonButton,
        IonButtons,
        IonTitle,
        IonToolbar,
        IonHeader,
    ],
})
export class AdminPage implements OnInit {
    // Iniezione delle dipendenze moderna (Angular 16+)
    private http = inject(HttpClient)
    private router = inject(Router)
    private toastController = inject(ToastController)
    private alertController = inject(AlertController)

    /** Stato reattivo globale che contiene l'elenco degli utenti correntemente renderizzati */
    users = signal<any[]>([])

    /** Indice della pagina corrente per la paginazione asincrona (Infinite Scroll) */
    currentPage = 1

    /** Numero massimo di record da richiedere al server per ogni singola chiamata */
    pageSize = 20

    /** Stringa di testo inserita dall'utente per filtrare i risultati della ricerca */
    currentSearchTerm = ''

    /** URL di base del backend per tutte le operazioni di amministrazione degli utenti */
    private baseUrl = 'api/admin/users'

    constructor() {
        // Registrazione obbligatoria delle icone standalone richieste nel template HTML
        addIcons({ logOutOutline, peopleOutline, createOutline })
    }

    /**
     * Ciclo di vita Angular: Scatta all'inizializzazione del componente.
     * Avvia il caricamento iniziale del primo blocco di utenti.
     */

    ngOnInit() {
        this.loadUsers()
    }

    /**
     * Genera e restituisce le intestazioni HTTP necessarie per le chiamate protette,
     * inserendo il JWT recuperato dalla memoria locale del browser.
     * * @returns {HttpHeaders} L'oggetto intestazione contenente l'header Authorization Bearer.
     */

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token')
        return new HttpHeaders({
            Authorization: `Bearer ${token}`,
        })
    }

    /**
     * Effettua la chiamata GET al backend per recuperare la lista degli utenti.
     * Gestisce sia la sovrascrittura totale dei dati (nuova ricerca) sia l'append asincrono (infinite scroll).
     * * @param {boolean} [isAppend=false] Se impostato su true, unisce i nuovi record a quelli già esistenti.
     * @param {InfiniteScrollCustomEvent} [event] L'evento dello scroll nativo Ionic, necessario per sbloccare l'animazione grafica.
     */

    loadUsers(isAppend: boolean = false, event?: InfiniteScrollCustomEvent) {
        let url = `${this.baseUrl}?page=${this.currentPage}&limit=${this.pageSize}`

        // Se è attiva una chiave di ricerca, concateniamo il parametro all'URL
        if (this.currentSearchTerm) {
            url += `&search=${this.currentSearchTerm}`
        }

        this.http
            .get<any[]>(url, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (res) => {
                    if (isAppend) {
                        // Modalità Infinite Scroll: uniamo i vecchi dati ai nuovi arrivati
                        this.users.update((oldUsers) => [...oldUsers, ...res])
                    } else {
                        // Modalità Boot / Nuova Ricerca: resettiamo completamente la lista
                        this.users.set(res)
                    }

                    // Se l'operazione è legata a uno scroll, lo dichiariamo completato
                    if (event && event.target) {
                        event.target.complete()

                        // Se il server restituisce meno dati del limite della pagina, il database è terminato
                        if (res.length < this.pageSize) {
                            event.target.disabled = true // Disabilita l'infinite scroll per evitare query inutili
                        }
                    }
                },
                error: (err) => {
                    console.error(
                        'Errore HTTP durante il fetch degli utenti:',
                        err
                    )
                    if (event && event.target) {
                        event.target.complete() // Impedisce il freeze grafico del caricamento in caso di errore
                    }
                },
            })
    }

    /**
     * Analizza lo stato dei singoli flag booleani restituiti dal database SQLite
     * e costruisce un array di stringhe compatibile con l'ion-select a scelta multipla.
     * * @param {any} user L'oggetto utente estratto dal ciclo in esecuzione nel DOM.
     * @returns {string[]} Un array contenente i ruoli attivi dell'utente (es. ['mod', 'cataloguer']).
     */

    getUserRolesArray(user: any): string[] {
        const roles: string[] = []
        if (user.isMod === 1) roles.push('mod')
        if (user.isCataloguer === 1) roles.push('cataloguer')
        if (user.isAdmin === 1) roles.push('admin')
        return roles
    }

    /**
     * Intercetta la modifica dei checkbox dall'interfaccia utente ed invia una richiesta PATCH al server.
     * Al successo, muta lo stato del Signal in locale per un aggiornamento immediato e reattivo.
     * * @param {number} userId L'ID univoco dell'utente di cui aggiornare i privilegi.
     * @param {any} event L'evento ionChange emesso dall'elemento ion-select.
     */

    changeRole(userId: number, event: any) {
        const selectedRoles: string[] = event.detail.value

        // Mappatura dall'array di stringhe ai flag a bit/booleani di SQLite
        const bodyPayload = {
            isMod: selectedRoles.includes('mod') ? 1 : 0,
            isCataloguer: selectedRoles.includes('cataloguer') ? 1 : 0,
        }

        this.http
            .patch(`${this.baseUrl}/${userId}/roles`, bodyPayload, {
                headers: this.getAuthHeaders(),
            })
            .subscribe({
                next: () => {
                    this.presentToast(
                        'Ruoli aggiornati correttamente!',
                        'success'
                    )

                    // Aggiornamento reattivo del Signal locale: modifica solo l'utente mirato mantenendo intatto lo scroll
                    this.users.update((currentUsers) =>
                        currentUsers.map((user) =>
                            user.UserID === userId
                                ? {
                                      ...user,
                                      isMod: bodyPayload.isMod,
                                      isCataloguer: bodyPayload.isCataloguer,
                                  }
                                : user
                        )
                    )
                },
                error: (err) => {
                    console.error(
                        "Errore durante l'aggiornamento del ruolo:",
                        err
                    )
                    this.presentToast(
                        "Errore durante l'aggiornamento dei privilegi.",
                        'danger'
                    )
                },
            })
    }

    /**
     * Scatta ad ogni digitazione (o cancellazione) dell'utente dentro l'ion-searchbar.
     * Aggiorna la query memorizzata e resetta la paginazione alla pagina 1.
     * * @param {SearchbarCustomEvent} event L'evento emesso nativamente dalla searchbar di Ionic.
     */

    onSearch(event: SearchbarCustomEvent) {
        this.currentSearchTerm = event.detail.value?.trim() || ''
        this.currentPage = 1 // Forza il reset alla prima pagina per la nuova chiave di ricerca

        // Riattiva l'infinite scroll sul DOM nel caso fosse stato bloccato da ricerche precedenti concluse
        const infiniteScroll = document.querySelector(
            'ion-infinite-scroll'
        ) as any
        if (infiniteScroll) infiniteScroll.disabled = false

        this.loadUsers(false) // Esegue un caricamento pulito a sovrascrittura totale
    }

    /**
     * Scatta automaticamente quando l'utente scorre l'applicazione arrivando in prossimità del footer.
     * Incrementa l'indice della pagina e richiede la tranche successiva di dati in modalità append.
     * * @param {InfiniteScrollCustomEvent} event L'evento reattivo di scroll emesso dal client Ionic.
     */

    loadMoreData(event: InfiniteScrollCustomEvent) {
        this.currentPage++ // Avanza di una pagina
        this.loadUsers(true, event) // Richiede i dati impostando l'append a true
    }

    /**
     * Utility centralizzata per la visualizzazione di messaggi Toast informativi e di allerta
     * ancorati nella parte inferiore dello schermo dell'utente.
     * * @param {string} message Il testo da mostrare all'interno del box di notifica.
     * @param {'success' | 'danger'} color Il set cromatico da applicare (success=Verde, danger=Rosso).
     */

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastController.create({
            message: message,
            duration: 3000,
            position: 'bottom',
            color: color,
        })
        await toast.present()
    }

    /**
     * Esegue la distruzione della sessione corrente ripulendo la memoria del localStorage (Token e preferenze).
     * Reindirizza immediatamente l'utente alla schermata di Login.
     */

    logout() {
        localStorage.clear()
        this.router.navigate(['/login'])
    }
}
