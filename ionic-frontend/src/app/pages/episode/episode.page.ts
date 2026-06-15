import { Component, ElementRef, inject, OnInit, OnDestroy, viewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe';
import { combineLatest } from 'rxjs';
// import { MetaballsScreenSaverComponent } from '@app/components/metaballs/metaballs.component'; // <-- Metaballs commentato
import { IonContent, IonButton, IonCard, IonCardContent, IonIcon, IonSpinner, ToastController, ModalController, AlertController} from '@ionic/angular/standalone';
import { addCircleOutline, playCircle, shareSocialOutline, heartOutline, heart, chatbubblesOutline, chevronForwardOutline, createOutline, trashOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { CommentsComponent } from '@app/components/comments/comments.component';
import { DiscussionModalComponent } from '@app/components/discussion-modal/discussion-modal.component';
import { jwtDecodeHelper } from '@app/guards/mod-guard';
import videojs from 'video.js';
//import 'videojs-contrib-quality-levels';
//import 'videojs-hls-quality-selector';

@Component({
    selector: 'app-episode',
    templateUrl: './episode.page.html',
    styleUrls: ['./episode.page.scss'],
    standalone: true,
    imports: [
        IonContent, IonButton, IonCard, IonCardContent, CommonModule, IonIcon, IonSpinner,
        BackendUrlPipe, RouterModule, CommentsComponent
        // MetaballsScreenSaverComponent <-- Metaballs commentato
    ],
    providers: [BackendUrlPipe],
})
export class EpisodePage implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private http = inject(HttpClient);
    private backendUrl = inject(BackendUrlPipe);
    private modalCtrl = inject(ModalController);
    private alertCtrl = inject(AlertController);
    private toastCtrl = inject(ToastController);

    videoElement = viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');
    player: any;

    isLoading = signal<boolean>(true);
    episode = signal<any>(null);
    seasonEpisodes = signal<any[]>([]);
    discussions = signal<any[]>([]);

    /* // --- VARIABILI METABALLS (Commentate per debug) ---
    showScreensaver = signal<boolean>(false);
    inactivityTimer: any;
    SCREENSAVER_DELAY = 12000;
    */

    showId = signal<string>('');
    seasonId = signal<string>('');
    episodeId = signal<string>('');

    startAtTime = signal<number>(0); //per il continua a guardare
    isMod = signal<boolean>(false);

    expandedDiscussionId = signal<string | null>(null);

    private saveTimeout: any; //per evitare di mandare troppi update legati a pausa al backend

    constructor() {
        addIcons({chatbubblesOutline,createOutline,trashOutline,shareSocialOutline,addCircleOutline,playCircle,heartOutline,heart,chevronForwardOutline});
    }

    ngOnInit() {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecodeHelper(token);
            if (decodedToken && decodedToken.isMod === 1) {
                this.isMod.set(true);
            }
        }

        combineLatest([
            this.route.paramMap,
            this.route.queryParamMap
        ]).subscribe(([params, queryParams]) => {
            const epId = params.get('id') || params.get('episodeId');
            
            if (epId) {
                // 1. Se stavamo guardando un altro episodio, salviamolo all'istante!
                if (this.episodeId() && this.episodeId() !== epId && this.player) {
                    this.saveProgress(0, true);
                }

                // 2. DISTRUZIONE TOTALE DEL VECCHIO PLAYER (Risolve il bug del player rotto!)
                if (this.player) {
                    this.player.dispose(); // Uccide il player e lo rimuove dalla memoria
                    this.player = null;    // Resetta la variabile
                }

                // 3. Estraiamo i parametri in modo sicuro (Risolve il bug del tempo sballato!)
                const sId = queryParams.get('showId') || '1';
                const seaId = queryParams.get('seasonId') || '1'; 
                const startParam = queryParams.get('startAt');

                this.startAtTime.set(startParam ? parseInt(startParam, 10) : 0);

                this.showId.set(sId);
                this.seasonId.set(seaId);
                this.episodeId.set(epId);

                // Attiviamo il loading (Angular butterà via il tag video vecchio e ne preparerà uno nuovo)
                this.isLoading.set(true);
                
                this.loadEpisodeData(sId, seaId, epId);
                this.loadSeasonEpisodes(sId, seaId);
                this.loadDiscussions(sId, seaId, epId);
            }
        });
    }

    loadEpisodeData(showId: string, seasonId: string, episodeId: string) {
        this.http.get<any>(`api/shows/${showId}/seasons/${seasonId}/episodes/${episodeId}`).subscribe({
            next: (res) => {
                this.episode.set(res);
                
                // Spegniamo la rotellina (Angular inizia a rimettere il <video> nell'HTML)
                this.isLoading.set(false);
                
                // 🚀 Diamo 100 millisecondi esatti ad Angular per finire il disegno
                setTimeout(() => {
                    this.initPlayer();
                }, 100); 
            },
            error: (err) => {
                console.error('Errore nel recupero episodio:', err);
                this.isLoading.set(false);
            }
        });
    }

    loadSeasonEpisodes(showId: string, seasonId: string) {
        this.http.get<any[]>(`api/shows/${showId}/seasons/${seasonId}/episodes`).subscribe({
            next: (res) => this.seasonEpisodes.set(res),
            error: (err) => console.error('Errore nel recupero stagione:', err)
        });
    }

    loadDiscussions(showId: string, seasonId: string, episodeId: string) {
        this.http.get<any[]>(`api/shows/${showId}/seasons/${seasonId}/episodes/${episodeId}/discussions`).subscribe({
            next: (res) => this.discussions.set(res || []),
            error: (err) => {
                console.error('Errore nel recupero discussioni:', err);
                this.discussions.set([]);
            }
        });
    }

    initPlayer() {
        // Sicurezza potenziata: aspettiamo che il tag sia REALMENTE nel DOM
        const videoTag = this.videoElement();
        if (!videoTag || !videoTag.nativeElement) {
            console.error("⏳ Il tag video non è ancora pronto, ritento...");
            setTimeout(() => this.initPlayer(), 50);
            return;
        }

        this.player = videojs(videoTag.nativeElement, {
            autoplay: false, controls: true, responsive: true, fluid: true,
            sources: [{
                src: this.backendUrl.transform(`api/shows/${this.showId()}/seasons/${this.seasonId()}/episodes/${this.episodeId()}/stream`),
                type: 'application/x-mpegURL',
            }],
        }, () => {
            console.log('Player Pronto!');

            this.player.on('loadeddata', () => {
                
                const targetTime = this.startAtTime() > 0 
                    ? this.startAtTime() 
                    : (this.episode()?.userInteraction?.progress || this.episode()?.progress || 0);

                if (targetTime > 5) {
                    this.player.currentTime(targetTime);
                    console.log(`⏳ Riprendo la riproduzione da: ${targetTime} secondi`);
                } else {
                    // 🚀 FORZATURA RESET: Se è un episodio nuovo senza progressi, parti da 0!
                    this.player.currentTime(0); 
                }
                //this.applyLanguagePreferences(player);
                //this.player.hlsQualitySelector({
                //  displayCurrentQuality: true,
                //})
            });

            this.player.on('pause', () => {
                this.saveProgress(0); 
            });

            this.player.on('ended', () => {
                this.saveProgress(1, true); // Salviamo subito a fine video
            });
        });
    }

    /* Recupera le preferenze salvate o restituisce un oggetto di default
getLanguagePreferences() {
  const saved = localStorage.getItem('user_language_preferences');
  if (saved) {
    return JSON.parse(saved);
  }
  // Fallback se l'utente non ha mai aperto i settings
  return { appLanguage: 'it', defaultAudio: 'ja', defaultSubtitles: 'it' };
}

// Configura le tracce del player in base alle preferenze
applyLanguagePreferences(player: any) {
  const prefs = this.getLanguagePreferences();

  // --- 1. GESTIONE TRACCIA AUDIO ---
  // Recuperiamo tutte le tracce audio disponibili nel file video
  const audioTracks = player.audioTracks(); 
  
  if (audioTracks && audioTracks.length > 0) {
    for (let i = 0; i < audioTracks.length; i++) {
      // Se la traccia corrisponde alla preferenza (es. 'ja' o 'it')
      if (audioTracks[i].language === prefs.defaultAudio) {
        audioTracks[i].enabled = true; // Attiva questa traccia
      } else {
        audioTracks[i].enabled = false; // Disattiva le altre
      }
    }
  }

  // --- 2. GESTIONE SOTTOTITOLI (SUB) ---
  const textTracks = player.textTracks();

  if (textTracks && textTracks.length > 0) {
    for (let i = 0; i < textTracks.length; i++) {
      // Controlliamo se l'utente ha disattivato i sottotitoli nei settings
      if (prefs.defaultSubtitles === 'off') {
        textTracks[i].mode = 'disabled';
      } 
      // Altrimenti attiviamo solo la lingua scelta (es. 'it')
      else if (textTracks[i].language === prefs.defaultSubtitles) {
        textTracks[i].mode = 'showing'; // Mostra a schermo
      } else {
        textTracks[i].mode = 'disabled'; // Nascondi gli altri
      }
    }
  }
} */

    saveProgress(isCompleted: number, immediate: boolean = false) {
        // 🚀 1. Leggiamo il tempo SUBITO, prima di qualsiasi timeout!
        if (!this.player || !this.episode()) return;
        const progress = Math.floor(this.player.currentTime());
        
        if (progress <= 5) return;

        const body = {
            progress: progress,
            isCompleted: isCompleted,
            isDropped: 0,
            isLiked: this.episode()?.isLiked ?? this.episode()?.userInteraction?.isLiked ?? 0
        };

        // Puliamo eventuali timer in sospeso
        if (this.saveTimeout) clearTimeout(this.saveTimeout);

        // 2. Scegliamo se salvare subito o aspettare 1 secondo
        if (immediate) {
            // Salvataggio istantaneo (usato quando si chiude la pagina)
            this.http.post(`api/shows/${this.showId()}/seasons/${this.seasonId()}/episodes/${this.episodeId()}/interact`, body)
                .subscribe({
                    next: () => console.log('✅ Progresso in chiusura salvato:', progress, 'sec'),
                    error: (err) => console.error('Errore salvataggio in chiusura:', err)
                });
        } else {
            // Salvataggio ritardato (usato quando si mette in pausa per non spammare il DB)
            this.saveTimeout = setTimeout(() => {
                this.http.post(`api/shows/${this.showId()}/seasons/${this.seasonId()}/episodes/${this.episodeId()}/interact`, body)
                    .subscribe({
                        next: () => console.log('✅ Progresso salvato:', progress, 'sec'),
                        error: (err) => console.error('Errore salvataggio:', err)
                    });
            }, 1000);
        }
    }

    toggleLike() {
       const currentEp = this.episode();
        if (!currentEp) return;

        const userToken = localStorage.getItem('token'); 
        if (!userToken) {
            this.showToast($localize `:@@logInToLike:Devi accedere per mettere Mi Piace!`, 'danger');
            return; 
        }

        // 1. Capiamo se aveva già messo like (controlliamo entrambi i possibili formati del JSON)
        const wasLiked = currentEp.isLiked || currentEp.userInteraction?.isLiked ? 1 : 0;
        const newStatus = wasLiked ? 0 : 1;

        // 2. Aggiornamento Ottimistico della UI (immediato per l'utente)
        this.episode.update(ep => ({
            ...ep,
            isLiked: newStatus, // Aggiorna al primo livello
            // E aggiorna anche dentro userInteraction se esiste
            userInteraction: ep.userInteraction ? { ...ep.userInteraction, isLiked: newStatus } : undefined
        }));

        // 3. Prepariamo i dati: leggiamo i secondi dal player se è aperto, sennò dai dati vecchi
        const currentProgress = this.player ? Math.floor(this.player.currentTime()) : (currentEp.progress || 0);
        const isCompleted = currentEp.isCompleted ?? currentEp.userInteraction?.isCompleted ?? 0;

        const body = {
            progress: currentProgress,
            isCompleted: isCompleted,
            isDropped: 0,
            isLiked: newStatus 
        };

        // 4. Invio in background tramite HTTP
        this.http.post(`api/shows/${this.showId()}/seasons/${this.seasonId()}/episodes/${this.episodeId()}/interact`, body)
            .subscribe({
                next: () => {
                    // Opzionale: puoi decommentare la riga sotto se vuoi un toast di conferma
                    // this.showToast(newStatus ? 'Mi Piace aggiunto!' : 'Mi Piace rimosso', 'success');
                },
                error: (err) => {
                    console.error("Errore salvataggio Mi Piace: ", err);
                    // Rollback in caso di errore di rete
                    this.episode.update(ep => ({
                        ...ep,
                        isLiked: wasLiked,
                        userInteraction: ep.userInteraction ? { ...ep.userInteraction, isLiked: wasLiked } : undefined
                    }));
                    this.showToast($localize `:@@connessionErr:Errore di connessione.`, 'danger');
                }
            });
    }

    async openDiscussionModal(discussion?: any, event?: Event) {
        console.log("ID episodio: ", this.episodeId());
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        const modal = await this.modalCtrl.create({
            component: DiscussionModalComponent,
            componentProps: { discussion: discussion, episodeId: this.episodeId() }
        });

        await modal.present();

        const { data } = await modal.onDidDismiss();
        if (data?.payload) {
            if (data.isEdit) {
                this.http.patch(`api/mod/discussions/${data.discussionId}`, data.payload).subscribe({
                    next: () => this.loadDiscussions(this.showId(), this.seasonId(), this.episodeId()),
                    error: (err) => console.error("Errore aggiornamento:", err)
                });
            } else {
                this.http.post(`api/mod/discussions`, data.payload).subscribe({
                    next: () => this.loadDiscussions(this.showId(), this.seasonId(), this.episodeId()),
                    error: (err) => console.error("Errore creazione:", err)
                });
            }
        }
    }

    async deleteDiscussion(discussionId: string, event: Event) {
        event.stopPropagation();
        event.preventDefault();

        const alert = await this.alertCtrl.create({
         header: $localize `:@@deleteDiscussionHeader:Conferma Eliminazione`,
         message: $localize `:@@deleteDiscussionMessage:Sei sicuro di voler eliminare questa discussione? L'azione è irreversibile.`,
         buttons: [
           { 
             text: $localize `:@@cancelBtn:Annulla`, 
             role: 'cancel' 
           },
           { 
             text: $localize `:@@deleteBtn:Elimina`, 
             role: 'destructive',
             handler: () => {
               this.http.delete(`api/mod/discussions/${discussionId}`).subscribe({
                 next: () => this.loadDiscussions(this.showId(), this.seasonId(), this.episodeId()),
                 error: (err) => console.error("Errore eliminazione:", err)
                });
             }
           }
         ]
       });
       await alert.present();
    }

    toggleDiscussion(discussionId: string) {
        this.expandedDiscussionId.update(id => id === discussionId ? null : discussionId);
    }

    /*
    // --- METODI METABALLS E TIMER (Commentati per debug) ---
    startInactivityTimer() {
        this.clearInactivityTimer();
        this.inactivityTimer = setTimeout(() => {
            this.showScreensaver.set(true); 
        }, this.SCREENSAVER_DELAY);
    }

    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    onUserInteraction() {
        if (this.showScreensaver()) {
            this.showScreensaver.set(false);
        }
        if (this.player && this.player.paused()) {
            this.startInactivityTimer();
        }
    }
    */

    private async showToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            color,
            position: 'bottom'
        });
        await toast.present();
    }

    ngOnDestroy() {
        // 🚀 1. Salviamo il progresso sfruttando la nostra funzione super-testata!
        // Essendo una Single Page Application, Angular porterà a termine la
        // chiamata HTTP in background anche mentre carica la Home Page.
        this.saveProgress(0, true);

        // 2. Dopo aver salvato, distruggiamo il player per liberare la memoria
        if (this.player) {
            this.player.dispose();
            this.player = null;
        }
    }
}