import { Component, ElementRef, Input, OnInit, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList,
  IonItem, IonLabel, IonInput, IonTextarea, IonGrid, IonRow, IonCol, AlertController,
  ModalController, IonIcon, IonText, IonSelect, IonSelectOption, ToastController, IonSpinner 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
// 🚀 Aggiunta l'icona timeOutline per la sezione marker
import { imageOutline, videocamOutline, documentTextOutline, addCircleOutline, trashOutline, informationCircleOutline, checkmarkCircle, musicalNotesOutline, textOutline, volumeHighOutline, timeOutline } from 'ionicons/icons'; 

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
  @Input() data: any; 
  @Input() seasonId!: number; 
  @Input() autoEpisodeNumber!: number; 

  thumbInput = viewChild.required<ElementRef<HTMLInputElement>>('thumbInput');
  videoInput = viewChild<ElementRef<HTMLInputElement>>('videoInput'); 

  thumbnailFile = signal<File | null>(null);
  thumbnailPreview = signal<string | null>(null);

  videoFile = signal<File | null>(null);
  videoFileName = signal<string | null>(null); 
  audioTracksList = signal<{lang: string, file: File | null}[]>([]);
  subTracksList = signal<{lang: string, file: File | null}[]>([]);
  existingDubs = signal<string[]>([]);
  existingSubs = signal<string[]>([]);

  // 🚀 SIGNAL PER I MARKER TEMPORALI
  markersList = signal<{StartTime: number | null, EndTime: number | null, Type: string}[]>([]);

  isUploading = signal<boolean>(false);

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  episodeForm!: FormGroup;
  isEditMode = false;

  constructor() {
    addIcons({imageOutline,documentTextOutline,videocamOutline,informationCircleOutline,addCircleOutline,trashOutline, checkmarkCircle, musicalNotesOutline, textOutline, volumeHighOutline, timeOutline});
  }

  ngOnInit() {
    this.isEditMode = !!this.data;
    
    if (this.isEditMode) {
      if (this.data.ThumbnailURI) this.thumbnailPreview.set(`http://localhost:3000/${this.data.ThumbnailURI}`);
      
      this.existingDubs.set(this.data.DubLanguages ? this.data.DubLanguages.split(',') : ['it']);
      this.existingSubs.set(this.data.SubLanguages ? this.data.SubLanguages.split(',') : []);

      // 🚀 RECUPERO DEI MARKER ESISTENTI DAL BACKEND
      this.fetchExistingMarkers();
    }

    this.initForm();
  }

  // 🚀 FUNZIONE PER RECUPERARE I MARKER
  private fetchExistingMarkers() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>(`http://localhost:3000/api/cataloguer/episodes/${this.data.EpisodeID}/times`, { headers })
      .subscribe({
        next: (times) => {
          if (times && times.length > 0) {
            this.markersList.set(times);
          }
        },
        error: (err) => console.error("Errore nel recupero dei tempi dell'episodio", err)
      });
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

  triggerThumbSelect() { this.thumbInput().nativeElement.click(); }
  triggerVideoSelect() { const vInput = this.videoInput(); if (vInput) vInput.nativeElement.click(); }

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
  
  onVideoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.videoFile.set(file);
      this.videoFileName.set(file.name);

      const videoNode = document.createElement('video');
      videoNode.preload = 'metadata';
      videoNode.src = URL.createObjectURL(file);
      videoNode.onloadedmetadata = () => {
        const durationInSeconds = Math.round(videoNode.duration);
        this.episodeForm.patchValue({ duration: durationInSeconds });
        URL.revokeObjectURL(videoNode.src); 
      };
    }
  }

  dismiss(result?: any) { this.modalCtrl.dismiss(result); }

  private async uploadThumbnail(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('thumbnail', file, file.name);
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `http://localhost:3000/api/upload/episode_thumbnails`;
    const response: any = await firstValueFrom(this.http.post(endpoint, formData, { headers }));
    return response.uri;
  }

  private async uploadRawVideo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('video_file', file, file.name); 
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `http://localhost:3000/api/upload/episodes/video/raw`;
    const response: any = await firstValueFrom(this.http.post(endpoint, formData, { headers }));
    return response.uri; 
  }

  // --- AUDIO ---
  addAudioTrack() { this.audioTracksList.update(list => [...list, { lang: 'it', file: null }]); }
  removeAudioTrack(index: number) { this.audioTracksList.update(list => list.filter((_, i) => i !== index)); }
  triggerAudioSelect(index: number) { document.getElementById('audioInput_' + index)?.click(); }
  onAudioSelect(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.audioTracksList.update(list => { const newList = [...list]; newList[index].file = file; return newList; });
    }
  }

  // --- SUB ---
  addSubTrack() { this.subTracksList.update(list => [...list, { lang: 'it', file: null }]); }
  removeSubTrack(index: number) { this.subTracksList.update(list => list.filter((_, i) => i !== index)); }
  triggerSubSelect(index: number) { document.getElementById('subInput_' + index)?.click(); }
  onSubSelect(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.subTracksList.update(list => { const newList = [...list]; newList[index].file = file; return newList; });
    }
  }

  // 🚀 --- MARKERS TEMPORALI ---
  addMarker() {
    this.markersList.update(list => [...list, { StartTime: null, EndTime: null, Type: 'intro' }]);
  }
  removeMarker(index: number) {
    this.markersList.update(list => list.filter((_, i) => i !== index));
  }

  private async uploadTrack(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('track', file, file.name); 
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `http://localhost:3000/api/upload/episodes/track`;
    const response: any = await firstValueFrom(this.http.post(endpoint, formData, { headers }));
    return response.uri; 
  }

  async deleteServerTrack(type: 'audio' | 'subs', lang: string) {
    const alert = await this.alertCtrl.create({
      header: 'Conferma Eliminazione',
      message: `Sei sicuro di voler eliminare la traccia ${type.toUpperCase()} in ${lang.toUpperCase()}?`,
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        {
          text: 'Elimina',
          role: 'destructive',
          handler: async () => {
            this.isUploading.set(true); 
            try {
              const token = localStorage.getItem('token');
              const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
              const endpoint = `http://localhost:3000/api/cataloguer/episodes/${this.data.EpisodeID}/tracks/${type}/${lang}`;
              await firstValueFrom(this.http.delete(endpoint, { headers }));

              if (type === 'audio') {
                this.existingDubs.update(list => list.filter(l => l !== lang));
                this.data.DubLanguages = this.existingDubs().join(','); 
              } else {
                this.existingSubs.update(list => list.filter(l => l !== lang));
                this.data.SubLanguages = this.existingSubs().join(',');
              }
              this.presentToast(`Traccia eliminata!`, 'success');
            } catch (err) {
              this.presentToast("Impossibile eliminare la traccia.", "danger");
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
    const hasEmptyAudio = this.audioTracksList().some(track => !track.file);
    const hasEmptySub = this.subTracksList().some(track => !track.file);

    if (hasEmptyAudio || hasEmptySub) {
      this.presentToast('Hai aggiunto una traccia ma non hai selezionato il file.', 'warning');
      return; 
    }

    if (this.episodeForm.invalid) {
      this.presentToast('Compila tutti i campi obbligatori.', 'danger');
      return; 
    }

    if (!this.isEditMode && !this.videoFile()) {
      this.presentToast('Devi selezionare il file video principale.', 'danger');
      return; 
    }

    // 🚀 CONTROLLO VALIDITÀ MARKER
    const currentMarkers = this.markersList();
    for (const marker of currentMarkers) {
      if (marker.StartTime === null || marker.EndTime === null || marker.StartTime >= marker.EndTime || marker.StartTime < 0) {
        this.presentToast('Errore nei Marker: i tempi non possono essere vuoti e la Fine deve essere maggiore dell\'Inizio.', 'warning');
        return;
      }
    }
    
    this.isUploading.set(true);

    try {
      let finalThumbURI = this.data?.ThumbnailURI || null;
      if (this.thumbnailFile()) finalThumbURI = await this.uploadThumbnail(this.thumbnailFile()!);

      let finalRawVideoURI = null;
      if (this.videoFile()) finalRawVideoURI = await this.uploadRawVideo(this.videoFile()!);

      const uploadedAudioTracks = [];
      for (const track of this.audioTracksList()) {
        if (track.file) {
          const trackUri = await this.uploadTrack(track.file); 
          uploadedAudioTracks.push({ lang: track.lang, uri: trackUri }); 
        }
      }

      const uploadedSubTracks = [];
      for (const track of this.subTracksList()) {
        if (track.file) {
          const trackUri = await this.uploadTrack(track.file); 
          uploadedSubTracks.push({ lang: track.lang, uri: trackUri });
        }
      }

      const rawValues = this.episodeForm.getRawValue();

      const payload = {
        ...rawValues,
        thumbnailURI: finalThumbURI,
        ...(finalRawVideoURI && { rawVideoURI: finalRawVideoURI }), 
        audioTracks: uploadedAudioTracks, 
        subTracks: uploadedSubTracks,
        times: currentMarkers // 🚀 INIETTIAMO I MARKER NEL PAYLOAD PER IL PADRE
      };

      this.dismiss({ payload, isEdit: this.isEditMode });

    } catch (error) {
      console.error("Errore durante l'upload:", error);
    } finally {
      this.isUploading.set(false);
    }
  }

  async presentToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'bottom' });
    await toast.present();
  }
}