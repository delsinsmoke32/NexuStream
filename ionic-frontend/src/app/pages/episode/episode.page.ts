import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon,
  
}  from '@ionic/angular/standalone';
import { CommentsComponent } from '@app/components/comments/comments.component';

@Component({
  selector: 'app-episode',
  templateUrl: './episode.page.html',
  styleUrls: ['./episode.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonRow,
    IonCol,
    IonItem,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonButton,
    CommonModule,
    FormsModule,
    IonLabel,
    IonInput,
    IonIcon,
    CommentsComponent,
  ]
})
export class EpisodePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
