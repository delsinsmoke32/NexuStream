import { Component, ElementRef, Input, Output, EventEmitter, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import videojs from 'video.js';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  @ViewChild('target', { static: true }) target!: ElementRef;
  
  @Input() url!: string; 
  @Input() times: { StartTime: number, EndTime: number, Type: string }[] = [];
  @Input() startAtTime: number = 0;

  @Output() onPause = new EventEmitter<number>();
  @Output() onEnded = new EventEmitter<number>();
  @Output() onDestroySave = new EventEmitter<number>();
  @Output() onNextEpisode = new EventEmitter<void>();

  player: any;

  showSkipIntro = signal(false);
  showSkipRecap = signal(false);
  showCreditsOverlay = signal(false);
  private playPromise: Promise<void> | undefined;
  
  activeIntroEnd = 0; 
  activeRecapEnd = 0; 
  overlayDismissed = false; 

  private nextEpTimer: any; //  Timer per l'autoplay

  ngOnInit() {
    this.initPlayer();
  }

  initPlayer() {
    this.player = videojs(this.target.nativeElement, {
      autoplay: false,
      controls: true, 
      responsive: true, 
      fluid: true,
      preload: 'auto', 
      html5: { vhs: { withCredentials: true, overrideNative: true, fastReady: true, useDevicePixelRatio: true } },
      sources: [{ src: this.url, type: 'application/x-mpegURL' }],
    }, () => {
      
      this.player.on('loadeddata', () => {
        if (this.startAtTime > 5) {
          this.player.currentTime(this.startAtTime);
        } else {
          this.player.currentTime(0); 
        }
        // CATTURA LA PROMESSA (Mancava questo!)
        this.playPromise = this.player.play();
      });

      this.player.on('timeupdate', () => {
        this.checkMarkers(this.player.currentTime());
      });

      this.player.on('pause', () => {
        this.onPause.emit(Math.floor(this.player.currentTime()));
      });

      this.player.on('ended', () => {
        this.onEnded.emit(Math.floor(this.player.currentTime()));
        // Fallback di sicurezza se l'utente arriva alla fine esatta del video
        this.triggerNextEpisode(); 
      });
    });
  }

  checkMarkers(currentTime: number) {
    let isIntroActive = false;
    let isRecapActive = false;
    let isInCreditsNow = false;

    const safeTimes = this.times || [];

    for (const marker of safeTimes) {
      if (currentTime >= marker.StartTime && currentTime <= marker.EndTime) {
        if (marker.Type === 'intro') {
          isIntroActive = true;
          this.activeIntroEnd = marker.EndTime;
        } else if (marker.Type === 'recap') {
          isRecapActive = true;
          this.activeRecapEnd = marker.EndTime;
        } else if (marker.Type === 'credits') {
          isInCreditsNow = true;
        }
      }
    }

    this.showSkipIntro.set(isIntroActive);
    this.showSkipRecap.set(isRecapActive);

    //  LOGICA INTELLIGENTE PER I CREDITS E AUTOPLAY
    if (isInCreditsNow) {
      // Se siamo entrati nella zona e non avevamo chiuso il popup
      if (!this.overlayDismissed && !this.showCreditsOverlay()) {
        this.showCreditsOverlay.set(true);
        this.startNextEpTimer();
      }
    } else {
      // Se non siamo nella zona (o siamo tornati indietro con il rewind)
      this.overlayDismissed = false; // Resettiamo la scelta per la prossima volta
      if (this.showCreditsOverlay()) {
        this.showCreditsOverlay.set(false);
        this.clearNextEpTimer();
      }
    }
  }

  // --- LOGICA TIMER 5 SECONDI ---
  startNextEpTimer() {
    this.clearNextEpTimer();
    this.nextEpTimer = setTimeout(() => {
      this.triggerNextEpisode();
    }, 5000); //  Lancia l'evento esattamente dopo 5 secondi
  }

  clearNextEpTimer() {
    if (this.nextEpTimer) {
      clearTimeout(this.nextEpTimer);
      this.nextEpTimer = null;
    }
  }

  // --- AZIONI BOTTONI ---
  skipTo(seconds: number) {
    this.player.currentTime(seconds);
    this.showSkipIntro.set(false);
    this.showSkipRecap.set(false);
  }

  hideOverlay() {
    this.overlayDismissed = true;
    this.showCreditsOverlay.set(false);
    this.clearNextEpTimer(); //  Ferma l'autoplay se decide di guardare i titoli!
  }


  //  NUOVA FUNZIONE PER I TIMESTAMP DEI COMMENTI (Con controlli di sicurezza!)
  public seekTo(seconds: number) {
    if (this.player) {
      // Otteniamo la durata totale del video (se è già stata caricata)
      const duration = this.player.duration();

      // 1. Clamping: Il tempo non può essere minore di 0
      let safeSeconds = Math.max(0, seconds);
      
      // 2. Clamping: Il tempo non può superare la durata del video
      if (duration && duration > 0) {
         // Se l'utente ha messo un tempo fuori limite, lo portiamo agli ultimi 2 secondi del video
         safeSeconds = Math.min(safeSeconds, duration - 2); 
      }

      // 3. Sposta il video al secondo SICURO
      this.player.currentTime(safeSeconds);
      
      // 4. Forza il play in modo sicuro
      this.playPromise = this.player.play();
      if (this.playPromise !== undefined) {
        this.playPromise.catch(() => {
           // Ignoriamo silenziamente se il browser blocca l'autoplay
        });
      }
    }
  }

  triggerNextEpisode() {
    this.clearNextEpTimer();
    
    //  LA MAGIA ANTI-FANTASMA: Rompiamo la sincronia!
    // Spingiamo l'emissione dell'evento nel prossimo ciclo del browser.
    // Questo permette a Video.js di completare il suo click o il suo evento 'ended'
    // in modo pulito, PRIMA che Angular lo strappi via violentemente dal DOM.
    setTimeout(() => {
      this.onNextEpisode.emit();
    }, 50);
  }

  // NUOVA FUNZIONE PUBBLICA CHE IL PADRE PUÒ CHIAMARE
  public async killPlayer() {
    this.clearNextEpTimer();
    if (this.player) {
      const finalTime = Math.floor(this.player.currentTime());
      setTimeout(() => this.onDestroySave.emit(finalTime), 0);

      try {
        // ASPETTA CHE IL BROWSER FINISCA DI PENSARE (Mancava questo!)
        if (this.playPromise !== undefined) {
          await this.playPromise;
        }
        
        const videoElement = this.target?.nativeElement;
        if (videoElement) {
          videoElement.volume = 0;       
          videoElement.muted = true;     
          videoElement.pause();          
          videoElement.removeAttribute('src'); 
          videoElement.load();           
        }
        this.player.off(); 
        this.player.pause();
        
        const tech = this.player.tech({ IWillNotUseThisInPlugins: true });
        if (tech && tech.vhs) {
          tech.vhs.xhr.abort(); 
        }

        this.player.dispose(); 
      } catch (e) {
        console.warn("Chiusura forzata del player completata.");
      } finally {
        this.player = null; 
      }
    }
  }

  // ngOnDestroy ora si limita a chiamare la funzione qui sopra (se si cambia proprio pagina)
  ngOnDestroy() {
    this.killPlayer();
  }

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