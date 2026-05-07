import { Component, OnInit } from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonAvatar,
  IonTextarea,
  IonItem,
} from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { chatbubblesOutline, thumbsUpOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
  imports: [
    IonButton,
    IonIcon,
    IonAvatar,
    IonTextarea,
    IonItem,
    CommonModule,
  ]
})
export class CommentsComponent  implements OnInit {

  public comments = [
    {
      username: "jojolover69",
      time: "2 hours ago",
      text: "idk man jojo is lowk better than ts",
      avatar: "assets/pictures/website_placeholder.webp",
    },
    {
      username: "jjklover420",
      time: "1 hour ago",
      text: "man jojolover shut up, gojo no diffs ur verse",
      avatar: "assets/pictures/website_placeholder.webp",
    }
  ];

  constructor() {
    addIcons({chatbubblesOutline, thumbsUpOutline})
   }

  ngOnInit() {}

}
