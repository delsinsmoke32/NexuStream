import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, informationCircleOutline, trash, close } from 'ionicons/icons';
import { BackendUrlPipe } from '../../pipes/backend-url-pipe';

@Component({
  selector: 'app-show-card',
  templateUrl: './show-card.component.html',
  styleUrls: ['./show-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, BackendUrlPipe]
})
export class ShowCardComponent {
  show = input.required<any>();
  layout = input<'portrait' | 'landscape'>('portrait');
  
  showDelete = input<boolean>(false);
  showDismiss = input<boolean>(false);

  play = output<any>(); 
  info = output<number>(); 
  remove = output<number>(); 
  dismiss = output<number>();

  constructor() {
    addIcons({ playCircle, informationCircleOutline, trash, close });
  }

  onPlay(event: Event) {
    event.stopPropagation();
    this.play.emit(this.show());
  }

  onInfo(event: Event) {
    event.stopPropagation();
    this.info.emit(this.show().ShowID || this.show().id);
  }

  onRemove(event: Event) {
    event.stopPropagation();
    this.remove.emit(this.show().ShowID || this.show().id);
  }

  onDismiss(event: Event) {
    event.stopPropagation();
    this.dismiss.emit(this.show().ShowID || this.show().id);
  }

  parseLang(jsonStr?: string, lang: string = 'it'): string {
    const fallback = $localize`:@@showCard_titleUnavailable:Titolo non disponibile`;
    if (!jsonStr) return fallback;
    try {
      const obj = JSON.parse(jsonStr);
      return obj[lang] || obj['en'] || 'Titolo non disponibile';
    } catch {
      return jsonStr; // Se è già una stringa normale
    }
  }
}