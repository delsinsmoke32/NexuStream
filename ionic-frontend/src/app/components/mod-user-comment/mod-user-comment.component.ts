import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { ModComment } from '../../models/mod';

@Component({
  selector: 'app-mod-user-comment',
  templateUrl: './mod-user-comment.component.html',
  styleUrls: ['./mod-user-comment.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton]
})
export class ModUserCommentComponent {
  @Input({ required: true }) comment!: ModComment;
  
  @Output() toggleApprove = new EventEmitter<ModComment>();
  @Output() toggleHide = new EventEmitter<ModComment>();

  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, eyeOffOutline, eyeOutline });
  }

  onApprove() {
    this.toggleApprove.emit(this.comment);
  }

  onHide() {
    this.toggleHide.emit(this.comment);
  }
}