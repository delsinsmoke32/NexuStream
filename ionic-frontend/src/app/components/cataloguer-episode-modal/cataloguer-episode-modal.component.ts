import { Component, ElementRef, Input, OnInit, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// IONIC STANDALONE
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
  IonItem, IonLabel, IonInput, IonTextarea, IonGrid, IonRow, IonCol, 
  ModalController, IonIcon, IonText 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { imageOutline, videocamOutline } from 'ionicons/icons';

@Component({
  selector: 'app-cataloguer-episode-modal',
  templateUrl: './cataloguer-episode-modal.component.html',
  styleUrls: ['./cataloguer-episode-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
    IonItem, IonLabel, IonInput, IonTextarea, IonGrid, IonRow, IonCol,
    IonIcon, IonText
  ]
})
export class CataloguerEpisodeModalComponent implements OnInit {
  @Input() data: any; // Dati in modalità modifica
  @Input() seasonId!: number; // Ricevuto dal padre per sapere a quale stagione appartiene

  // ViewChild per l'input dell'immagine
  thumbInput = viewChild.required<ElementRef<HTMLInputElement>>('thumbInput');

  // Signals per l'immagine
  thumbnailFile = signal<File | null>(null);
  thumbnailPreview = signal<string | null>(null);

  isUploading = signal<boolean>(false);

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private http = inject(HttpClient);

  episodeForm!: FormGroup;
  isEditMode = false;

  constructor() {
    addIcons({ imageOutline, videocamOutline });
  }

  ngOnInit() {
    this.isEditMode = !!this.data;
    
    // Inizializza l'anteprima se siamo in modifica e c'è una thumbnail salvata
    if (this.isEditMode && this.data.ThumbnailURI) {
      this.thumbnailPreview.set(`http://localhost:3000/${this.data.ThumbnailURI}`);
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
      
      // Dati strutturali
      releaseDate: [{ value: this.data?.ReleaseDate || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required]],
      duration: [{ value: this.data?.Duration || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required, Validators.min(1)]],
      episodeNumber: [{ value: this.data?.EpisodeNumber || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required, Validators.min(1)]],
      refSeason: [this.seasonId] // Aggiungiamo il riferimento alla stagione
    });
  }

  triggerSelect() {
    this.thumbInput().nativeElement.click();
  }

  onFileSelect(event: Event) {
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

  async save() {
    if (this.episodeForm.invalid) return;
    this.isUploading.set(true);

    try {
      // 1. STEP 1: Upload dell'immagine (se nuova)
      let finalThumbURI = this.data?.ThumbnailURI || null;
      if (this.thumbnailFile()) {
        finalThumbURI = await this.uploadThumbnail(this.thumbnailFile()!);
      }

      // TODO (Future): Qui aggiungeremo il FormData asincrono per Video, Sub e Dub.

      // 2. Raccogliamo i testi
      const rawValues = this.episodeForm.getRawValue();

      // 3. STEP 2: Creiamo il payload finale e chiudiamo la modale
      const payload = {
        ...rawValues,
        thumbnailURI: finalThumbURI
      };

      this.dismiss({ payload, isEdit: this.isEditMode });

    } catch (error) {
      console.error("Errore durante l'upload dell'episodio:", error);
    } finally {
      this.isUploading.set(false);
    }
  }
}