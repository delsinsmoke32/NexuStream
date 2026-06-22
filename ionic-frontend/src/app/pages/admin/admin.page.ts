import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
} from '@ionic/angular/standalone';

import { BackendUrlPipe } from '../../pipes/backend-url-pipe';
import { AdminService } from '@app/services/admin';
import { AuthService } from '@app/services/auth';
import { AdminUser, UpdateRolesPayload } from '../../models/admin';

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
    private router = inject(Router);
    private toastController = inject(ToastController);
    private adminService = inject(AdminService);
    private authService = inject(AuthService);

    users = signal<AdminUser[]>([]);
    currentPage = 1;
    pageSize = 20;
    currentSearchTerm = '';

    ngOnInit() {
        this.loadUsers()
    }

    loadUsers(isAppend: boolean = false, event?: InfiniteScrollCustomEvent) {
        // 🚀 Chiamata pulita al Service
        this.adminService.getUsers(this.currentPage, this.pageSize, this.currentSearchTerm)
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

    toggleRoleDirectly(user: AdminUser, role: 'mod' | 'cataloguer') {
        if (user.isAdmin === 1) return; 

        const nextModState = role === 'mod' ? (user.isMod === 1 ? 0 : 1) : user.isMod;
        const nextCataloguerState = role === 'cataloguer' ? (user.isCataloguer === 1 ? 0 : 1) : user.isCataloguer;

        const bodyPayload: UpdateRolesPayload = {
            isMod: nextModState,
            isCataloguer: nextCataloguerState,
        }

        this.adminService.updateUserRoles(user.UserID, bodyPayload)
            .subscribe({
                next: () => {
                    this.presentToast('Privilegi utente aggiornati!', 'success')

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
                    console.error("Errore salvataggio ruolo:", err);
                    this.presentToast("Impossibile aggiornare i privilegi.", "danger");
                },
            })
    }

    onSearch(event: SearchbarCustomEvent) {
        this.currentSearchTerm = event.detail.value?.trim() || '';
        this.currentPage = 1;

        const infiniteScroll = document.querySelector('ion-infinite-scroll') as any;
        if (infiniteScroll) infiniteScroll.disabled = false;

        this.loadUsers(false);
    }

    loadMoreData(event: InfiniteScrollCustomEvent) {
        this.currentPage++;
        this.loadUsers(true, event);
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastController.create({
            message: message,
            duration: 2500,
            position: 'bottom',
            color: color,
        })
        await toast.present();
    }

    async logout() {
        await this.authService.confirmLogout();
    }
}