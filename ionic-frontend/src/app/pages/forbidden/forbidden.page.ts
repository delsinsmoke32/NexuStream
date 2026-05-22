import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonIcon, IonButton, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-forbidden',
  templateUrl: './forbidden.page.html',
  styleUrls: ['./forbidden.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonIcon, IonButton, IonToolbar, CommonModule, FormsModule]
})
export class ForbiddenPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
