import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-discussion-modal',
  templateUrl: './discussion-modal.component.html',
  styleUrls: ['./discussion-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class DiscussionModalComponent implements OnInit {
  @Input() discussion: any; // Riceve i dati se siamo in modalità modifica
  
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);

  discussionForm!: FormGroup;
  isEditMode = false;

  ngOnInit() {
    this.isEditMode = !!this.discussion;

    this.discussionForm = this.fb.group({
      REF_EpisodeID: [
        this.discussion?.REF_EpisodeID || '', 
        this.isEditMode ? [] : [Validators.required, Validators.min(1)]
      ],
      type: [
        this.discussion?.type || 'standard', 
        this.isEditMode ? [] : [Validators.required]
      ],
      closeDate: [
        this.discussion?.closeDate || '', 
        [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)]
      ],
      forceClosed: [this.discussion?.forceClosed === 1] // Converte l'intero 0/1 in booleano per il toggle
    });
  }

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  save() {
    if (this.discussionForm.invalid) return;

    const formRaw = this.discussionForm.value;
    let payload: any;

    if (this.isEditMode) {
      // In modifica mandiamo solo i dati di aggiornamento
      payload = {
        closeDate: formRaw.closeDate,
        forceClosed: formRaw.forceClosed ? 1 : 0
      };
    } else {
      // In creazione mandiamo solo i tre campi richiesti dal backend
      payload = {
        REF_EpisodeID: parseInt(formRaw.REF_EpisodeID, 10), // Forza intero puro
        closeDate: formRaw.closeDate,
        type: formRaw.type
      };
    }

    this.dismiss({ 
      payload, 
      isEdit: this.isEditMode, 
      discussionId: this.discussion?.DiscussionID
    });
  }
}