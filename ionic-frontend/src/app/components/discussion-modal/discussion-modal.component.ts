import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonContent, IonItem, IonLabel, IonInput, IonSelect, 
  IonSelectOption, IonToggle, IonIcon, ModalController, ToastController 
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';


import { DiscussionPayload, ModDiscussion } from '../../models/mod';

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
  @Input() discussion?: ModDiscussion; 
  @Input() episodeId?: string | number;

  hasProvidedEpisodeId = false;
  
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  discussionForm!: FormGroup;
  isEditMode = false;

  constructor() {
    addIcons({saveOutline});
  }

  ngOnInit() {
    this.isEditMode = !!this.discussion;

    this.hasProvidedEpisodeId = !!this.episodeId || !!this.discussion;

    this.discussionForm = this.fb.group({
      REF_EpisodeID: [
        this.discussion?.['REF EpisodeID'] || this.discussion?.['REF_EpisodeID'] || this.episodeId || '', 
        this.isEditMode ? [] : [Validators.required, Validators.min(1)]
      ],
      type: [
        this.discussion?.Type || this.discussion?.['type'] || 'standard', 
        this.isEditMode ? [] : [Validators.required]
      ],
      closeDate: [
          this.discussion?.CloseDate || this.discussion?.['closeDate'] || this.getDefaultCloseDate(), 
          [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/)]
      ],
      
      forceClosed: [this.discussion?.ForceClosed === 1 || this.discussion?.['forceClosed'] === 1]
    });
  }

  private getDefaultCloseDate(): string {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14); 

    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    const hours = String(futureDate.getHours()).padStart(2, '0');
    const minutes = String(futureDate.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  save() {
    if (this.discussionForm.invalid) {
      this.presentToast($localize`:@@discModal_invalidForm:Compila correttamente tutti i campi obbligatori.`, 'danger');
      return;
    }

    const formRaw = this.discussionForm.getRawValue(); 
    let payload: DiscussionPayload;

    if (this.isEditMode) {
      payload = {
        closeDate: formRaw.closeDate, 
        forceClosed: formRaw.forceClosed ? 1 : 0,
        type: formRaw.type 
      };
    } else {
      const epId = parseInt(formRaw.REF_EpisodeID, 10);
      if (isNaN(epId)) {
    
         this.presentToast($localize`:@@discModal_errId:ID Episodio non valido.`, 'danger');
         return; 
      }

      payload = {
        REF_EpisodeID: epId, 
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

  private async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}