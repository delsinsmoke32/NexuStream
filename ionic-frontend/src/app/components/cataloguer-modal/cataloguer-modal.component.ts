import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// 🚀 IMPORTAZIONI STANDALONE CHIRURGICHE DI IONIC
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonTextarea, 
  IonGrid, 
  IonRow, 
  IonCol, 
  ModalController 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-cataloguer-modal',
  templateUrl: './cataloguer-modal.component.html',
  styleUrls: ['./cataloguer-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    // Registriamo singolarmente i componenti Ionic usati nell'HTML della modale
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonContent, 
    IonItem, 
    IonLabel, 
    IonInput, 
    IonTextarea, 
    IonGrid, 
    IonRow, 
    IonCol
  ]
})
export class CataloguerModalComponent implements OnInit {
  @Input() level!: 'shows' | 'seasons' | 'episodes';
  @Input() data: any; // Contiene l'oggetto se siamo in modalità modifica

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);

  cataloguerForm!: FormGroup;
  isEditMode = false;

  ngOnInit() {
    this.isEditMode = !!this.data;
    this.initForm();
  }

  private initForm() {
    const getLangText = (jsonStr: string, lang: string) => {
      try { const obj = JSON.parse(jsonStr); return obj[lang] || ''; } catch { return jsonStr || ''; }
    };

    if (this.level === 'shows') {
      this.cataloguerForm = this.fb.group({
        title_it: [this.isEditMode ? getLangText(this.data.Title, 'it') : '', [Validators.required]],
        description_it: [this.isEditMode ? getLangText(this.data.Description, 'it') : '', [Validators.required]],
        title_en: [this.isEditMode ? getLangText(this.data.Title, 'en') : ''],
        description_en: [this.isEditMode ? getLangText(this.data.Description, 'en') : ''],
        dateStarted: [{ value: this.data?.DateStarted || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required]],
        dateEnded: [this.data?.DateEnded || ''],
        thumbnailURI: [this.data?.ThumbnailURI || ''],
        bannerURI: [this.data?.BannerURI || '']
      });
    } 
    else if (this.level === 'seasons') {
      this.cataloguerForm = this.fb.group({
        title_it: [this.isEditMode ? getLangText(this.data.Title, 'it') : '', [Validators.required]],
        description_it: [this.isEditMode ? getLangText(this.data.Description, 'it') : '', [Validators.required]],
        title_en: [this.isEditMode ? getLangText(this.data.Title, 'en') : ''],
        description_en: [this.isEditMode ? getLangText(this.data.Description, 'en') : ''],
        dateStarted: [{ value: this.data?.DateStarted || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required]],
        dateEnded: [this.data?.DateEnded || ''],
        seasonNumber: [{ value: this.data?.SeasonNumber || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required, Validators.min(1)]]
      });
    } 
    else if (this.level === 'episodes') {
      this.cataloguerForm = this.fb.group({
        title_it: [this.isEditMode ? getLangText(this.data.Title, 'it') : '', [Validators.required]],
        description_it: [this.isEditMode ? getLangText(this.data.Description, 'it') : '', [Validators.required]],
        title_en: [this.isEditMode ? getLangText(this.data.Title, 'en') : ''],
        description_en: [this.isEditMode ? getLangText(this.data.Description, 'en') : ''],
        releaseDate: [{ value: this.data?.ReleaseDate || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required]],
        duration: [{ value: this.data?.Duration || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required, Validators.min(1)]],
        episodeNumber: [{ value: this.data?.EpisodeNumber || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required, Validators.min(1)]],
        thumbnailURI: [this.data?.ThumbnailURI || '']
      });
    }
  }

  dismiss(result?: any) {
    this.modalCtrl.dismiss(result);
  }

  save() {
    if (this.cataloguerForm.invalid) return;
    
    // Includiamo i campi disabilitati per non perdere chiavi primarie/strutturali nel backend
    const rawValues = this.cataloguerForm.getRawValue();
    this.dismiss({ payload: rawValues, isEdit: this.isEditMode });
  }
}