import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonButton, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.page.html',
  styleUrls: ['./notfound.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonButton, IonIcon, IonToolbar, CommonModule, FormsModule]
})
export class NotfoundPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
