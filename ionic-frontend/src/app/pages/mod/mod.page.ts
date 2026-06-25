import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'

import {
    ActionSheetController,
    AlertController,
    IonAccordion,
    IonAccordionGroup,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonTitle,
    IonToggle,
    IonToolbar,
    ModalController,
    ToastController,
} from '@ionic/angular/standalone'

import { addIcons } from 'ionicons'
import {
    addCircleOutline,
    checkmarkCircleOutline,
    closeCircleOutline,
    eyeOffOutline,
    eyeOutline,
    optionsOutline,
    peopleOutline,
    shieldCheckmarkOutline,
    timeOutline,
    trashOutline,
} from 'ionicons/icons'

import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'

// IMPORT SERVIZIO E MODELLI
import { ModComment, ModDiscussion, ModUser } from '@app/models/mod'
import { ModService } from '@app/services/mod'

// IMPORT COMPONENTI
import { DiscussionModalComponent } from '@app/components/discussion-modal/discussion-modal.component'
import { ModDiscussionCardComponent } from '@app/components/mod-discussion-card/mod-discussion-card.component'
import { ModUserCommentComponent } from '@app/components/mod-user-comment/mod-user-comment.component'

@Component({
    selector: 'app-mod',
    templateUrl: './mod.page.html',
    styleUrls: ['./mod.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        BackendUrlPipe,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonContent,
        IonItem,
        IonLabel,
        IonToggle,
        IonIcon,
        IonSegment,
        IonSegmentButton,
        IonAccordionGroup,
        IonAccordion,
        IonSearchbar,
        IonSpinner,
        IonBackButton,
        ModDiscussionCardComponent,
        ModUserCommentComponent,
    ],
})
export class ModPage implements OnInit {
    private modService = inject(ModService)
    private modalCtrl = inject(ModalController)
    private toastCtrl = inject(ToastController)
    private actionSheetCtrl = inject(ActionSheetController)
    private alertController = inject(AlertController)
    currentTab = signal<string>('discussions')

    // 🚀 Segnali tipizzati
    discussions = signal<ModDiscussion[]>([])
    showClosed = signal<number>(0)

    usersList = signal<ModUser[]>([])
    searchQuery = signal<string>('')
    userPage = signal<number>(1)
    userLimit = signal<number>(50)

    constructor() {
        addIcons({
            addCircleOutline,
            optionsOutline,
            trashOutline,
            shieldCheckmarkOutline,
            timeOutline,
            peopleOutline,
            closeCircleOutline,
            eyeOutline,
            eyeOffOutline,
            checkmarkCircleOutline,
        })
    }

    ngOnInit() {
        this.loadDiscussions()
    }

    segmentChanged(event: any) {
        const tab = event.detail.value
        this.currentTab.set(tab)
        if (tab === 'discussions') {
            this.loadDiscussions()
        } else {
            this.loadUsersList()
        }
    }

    // 📂 LOGICA DISCUSSIONI
    loadDiscussions() {
        this.modService.getDiscussions(this.showClosed()).subscribe({
            next: (data) => this.discussions.set(data),
            error: () =>
                this.showToast(
                    'Errore nel recupero delle discussioni',
                    'danger'
                ),
        })
    }

