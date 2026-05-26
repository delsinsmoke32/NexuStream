import { Component, OnInit, signal, inject } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { firstValueFrom } from 'rxjs'
import {
    ToastController,
    InfiniteScrollCustomEvent,
    SearchbarCustomEvent,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonSearchbar,
    IonContent,
    IonButtons,
    IonTitle,
    IonToolbar,
    IonHeader,
} from '@ionic/angular/standalone'

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
        IonInfiniteScrollContent,
        IonInfiniteScroll,
        IonSearchbar,
        IonContent,
        IonButtons,
        IonTitle,
        IonToolbar,
        IonHeader,
    ],
})
export class AdminPage implements OnInit {
    private http = inject(HttpClient)
    private router = inject(Router)
    private toastController = inject(ToastController)

    users = signal<any[]>([])
    currentPage = 1
    pageSize = 20
    currentSearchTerm = ''
    private baseUrl = 'api/admin/users'

    ngOnInit() {
        this.loadUsers()
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token')
        return new HttpHeaders({
            Authorization: `Bearer ${token}`,
        })
    }

    loadUsers(isAppend: boolean = false, event?: InfiniteScrollCustomEvent) {
        let url = `${this.baseUrl}?page=${this.currentPage}&limit=${this.pageSize}`

        if (this.currentSearchTerm) {
            url += `&search=${this.currentSearchTerm}`
        }

        this.http
            .get<any[]>(url, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (res) => {
                    if (isAppend) {
                        this.users.update((oldUsers) => [...oldUsers, ...res])
                    } else {
                        this.users.set(res)
                    }

                    if (event && event.target) {
                        event.target.complete()
                        if (res.length < this.pageSize) {
                            event.target.disabled = true
                        }
                    }
                },
                error: (err) => {
                    console.error('Errore HTTP durante il fetch degli utenti:', err)
                    if (event && event.target) {
                        event.target.complete()
                    }
                },
            })
    }

    /**
     * NUOVO METODO: Gestisce l'interruttore dei ruoli direttamente tramite click sulle chip neon.
     * Costruisce il payload corretto per SQLite e aggiorna il Signal in tempo reale.
     */
    toggleRoleDirectly(user: any, role: 'mod' | 'cataloguer') {
        if (user.isAdmin === 1) return; // Protezione di sicurezza per gli amministratori di sistema

        // Calcoliamo i nuovi bit invertendo lo stato attuale del flag selezionato
        const nextModState = role === 'mod' ? (user.isMod === 1 ? 0 : 1) : user.isMod;
        const nextCataloguerState = role === 'cataloguer' ? (user.isCataloguer === 1 ? 0 : 1) : user.isCataloguer;

        const bodyPayload = {
            isMod: nextModState,
            isCataloguer: nextCataloguerState,
        }

        this.http
            .patch(`${this.baseUrl}/${user.UserID}/roles`, bodyPayload, {
                headers: this.getAuthHeaders(),
            })
            .subscribe({
                next: () => {
                    this.presentToast('Privilegi utente aggiornati!', 'success')

                    // Aggiornamento atomico reattivo dello stato del Signal locale
                    this.users.update((currentUsers) =>
                        currentUsers.map((u) =>
                            u.UserID === user.UserID
                                ? {
                                      ...u,
                                      isMod: bodyPayload.isMod,
                                      isCataloguer: bodyPayload.isCataloguer,
                                  }
                                : u
                        )
                    )
                },
                error: (err) => {
                    console.error("Errore salvataggio ruolo:", err)
                    this.presentToast("Impossibile aggiornare i privilegi.", "danger")
                },
            })
    }

    onSearch(event: SearchbarCustomEvent) {
        this.currentSearchTerm = event.detail.value?.trim() || ''
        this.currentPage = 1

        const infiniteScroll = document.querySelector('ion-infinite-scroll') as any
        if (infiniteScroll) infiniteScroll.disabled = false

        this.loadUsers(false)
    }

    loadMoreData(event: InfiniteScrollCustomEvent) {
        this.currentPage++
        this.loadUsers(true, event)
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastController.create({
            message: message,
            duration: 2500,
            position: 'bottom',
            color: color,
        })
        await toast.present()
    }

    logout() {
        localStorage.clear()
        this.router.navigate(['/login'])
    }
}