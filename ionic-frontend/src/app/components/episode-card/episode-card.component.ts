import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, informationCircleOutline } from 'ionicons/icons'; //  Aggiunta l'icona Info
import { BackendUrlPipe } from '../../pipes/backend-url-pipe';

@Component({
  selector: 'app-episode-card',
  templateUrl: './episode-card.component.html',
  styleUrls: ['./episode-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, BackendUrlPipe]
})
export class EpisodeCardComponent {
  @Input() episode!: any;
  @Output() play = new EventEmitter<number>();
  @Output() info = new EventEmitter<number>(); //  Nuovo evento per il tasto Info

  constructor() {
    addIcons({ playCircle, informationCircleOutline });
  }

  onPlay(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.episode && this.episode.EpisodeID) {
      this.play.emit(this.episode.EpisodeID);
    }
  }

  onInfo(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.episode && this.episode.EpisodeID) {
      this.info.emit(this.episode.EpisodeID);
    }
  }
}