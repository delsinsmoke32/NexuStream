import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// IONIC STANDALONE (Solo i componenti testuali/layout necessari)
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
  IonItem, IonLabel, IonInput, IonTextarea, IonGrid, IonRow, IonCol, 
  ModalController 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-cataloguer-season-modal',
  templateUrl: './cataloguer-season-modal.component.html',
  styleUrls: ['./cataloguer-season-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
    IonItem, IonLabel, IonInput, IonTextarea, IonGrid, IonRow, IonCol
  ]
})
export class CataloguerSeasonModalComponent implements OnInit {
  @Input() data: any; // Contiene l'oggetto se siamo in modalità modifica
  @Input() autoSeasonNumber!: number; // Numero stagione autogenerato, passato con componentProps

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);

  seasonForm!: FormGroup;
  isEditMode = false;

  ngOnInit() {
    this.isEditMode = !!this.data;
    this.initForm();
  }

  private initForm() {
    const getLangText = (jsonStr: string, lang: string) => {
      try { const obj = JSON.parse(jsonStr); return obj[lang] || ''; } catch { return jsonStr || ''; }
    };

    this.seasonForm = this.fb.group({
      // Testi IT (Obbligatori)
      title_it: [this.isEditMode ? getLangText(this.data.Title, 'it') : '', [Validators.required]],
      description_it: [this.isEditMode ? getLangText(this.data.Description, 'it') : '', [Validators.required]],
      
      // Testi EN (Opzionali)
      title_en: [this.isEditMode ? getLangText(this.data.Title, 'en') : ''],
      description_en: [this.isEditMode ? getLangText(this.data.Description, 'en') : ''],
      
      // Dati Strutturali (Disabilitati in modifica per evitare conflitti DB)
      dateStarted: [{ value: this.data?.DateStarted || '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required]],
      dateEnded: [this.data?.DateEnded || ''],
      seasonNumber: [{ 
          value: this.data?.SeasonNumber || this.autoSeasonNumber, 
          disabled: true 
      }],
    });
  }

  dismiss(result?: any) {
    this.modalCtrl.dismiss(result);
  }

  save() {
    if (this.seasonForm.invalid) return;
    
    // Includiamo i campi disabilitati (come seasonNumber) estraendoli con getRawValue()
    const rawValues = this.seasonForm.getRawValue();
    
    // Passiamo tutto al genitore che farà la singola chiamata POST/PUT
    this.dismiss({ payload: rawValues, isEdit: this.isEditMode });
  }
}