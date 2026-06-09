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
  
  showDelete = input<boolean>(false); // Cestino (Preferiti)
  showDismiss = input<boolean>(false); // X di chiusura (Continua a guardare)

  play = output<any>(); 
  info = output<number>(); 
  remove = output<number>(); 
  dismiss = output<number>(); // Output per il continua a guardare

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

  // Funzione per il click sulla X
  onDismiss(event: Event) {
    event.stopPropagation();
    // Emette l'ID dello Show o dell'Episodio (dipende da come gestisci il backend)
    this.dismiss.emit(this.show().ShowID || this.show().id);
  }
}