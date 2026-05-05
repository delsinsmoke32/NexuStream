import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonRow, IonCol, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonButton, IonItem } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonRow, IonCol, IonItem, IonCardHeader, IonCardContent, IonCardTitle, IonButton, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

  login() {}
  constructor() { }

  ngOnInit() {
  }

}
