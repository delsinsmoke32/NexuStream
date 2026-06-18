import { Component, ElementRef, Input, OnInit, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// IONIC STANDALONE
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList,
  IonItem, IonLabel, IonInput, IonTextarea, IonGrid, IonRow, IonCol, AlertController,
  ModalController, IonIcon, IonText, IonSelect, IonSelectOption, ToastController, IonSpinner 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { imageOutline, videocamOutline, documentTextOutline, addCircleOutline, trashOutline, informationCircleOutline, checkmarkCircle, musicalNotesOutline, textOutline, volumeHighOutline } from 'ionicons/icons'; // Aggiunte icone extra

@Component({
  selector: 'app-cataloguer-episode-modal',
  templateUrl: './cataloguer-episode-modal.component.html',
  styleUrls: ['./cataloguer-episode-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
    IonItem, IonLabel, IonInput, IonTextarea, IonGrid, IonRow, IonCol,
    IonIcon, IonText, FormsModule, IonSelect, IonSelectOption, IonSpinner, IonList
  ]
})
export class CataloguerEpisodeModalComponent implements OnInit {
  @Input() data: any; // Dati in modalità modifica
  @Input() seasonId!: number; // Ricevuto dal padre
  @Input() autoEpisodeNumber!: number; // Numero di episodio automatico, passato con componentProps

  // ViewChild per gli input
  thumbInput = viewChild.required<ElementRef<HTMLInputElement>>('thumbInput');
  videoInput = viewChild<ElementRef<HTMLInputElement>>('videoInput'); // Non required perché in modifica non c'è

  // Signals per Immagine
  thumbnailFile = signal<File | null>(null);
  thumbnailPreview = signal<string | null>(null);

  // 🚀 Signals per Video Principale
  videoFile = signal<File | null>(null);
  videoFileName = signal<string | null>(null); // Per mostrare il nome del file all'utente
  audioTracksList = signal<{lang: string, file: File | null}[]>([]);
  subTracksList = signal<{lang: string, file: File | null}[]>([]);
  existingDubs = signal<string[]>([]);
  existingSubs = signal<string[]>([]);

  isUploading = signal<boolean>(false);

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  episodeForm!: FormGroup;
  isEditMode = false;

  constructor() {
    addIcons({imageOutline,documentTextOutline,videocamOutline,informationCircleOutline,addCircleOutline,trashOutline, checkmarkCircle, musicalNotesOutline, textOutline, volumeHighOutline});
  }

  ngOnInit() {
    this.isEditMode = !!this.data;
    
    // 🚀 ESTRAZIONE LINGUE ESISTENTI AL CARICAMENTO
    if (this.isEditMode) {
      if (this.data.ThumbnailURI) this.thumbnailPreview.set(`http://localhost:3000/${this.data.ThumbnailURI}`);
      
      this.existingDubs.set(this.data.DubLanguages ? this.data.DubLanguages.split(',') : ['it']);
      this.existingSubs.set(this.data.SubLanguages ? this.data.SubLanguages.split(',') : []);
    }

    this.initForm();
  }

  private initForm() {
    const getLangText = (jsonStr: string, lang: string) => {
      try { const obj = JSON.parse(jsonStr); return obj[lang] || ''; } catch { return jsonStr || ''; }
    };

    this.episodeForm = this.fb.group({
      title_it: [this.isEditMode ? getLangText(this.data.Title, 'it') : '', [Validators.required]],
      description_it: [this.isEditMode ? getLangText(this.data.Description, 'it') : '', [Validators.required]],
      title_en: [this.isEditMode ? getLangText(this.data.Title, 'en') : ''],
      description_en: [this.isEditMode ? getLangText(this.data.Description, 'en') : ''],
      
      releaseDate: [{ value: this.data?.ReleaseDate || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required]],
      duration: [{ value: this.data?.Duration || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required, Validators.min(1)]],
      episodeNumber: [{ 
          value: this.data?.EpisodeNumber || this.autoEpisodeNumber, 
          disabled: true 
      }],
      refSeason: [this.seasonId] 
    });
  }

  triggerThumbSelect() {
    this.thumbInput().nativeElement.click();
  }

  // 🚀 Funzione per aprire il file picker del video
  triggerVideoSelect() {
    const vInput = this.videoInput();
    if (vInput) vInput.nativeElement.click();
  }

  onThumbSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.thumbnailFile.set(file);
        this.thumbnailPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  
  // Gestione selezione file video con calcolo automatico della durata
  onVideoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.videoFile.set(file);
      this.videoFileName.set(file.name);

      // --- LETTURA DURATA ---
      const videoNode = document.createElement('video');
      videoNode.preload = 'metadata';
      videoNode.src = URL.createObjectURL(file);
      
      videoNode.onloadedmetadata = () => {
        const durationInSeconds = Math.round(videoNode.duration);
        
        // Inseriamo il valore direttamente nel campo del form
        this.episodeForm.patchValue({ duration: durationInSeconds });
        
        // Puliamo la memoria
        URL.revokeObjectURL(videoNode.src); 
      };
    }
  }

  dismiss(result?: any) {
    this.modalCtrl.dismiss(result);
  }

  private async uploadThumbnail(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('thumbnail', file, file.name);
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const endpoint = `http://localhost:3000/api/upload/episode_thumbnails`;
    const response: any = await firstValueFrom(this.http.post(endpoint, formData, { headers }));
    return response.uri;
  }

  // Il nostro "STEP 1" per il file pesante
  private async uploadRawVideo(file: File): Promise<string> {
    const formData = new FormData();
    // Il nome "video_file" deve coincidere con multerConfig.uploadRawVideo.single('video_file')
    formData.append('video_file', file, file.name); 
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const endpoint = `http://localhost:3000/api/upload/episodes/video/raw`;
    
    // Potrebbe impiegare qualche secondo/minuto in base alla connessione, Angular aspetterà
    const response: any = await firstValueFrom(this.http.post(endpoint, formData, { headers }));
    return response.uri; // Ritorna es: "videos/temp/raw_video_123.mp4"
  }

  // AUDIO
  addAudioTrack() {
    this.audioTracksList.update(list => [...list, { lang: 'it', file: null }]);
  }
  removeAudioTrack(index: number) {
    this.audioTracksList.update(list => list.filter((_, i) => i !== index));
  }
  triggerAudioSelect(index: number) {
    document.getElementById('audioInput_' + index)?.click();
  }
  onAudioSelect(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.audioTracksList.update(list => {
        const newList = [...list];
        newList[index].file = file;
        return newList;
      });
    }
  }

  // SOTTOTITOLI
  addSubTrack() {
    this.subTracksList.update(list => [...list, { lang: 'it', file: null }]);
  }
  removeSubTrack(index: number) {
    this.subTracksList.update(list => list.filter((_, i) => i !== index));
  }
  triggerSubSelect(index: number) {
    document.getElementById('subInput_' + index)?.click();
  }
  onSubSelect(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.subTracksList.update(list => {
        const newList = [...list];
        newList[index].file = file;
        return newList;
      });
    }
  }

  // ==========================================
  // UPLOAD TRACCE AUDIO E SOTTOTITOLI
  // ==========================================
  private async uploadTrack(file: File): Promise<string> {
    const formData = new FormData();
    // Il nome "track" deve coincidere con multerConfig.uploadMediaTrack.single('track') nel backend
    formData.append('track', file, file.name); 
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // Assicurati che questa rotta esista nel file routes del tuo backend!
    const endpoint = `http://localhost:3000/api/upload/episodes/track`;
    
    const response: any = await firstValueFrom(this.http.post(endpoint, formData, { headers }));
    return response.uri; // Ritorna es: "videos/temp/track_123.mp4" o "videos/temp/track_456.vtt"
  }

  async deleteServerTrack(type: 'audio' | 'subs', lang: string) {
    const alert = await this.alertCtrl.create({
      header: 'Conferma Eliminazione',
      message: `Sei sicuro di voler eliminare la traccia ${type.toUpperCase()} in ${lang.toUpperCase()}? L'azione cancellerà i file dal server e sarà irreversibile.`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: async () => {
            this.isUploading.set(true); // Blocchiamo la modale mentre cancella
            try {
              const token = localStorage.getItem('token');
              const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
              
              // Chiamata HTTP alla tua nuova rotta backend!
              const endpoint = `http://localhost:3000/api/cataloguer/episodes/${this.data.EpisodeID}/tracks/${type}/${lang}`;
              await firstValueFrom(this.http.delete(endpoint, { headers }));

              // Aggiorniamo a caldo i Signal della UI
              if (type === 'audio') {
                this.existingDubs.update(list => list.filter(l => l !== lang));
                this.data.DubLanguages = this.existingDubs().join(','); // Aggiorniamo this.data per coerenza
              } else {
                this.existingSubs.update(list => list.filter(l => l !== lang));
                this.data.SubLanguages = this.existingSubs().join(',');
              }
              
              this.presentToast(`Traccia in ${lang} eliminata con successo!`, 'success');
            } catch (err) {
              console.error("Errore eliminazione traccia:", err);
              this.presentToast("Impossibile eliminare la traccia dal server.", "danger");
            } finally {
              this.isUploading.set(false);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async save() {
    // CONTROLLO 1: Tracce aggiunte ma senza file
    const hasEmptyAudio = this.audioTracksList().some(track => !track.file);
    const hasEmptySub = this.subTracksList().some(track => !track.file);

    if (hasEmptyAudio || hasEmptySub) {
      this.presentToast('Hai aggiunto una traccia ma non hai selezionato il file. Selezionalo o rimuovi la riga col cestino!', 'warning');
      return; // Blocca il salvataggio!
    }

    // CONTROLLO 2: Validazione Form e Video (in creazione)
    if (this.episodeForm.invalid) {
      this.presentToast('Compila tutti i campi obbligatori contrassegnati con l\'asterisco.', 'danger');
      return; // Blocca!
    }

    if (!this.isEditMode && !this.videoFile()) {
      this.presentToast('Devi obbligatoriamente selezionare il file video principale per creare l\'episodio.', 'danger');
      return; // Blocca!
    }
    
    // Se passiamo tutti i controlli, iniziamo a caricare!
    this.isUploading.set(true);

    try {
      // STEP 1: Upload dell'immagine
      let finalThumbURI = this.data?.ThumbnailURI || null;
      if (this.thumbnailFile()) {
        finalThumbURI = await this.uploadThumbnail(this.thumbnailFile()!);
      }

      // STEP 1.5: Upload del file Video Pesante! (Solo se c'è un video selezionato)
      let finalRawVideoURI = null;
      if (this.videoFile()) {
        finalRawVideoURI = await this.uploadRawVideo(this.videoFile()!);
      }

      // STEP 1.8 Final Chapter Prologue: Upload di Audio e Sub
      const uploadedAudioTracks = [];
      for (const track of this.audioTracksList()) {
        if (track.file) {
          const trackUri = await this.uploadTrack(track.file); // Carica su Multer
          uploadedAudioTracks.push({ lang: track.lang, uri: trackUri }); // Salva il percorso
        }
      }

      const uploadedSubTracks = [];
      for (const track of this.subTracksList()) {
        if (track.file) {
          const trackUri = await this.uploadTrack(track.file); 
          uploadedSubTracks.push({ lang: track.lang, uri: trackUri });
        }
      }

      // STEP 2: Raccogliamo testi e assembliamo il Payload 
      const rawValues = this.episodeForm.getRawValue();

      const payload = {
        ...rawValues,
        thumbnailURI: finalThumbURI,
        ...(finalRawVideoURI && { rawVideoURI: finalRawVideoURI }), // Aggiungiamo il video solo se esiste
        audioTracks: uploadedAudioTracks, 
        subTracks: uploadedSubTracks
      };

      // Mandiamo tutto al componente padre che farà la chiamata /add o /modify!
      this.dismiss({ payload, isEdit: this.isEditMode });

    } catch (error) {
      console.error("Errore durante l'upload dei file:", error);
    } finally {
      this.isUploading.set(false);
    }
  }

  async presentToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom',
      cssClass: 'custom-toast' // Opzionale, se hai stili globali
    });
    await toast.present();
  }
}