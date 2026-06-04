import { Component, OnInit, Input } from '@angular/core'
import {
    IonButton,
    IonIcon,
    IonAvatar,
    IonTextarea,
    IonItem,
    ToastController
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { chatbubblesOutline, thumbsUp, thumbsUpOutline } from 'ionicons/icons'
import { CommonModule } from '@angular/common'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@lib/@angular/forms'


interface Commento {
  id: number;
  username: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  isLiked?: boolean;
}

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
        FormsModule,
        BackendUrlPipe,
    ],
})
export class CommentsComponent implements OnInit {
    @Input() animeId!: string | null; // Riceve l'ID dalla pagina principale
    comments: Commento[] = [];
    nuovoCommentoTesto: string = ''; // Cattura il testo della ion-textarea
  
    private apiUrl = 'api/comments';
    /*public comments = [
        {
            username: 'jojolover69',
            time: '2 hours ago',
            text: 'idk man jojo is lowk better than ts',
            avatar: 'static/avatars/avatar-001.png',
        },
        {
            username: 'jjklover420',
            time: '1 hour ago',
            text: 'man jojolover shut up, gojo no diffs ur verse',
            avatar: 'static/avatars/avatar-002.png',
        },
    ]*/

    constructor(private http: HttpClient, private toastCtrl: ToastController) {
        addIcons({ chatbubblesOutline, thumbsUpOutline, thumbsUp })
    }

    ngOnInit() {
        if (this.animeId) {
           this.caricaCommenti();
        }
    }
    caricaCommenti() {
    // Chiamata API reale per prendere i commenti di questo anime specifico
    this.http.get<Commento[]>(`${this.apiUrl}?animeId=${this.animeId}`).subscribe({
      next: (res) => this.comments = res,
      error: (err) => console.error("Errore nel caricamento dei commenti", err)
    });
  }

  aggiungiCommento() {
    // Controllo di sicurezza: non inviare se vuoto
    if (!this.nuovoCommentoTesto || this.nuovoCommentoTesto.trim() === ''){
       this.presentToast(
      // Usiamo il $localize per marcare il testo del Toast
      $localize `:@@emptyCommentError:Il commento non può essere vuoto!`,
      'danger'
      );
      return;
    }

    const payload = {
      animeId: this.animeId,
      text: this.nuovoCommentoTesto
    };

    // Inviamo il commento al database backend
    this.http.post<Commento>(this.apiUrl, payload).subscribe({
      next: (nuovoCommentoCreato) => {
        // Trucco di performance: invece di ricaricare tutta la pagina, 
        // "spingiamo" il nuovo commento in cima alla lista locale
        this.comments.unshift(nuovoCommentoCreato);
        
        // Svuotiamo la textarea
        this.nuovoCommentoTesto = '';
      },
      error: (err) => console.error("Errore durante l'invio del commento", err)
    });
  }

  toggleLike(comment: Commento) {
    comment.isLiked = !comment.isLiked;
    if (comment.isLiked) {
      comment.likes++;
      this.http.post(`${this.apiUrl}/${comment.id}`, { likes: comment.likes }).subscribe({ //oppure mettere patch visto che è un aggiornamento
        next: (risposta) => {
             console.log('Like aggiornato sul server!', risposta);
        },
        error: (err) => {
          console.error('Errore durante l\'aggiornamento del like:', err);
        }
      });
    } else {
      comment.likes--;
    }
  }

  rispondiA(username: string) {
    // Tagga automaticamente l'utente nella textarea per iniziare una risposta
    this.nuovoCommentoTesto = `@${username} `;
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 5000, color, position: 'bottom' });
    await toast.present();
  }

}
