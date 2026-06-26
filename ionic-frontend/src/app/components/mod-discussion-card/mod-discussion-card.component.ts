import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { optionsOutline, trashOutline } from 'ionicons/icons';
import { ModDiscussion } from '../../models/mod'; // Aggiusta il percorso!

@Component({
  selector: 'app-mod-discussion-card',
  templateUrl: './mod-discussion-card.component.html',
  styleUrls: ['./mod-discussion-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class ModDiscussionCardComponent {
  @Input({ required: true }) disc!: ModDiscussion;
  
  @Output() edit = new EventEmitter<ModDiscussion>();
  @Output() delete = new EventEmitter<number>();

  constructor() {
    addIcons({ optionsOutline, trashOutline });
  }

  onEdit() {
    this.edit.emit(this.disc);
  }

  onDelete() {
    this.delete.emit(this.disc.DiscussionID);
  }

  isDiscussionClosed(disc: ModDiscussion): boolean {
    // Se è stata chiusa forzatamente da un mod
    if (disc.ForceClosed === 1) return true;

    // Se c'è una data di scadenza, controlliamo se è nel passato
    if (disc.CloseDate) {
        const expirationDate = new Date(disc.CloseDate).getTime();
        const now = new Date().getTime();
        return now > expirationDate;
    }

    return false;
  }

  parseLang(jsonStr?: string, lang: string = 'it'): string {
    if (!jsonStr) return 'Titolo non disponibile';
    try {
      const obj = JSON.parse(jsonStr);
      return obj[lang] || obj['en'] || 'Titolo non disponibile';
    } catch {
      return jsonStr;
    }
  }
}