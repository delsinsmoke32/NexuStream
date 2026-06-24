import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter, // 🚀 Importati per comunicare con l'esterno
    inject,
    SecurityContext,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import {
    IonButton,
    IonIcon,
    IonAvatar,
    IonTextarea,
    IonItem,
    ToastController,
    AlertController,
    IonicSafeString,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import {
    chatbubblesOutline,
    thumbsUp,
    arrowUndo,
    thumbsUpOutline,
    alertCircleOutline,
    checkmarkCircleOutline,
    eyeOffOutline,
    banOutline,
    arrowUndoOutline,
    closeCircle,
    shieldHalfOutline,
    hammerOutline,
    libraryOutline,
} from 'ionicons/icons'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'
import { jwtDecodeHelper } from '@app/utils/jwt-helper'
import { DomSanitizer } from '@lib/@angular/platform-browser'

@Component({
    selector: 'app-comments',
    templateUrl: './comments.component.html',
    styleUrls: ['./comments.component.scss'],
    standalone: true,
    imports: [
        IonButton,
        IonIcon,
        IonAvatar,
        IonTextarea,
        IonItem,
        CommonModule,
        FormsModule,
        BackendUrlPipe,
    ],
})
export class CommentsComponent implements OnInit {
    @Input() showId!: string
    @Input() seasonId!: string
    @Input() episodeId!: string
    @Input() discussionId!: string
    @Input() isMod: boolean = false

    // 🚀 L'evento che trasmette i secondi al componente padre (EpisodePage)
    @Output() timestampClick = new EventEmitter<number>()

    private http = inject(HttpClient)
    private toastCtrl = inject(ToastController)
    private alertCtrl = inject(AlertController)
    private sanitizer = inject(DomSanitizer)

    comments: any[] = []
    nuovoCommentoTesto: string = ''

    // Gestione Risposte
    replyingToCommentId: number | null = null
    replyingToUsername: string | null = null

    // Gestione Permessi
    isAdmin: boolean = false
    currentUserId: number | null = null

    constructor() {
        addIcons({closeCircle,shieldHalfOutline,hammerOutline,libraryOutline,arrowUndoOutline,alertCircleOutline,checkmarkCircleOutline,eyeOffOutline,banOutline,arrowUndo,chatbubblesOutline,thumbsUpOutline,thumbsUp,});
    }

    get baseUrl() {
        return `api/shows/${this.showId}/seasons/${this.seasonId}/episodes/${this.episodeId}/discussions/${this.discussionId}/comments`
    }

    ngOnInit() {
        if (this.discussionId) this.caricaCommenti()

        const token = localStorage.getItem('token')
        if (token) {
            const decoded = jwtDecodeHelper(token)
            if (decoded) {
                this.currentUserId = decoded.id || decoded.UserID
                if (decoded.isAdmin === 1) {
                    this.isAdmin = true
                }
            }
        }
    }

    caricaCommenti() {
        this.http.get<any[]>(this.baseUrl).subscribe({
            next: (res) => {
                const flatComments = res || []
                const commentMap = new Map()
                const rootComments: any[] = []

                flatComments.forEach((c) => {
                    c.replies = []

                    const match = c.CommentText.match(/^@([^\s]+)\s([\s\S]*)/)
                    if (match) {
                        c.replyTag = match[1]
                        c.cleanText = match[2]
                    } else {
                        c.replyTag = null
                        c.cleanText = c.CommentText
                    }

                    // 🚀 Invece di una singola stringa, ora generiamo i frammenti (testo + timestamp)
                    c.parsedChunks = this.parseCommentText(c.cleanText)

                    commentMap.set(c.CommentID, c)
                })

                flatComments.forEach((c) => {
                    if (c.REF_CommentID) {
                        let rootId = c.REF_CommentID
                        while (
                            commentMap.has(rootId) &&
                            commentMap.get(rootId).REF_CommentID
                        ) {
                            rootId = commentMap.get(rootId).REF_CommentID
                        }

                        const rootParent = commentMap.get(rootId)
                        if (rootParent) {
                            rootParent.replies.push(c)
                        } else {
                            rootComments.push(c)
                        }
                    } else {
                        rootComments.push(c)
                    }
                })

                rootComments.forEach((c) => {
                    c.replies.sort(
                        (a: any, b: any) =>
                            new Date(a.DateCommented).getTime() -
                            new Date(b.DateCommented).getTime()
                    )
                })

                this.comments = rootComments
            },
            error: (err) => console.error('Errore caricamento commenti:', err),
        })
    }

    // ==========================================
    // 🚀 LOGICA DEI TIMESTAMP
    // ==========================================
    
    parseCommentText(text: string): { isTimestamp: boolean; text?: string; html?: string; seconds?: number }[] {
        if (!text) return [];

        const timestampRegex = /(\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b)/g;
        const parts = text.split(timestampRegex);

        return parts.map(part => {
            const isTimestamp = /^(?:\d{1,2}:)?\d{1,2}:\d{2}$/.test(part);
            
            if (isTimestamp) {
                return {
                    isTimestamp: true,
                    text: part,
                    seconds: this.convertTimestampToSeconds(part)
                };
            }
            // Se non è un minutaggio, applichiamo il tuo normale parser markdown!
            return { 
                isTimestamp: false, 
                html: this.parseMarkdown(part) 
            };
        });
    }

    private convertTimestampToSeconds(timestamp: string): number {
        const parts = timestamp.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        return 0;
    }

    onTimestampClicked(seconds: number | undefined) {
        if (seconds !== undefined) {
            this.timestampClick.emit(seconds);
        }
    }

    // ==========================================

    scrollToComment(commentId: number) {
        const element = document.getElementById('comment-' + commentId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('highlight-pulse')
            setTimeout(() => {
                element.classList.remove('highlight-pulse')
            }, 2000)
        }
    }

    rispondiA(comment: any, rootId: number) {
        this.replyingToCommentId = rootId
        this.replyingToUsername = comment.Username
        this.nuovoCommentoTesto = `@${comment.Username} `

        setTimeout(() => {
            const inputBox = document.getElementById('comment-input-box')
            if (inputBox) {
                inputBox.scrollIntoView({ behavior: 'smooth', block: 'center' })
                const ionTextarea = inputBox.querySelector('ion-textarea')
                if (ionTextarea) {
                    ionTextarea.setFocus()
                }
            }
        }, 100)
    }

    aggiungiCommento() {
        if (!this.nuovoCommentoTesto.trim()) return

        const payload: any = {
            text: this.nuovoCommentoTesto,
            CommentText: this.nuovoCommentoTesto,
        }

        if (this.replyingToCommentId) {
            payload.parentCommentId = this.replyingToCommentId
        }

        this.http.post<any>(this.baseUrl, payload).subscribe({
            next: () => {
                this.caricaCommenti()
                this.annullaRisposta()
            },
            error: (err) => {
                console.error('Errore post commento:', err.error)
                this.presentToast("Errore durante l'invio.", 'danger')
            },
        })
    }

    parseMarkdown(text: string): string {
        if (!text) return ''
        let parsed = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')

        parsed = parsed.replace(/\*([^\*]+)\*/g, '<strong>$1</strong>')
        parsed = parsed.replace(/_([^_]+)_/g, '<em>$1</em>')
        parsed = parsed.replace(/~([^~]+)~/g, '<del>$1</del>')
        parsed = parsed.replace(/\n/g, '<br>')

        return parsed
    }

    annullaRisposta() {
        this.replyingToCommentId = null
        this.replyingToUsername = null
        this.nuovoCommentoTesto = ''
    }

    toggleLike(comment: any) {
        const newStatus = comment.isLiked ? 0 : 1
        this.http
            .post(`${this.baseUrl}/${comment.CommentID}/interact`, {
                isLiked: newStatus,
            })
            .subscribe({
                next: () => {
                    comment.isLiked = newStatus
                    comment.Likes = newStatus
                        ? (comment.Likes || 0) + 1
                        : (comment.Likes || 1) - 1
                },
            })
    }

    reportMessage(comment: any) {
        this.http
            .post(`${this.baseUrl}/${comment.CommentID}/interact`, {
                isReported: 1,
            })
            .subscribe({
                next: () => {
                    comment.isReported = 1
                    this.presentToast('Segnalazione inviata ai Moderatori.', 'success')
                },
            })
    }

    toggleApprove(comment: any) {
        const newStatus = comment.isApproved ? 0 : 1
        this.http
            .patch(`${this.baseUrl}/${comment.CommentID}/approve`, {
                isApproved: newStatus,
            })
            .subscribe({
                next: () => {
                    comment.isApproved = newStatus
                    this.presentToast('Stato aggiornato', 'success')
                },
            })
    }

    toggleHide(comment: any) {
        const newStatus = comment.isHidden ? 0 : 1
        this.http
            .patch(`${this.baseUrl}/${comment.CommentID}/hide`, {
                isHidden: newStatus,
            })
            .subscribe({
                next: () => {
                    comment.isHidden = newStatus
                    this.presentToast('Stato aggiornato', 'success')
                },
            })
    }

    canBanUser(comment: any): boolean {
        if (comment.REF_UserID === this.currentUserId) return false
        if (this.isAdmin) return true
        else if (this.isMod) return !comment.isMod && !comment.isAdmin
        return false
    }

    async banUser(userId: string | number, username: string) {
        const safeUsername = this.sanitizer.sanitize(SecurityContext.HTML, username) || ''
        const alert = await this.alertCtrl.create({
            header: 'Banna Utente',
            message: new IonicSafeString(`Scegli la durata della sanzione per <strong>${safeUsername}</strong>.`),
            htmlAttributes: { sanitize: false },
            inputs: [
                { label: '3 Giorni', type: 'radio', value: 3 },
                { label: '7 Giorni', type: 'radio', value: 7 },
                { label: 'Indefinito', type: 'radio', value: 0 },
            ],
            buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                    text: 'Banna',
                    role: 'destructive',
                    handler: (durationDays: number) => {
                        if (durationDays === undefined) {
                            this.presentToast('Seleziona una durata prima di bannare.', 'danger')
                            return false
                        }
                        const payload = { targetUserId: userId, durationDays }
                        this.http.post(`api/mod/users/${userId}/ban`, payload).subscribe({
                            next: (res: any) => this.presentToast(res.message || 'Sanzione applicata con successo.', 'success'),
                            error: (err) => this.presentToast(err.error?.error || 'Errore durante il ban.', 'danger'),
                        })
                        return true
                    },
                },
            ],
        })
        await alert.present()
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            color,
            position: 'bottom',
        })
        await toast.present()
    }
}