    toggleFilter(event: any) {
        this.showClosed.set(event.detail.checked ? 1 : 0)
        this.loadDiscussions()
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: DiscussionModalComponent,
        })
        await modal.present()

        const { data } = await modal.onWillDismiss()
        if (data) {
            this.modService.createDiscussion(data.payload).subscribe({
                next: () => {
                    this.showToast(
                        'Nuova discussione creata con successo',
                        'success'
                    )
                    this.loadDiscussions()
                },
                error: (err) =>
                    this.showToast(
                        err.error?.message || 'Errore in creazione',
                        'danger'
                    ),
            })
        }
    }

    async openEditModal(discussion: ModDiscussion) {
        const modal = await this.modalCtrl.create({
            component: DiscussionModalComponent,
            componentProps: { discussion },
        })
        await modal.present()

        const { data } = await modal.onWillDismiss()
        if (data) {
            this.modService
                .updateDiscussion(data.discussionId, data.payload)
                .subscribe({
                    next: () => {
                        this.showToast(
                            'Discussione aggiornata con successo',
                            'success'
                        )
                        this.loadDiscussions()
                    },
                    error: () =>
                        this.showToast(
                            "Errore durante l'aggiornamento",
                            'danger'
                        ),
                })
        }
    }

    async deleteDiscussion(id: number) {
        const alert = await this.alertController.create({
            header: 'Conferma Eliminazione',
            message:
                "Sei sicuro di voler eliminare questa discussione? L'azione cancellerà tutti i commenti collegati.",
            buttons: [
                {
                    text: 'Annulla',
                    role: 'cancel',
                },
                {
                    text: 'Elimina',
                    role: 'destructive',
                    handler: () => {
                        this.modService.deleteDiscussion(id).subscribe({
                            next: () => {
                                this.showToast(
                                    'Discussione eliminata permanentemente',
                                    'success'
                                )
                                this.loadDiscussions()
                            },
                            error: () =>
                                this.showToast(
                                    "Errore durante l'eliminazione",
                                    'danger'
                                ),
                        })
                    },
                },
            ],
        })

        await alert.present()
    }

    // 📂 LOGICA UTENTI
    loadUsersList() {
        this.modService
            .getUsers(this.userPage(), this.userLimit(), this.searchQuery())
            .subscribe({
                next: (data) => {
                    this.usersList.set(
                        data.map((u) => ({ ...u, comments: null }))
                    )
                },
                error: () =>
                    this.showToast(
                        'Errore nel caricamento della lista utenti',
                        'danger'
                    ),
            })
    }

    handleSearch(event: any) {
        this.searchQuery.set(event.detail.value || '')
        this.userPage.set(1)
        this.loadUsersList()
    }

    onUserAccordionChange(event: any) {
        const openedUserId = event.detail.value
        if (!openedUserId) return

        const currentUsers = this.usersList()
        const user = currentUsers.find(
            (u) => u.UserID.toString() === openedUserId
        )

        if (user && user.comments === null) {
            this.modService.getUserComments(openedUserId).subscribe({
                next: (commentsData) => {
                    user.comments = commentsData
                    this.usersList.set([...currentUsers])
                },
                error: () => {
                    this.showToast(
                        'Impossibile scaricare la cronologia commenti',
                        'danger'
                    )
                    user.comments = []
                    this.usersList.set([...currentUsers])
                },
            })
        }
    }

    toggleApprove(comment: ModComment) {
        const newStatus = comment.isApproved ? 0 : 1
        this.modService
            .moderateCommentApprove(
                comment.REF_UserID,
                comment.CommentID,
                newStatus
            )
            .subscribe({
                next: () => {
                    comment.isApproved = newStatus
                    this.showToast(
                        newStatus
                            ? 'Commento approvato'
                            : 'Approvazione rimossa',
                        'success'
                    )
                },
                error: () =>
                    this.showToast(
                        'Errore durante la modifica dello stato',
                        'danger'
                    ),
            })
    }

    toggleHide(comment: ModComment) {
        const newStatus = comment.isHidden ? 0 : 1
        this.modService
            .moderateCommentHide(
                comment.REF_UserID,
                comment.CommentID,
                newStatus
            )
            .subscribe({
                next: () => {
                    comment.isHidden = newStatus
                    this.showToast(
                        newStatus
                            ? 'Commento nascosto'
                            : 'Commento reso visibile',
                        'success'
                    )
                },
                error: () =>
                    this.showToast(
                        'Errore durante la modifica dello stato',
                        'danger'
                    ),
            })
    }

    async openBanActionSheet(user: ModUser) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: `Restringi permessi di commento per: ${user.Username}`,
            mode: 'md',
            buttons: [
                {
                    text: 'Sanzione Temporanea - 3 Giorni',
                    role: 'destructive',
                    handler: () => this.executeBan(user.UserID, 3),
                },
                {
                    text: 'Sanzione Temporanea - 7 Giorni',
                    role: 'destructive',
                    handler: () => this.executeBan(user.UserID, 7),
                },
                {
                    text: 'Sanzione Permanente - Indefinita',
                    role: 'destructive',
                    handler: () => this.executeBan(user.UserID, 0),
                },
                { text: 'Annulla', role: 'cancel' },
            ],
        })
        await actionSheet.present()
    }

    executeBan(targetUserId: number, durationDays: number = 0) {
        this.modService.banUser(targetUserId, durationDays).subscribe({
            next: (res: any) => {
                this.showToast(
                    res.message || 'Sanzione applicata con successo',
                    'success'
                )
                this.refreshSingleUserStatus(targetUserId)
            },
            error: (err) =>
                this.showToast(
                    err.error?.error || "Errore durante l'applicazione del ban",
                    'danger'
                ),
        })
    }

    executeUnban(user: ModUser) {
        this.modService.unbanUser(user.UserID).subscribe({
            next: (res: any) => {
                this.showToast(
                    res.message || 'Restrizione revocata. Utente riabilitato.',
                    'success'
                )
                this.refreshSingleUserStatus(user.UserID)
            },
            error: (err) =>
                this.showToast(
                    err.error?.error || 'Errore durante la revoca del ban',
                    'danger'
                ),
        })
    }

    private refreshSingleUserStatus(userId: number) {
        // Mantiene il comportamento precedente mappando i parametri limitati
        this.modService.getUsers(1, 100).subscribe({
            next: (data) => {
                const freshData = data.find((u) => u.UserID === userId)
                if (freshData) {
                    const updatedUsers = this.usersList().map((u) => {
                        if (u.UserID === userId) {
                            return {
                                ...u,
                                canComment: freshData.canComment,
                                BannedUntil: freshData.BannedUntil,
                            }
                        }
                        return u
                    })
                    this.usersList.set(updatedUsers)
                }
            },
        })
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
