import {
    Component,
    OnInit,
    Input,
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
import { jwtDecodeHelper } from '@app/guards/mod-guard'
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
    @Input() isMod: boolean = false // Dal genitore

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
        addIcons({
            closeCircle,
            shieldHalfOutline,
            hammerOutline,
            libraryOutline,
            arrowUndoOutline,
            alertCircleOutline,
            checkmarkCircleOutline,
            eyeOffOutline,
            banOutline,
            arrowUndo,
            chatbubblesOutline,
            thumbsUpOutline,
            thumbsUp,
        })
    }

    get baseUrl() {
        return `api/shows/${this.showId}/seasons/${this.seasonId}/episodes/${this.episodeId}/discussions/${this.discussionId}/comments`
    }

    ngOnInit() {
        if (this.discussionId) this.caricaCommenti()

        // Estrae lo status di Admin e l'ID utente dal Token!
        const token = localStorage.getItem('token')
        if (token) {
            const decoded = jwtDecodeHelper(token)
            if (decoded) {
                // Salva l'ID dell'utente loggato (adatta "id" o "UserID" in base al tuo payload JWT)
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

                // 1. Inizializziamo le risposte e il "Parser" delle menzioni
                flatComments.forEach((c) => {
                    c.replies = []

                    // Cerca un pattern tipo "@NomeUtente " all'inizio del testo
                    const match = c.CommentText.match(/^@([^\s]+)\s([\s\S]*)/)
                    if (match) {
                        c.replyTag = match[1] // Salva 'NomeUtente'
                        c.cleanText = match[2] // Salva il resto del messaggio
                    } else {
                        c.replyTag = null
                        c.cleanText = c.CommentText
                    }

                    c.parsedText = this.parseMarkdown(c.cleanText)

                    commentMap.set(c.CommentID, c)
                })

                // 2. Costruiamo l'albero PIATTO (stile Instagram)
                flatComments.forEach((c) => {
                    if (c.REF_CommentID) {
                        // Risaliamo l'albero fino a trovare il PADRE ASSOLUTO (la radice)
                        let rootId = c.REF_CommentID
                        while (
                            commentMap.has(rootId) &&
                            commentMap.get(rootId).REF_CommentID
                        ) {
                            rootId = commentMap.get(rootId).REF_CommentID
                        }

                        const rootParent = commentMap.get(rootId)
                        if (rootParent) {
                            rootParent.replies.push(c) // Mettiamo la risposta sotto la radice
                        } else {
                            rootComments.push(c) // Fallback
                        }
                    } else {
                        rootComments.push(c)
                    }
                })

                // 3. Ordiniamo le risposte per data (dalla più vecchia alla più nuova)
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

    // NUOVA FUNZIONE: Scorre la pagina fino al commento taggato ed esegue un flash visivo
    scrollToComment(commentId: number) {
        const element = document.getElementById('comment-' + commentId)
        if (element) {
            // Scorre fluidamente fino al commento
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })

            // Aggiunge la classe per il "lampeggio" e la rimuove dopo 2 secondi
            element.classList.add('highlight-pulse')
            setTimeout(() => {
                element.classList.remove('highlight-pulse')
            }, 2000)
        }
    }

    // Modificato per ricevere l'ID della radice
    rispondiA(comment: any, rootId: number) {
        this.replyingToCommentId = rootId
        this.replyingToUsername = comment.Username
        this.nuovoCommentoTesto = `@${comment.Username} `

        // Scroll e Focus automatico sull'input
        setTimeout(() => {
            const inputBox = document.getElementById('comment-input-box')
            if (inputBox) {
                // 1. Scorre fluidamente verso l'area di input
                inputBox.scrollIntoView({ behavior: 'smooth', block: 'center' })

                // 2. Cerca la ion-textarea e ci mette il focus (apre la tastiera da mobile!)
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

    // PARSER DEL TESTO (Stile WhatsApp / Discord)
    parseMarkdown(text: string): string {
        if (!text) return ''

        // 1. Sicurezza: Disinnesca eventuali tag HTML malevoli inseriti dall'utente
        let parsed = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')

        // 2. Grassetto: *testo*
        parsed = parsed.replace(/\*([^\*]+)\*/g, '<strong>$1</strong>')

        // 3. Corsivo: _testo_
        parsed = parsed.replace(/_([^_]+)_/g, '<em>$1</em>')

        // 4. Barrato: ~testo~
        parsed = parsed.replace(/~([^~]+)~/g, '<del>$1</del>')

        // 5. A capo: converte gli 'Invio' in <br>
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
                    // Disabilita il pulsante e lo colora di rosso istantaneamente
                    comment.isReported = 1
                    this.presentToast(
                        'Segnalazione inviata ai Moderatori.',
                        'success'
                    )
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

    // LOGICA PERMESSI BAN
    canBanUser(comment: any): boolean {
        // Nessuno può auto-bannarsi
        if (comment.REF_UserID === this.currentUserId) {
            return false
        }

        if (this.isAdmin) {
            // L'Admin può bannare chiunque altro
            return true
        } else if (this.isMod) {
            // Il Mod può bannare solo se l'autore NON è un mod e NON è un admin
            return !comment.isMod && !comment.isAdmin
        }

        // Utente normale: niente ban
        return false
    }

    async banUser(userId: string | number, username: string) {
        const safeUsername =
            this.sanitizer.sanitize(SecurityContext.HTML, username) || ''
        const alert = await this.alertCtrl.create({
            header: 'Banna Utente',
            message: new IonicSafeString(
                `Scegli la durata della sanzione per <strong>${safeUsername}</strong>.`
            ),
            // cssClass: 'custom-radio-alert', //test
            htmlAttributes: {
                sanitize: false, // Necessario solo per far leggere il tag <strong>, ma ora lo username è sicuro
            },
            inputs: [
                { label: '3 Giorni', type: 'radio', value: 3 },
                { label: '7 Giorni', type: 'radio', value: 7 },
                { label: 'Indefinito', type: 'radio', value: 0 }, // 0 = Permaban
            ],
            buttons: [
                { text: 'Annulla', role: 'cancel' },
                {
                    text: 'Banna',
                    role: 'destructive',
                    handler: (durationDays: number) => {
                        // Controlla se il Mod ha premuto Banna senza selezionare un'opzione
                        if (durationDays === undefined) {
                            this.presentToast(
                                'Seleziona una durata prima di bannare.',
                                'danger'
                            )
                            return false // Impedisce alla modale di chiudersi
                        }

                        const payload = { targetUserId: userId, durationDays }

                        // Usa il path corretto per l'API di moderazione globale
                        this.http
                            .post(`api/mod/users/${userId}/ban`, payload)
                            .subscribe({
                                next: (res: any) =>
                                    this.presentToast(
                                        res.message ||
                                            'Sanzione applicata con successo.',
                                        'success'
                                    ),
                                error: (err) =>
                                    this.presentToast(
                                        err.error?.error ||
                                            'Errore durante il ban.',
                                        'danger'
                                    ),
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
