import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonContent, IonItem, IonLabel, IonInput, IonSelect, 
  IonSelectOption, IonToggle, IonIcon, ModalController 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-discussion-modal',
  templateUrl: './discussion-modal.component.html',
  styleUrls: ['./discussion-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, 
    IonTitle, IonButtons, IonButton, IonContent, IonItem, 
    IonLabel, IonInput, IonSelect, IonSelectOption, IonToggle, IonIcon
  ]
})
export class DiscussionModalComponent implements OnInit {
  @Input() discussion: any; 
  @Input() episodeId!: string | number;
  
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);

  discussionForm!: FormGroup;
  isEditMode = false;

  ngOnInit() {
    this.isEditMode = !!this.discussion;

    this.discussionForm = this.fb.group({
      // Se c'è una discussione usiamo il suo ID, altrimenti l'episodeId passato, altrimenti stringa vuota
      REF_EpisodeID: [
        this.discussion?.['REF EpisodeID'] || this.discussion?.REF_EpisodeID || this.episodeId || '', 
        this.isEditMode ? [] : [Validators.required, Validators.min(1)]
      ],
      type: [
        this.discussion?.Type || this.discussion?.type || 'standard', 
        this.isEditMode ? [] : [Validators.required]
      ],
      closeDate: [
        this.discussion?.CloseDate || this.discussion?.closeDate || '', 
        [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)]
      ],
      forceClosed: [this.discussion?.ForceClosed === 1 || this.discussion?.forceClosed === 1]
    });
  }

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  save() {
    if (this.discussionForm.invalid) return;

    // 🚀 FIX: getRawValue() assicura che venga catturato anche l'ID in sola lettura!
    const formRaw = this.discussionForm.getRawValue(); 
    let payload: any;

    if (this.isEditMode) {
      // Modifica
      payload = {
        closeDate: formRaw.closeDate, 
        forceClosed: formRaw.forceClosed ? 1 : 0,
        type: formRaw.type 
      };
    } else {
      // 🚀 SICUREZZA ANTI-CRASH: Assicuriamoci che non sia NaN
      const epId = parseInt(formRaw.REF_EpisodeID, 10);
      if (isNaN(epId)) {
         console.error("ERRORE: ID Episodio non ricevuto. Controlla il passaggio dati da episode.page.ts!");
         return; // Blocchiamo la chiamata inutile al backend
      }

      // Creazione
      payload = {
        REF_EpisodeID: epId, 
        closeDate: formRaw.closeDate, 
        type: formRaw.type 
      };
    }

    console.log("🚀 PAYLOAD INVIATO AL BACKEND:", payload);

    this.dismiss({ 
      payload, 
      isEdit: this.isEditMode, 
      discussionId: this.discussion?.DiscussionID 
    });
  }
}