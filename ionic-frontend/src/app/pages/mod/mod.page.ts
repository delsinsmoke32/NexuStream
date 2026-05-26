import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

// 🚀 IMPORTAZIONI STANDALONE CHIRURGICHE
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonToggle, 
  IonIcon,
  ModalController, 
  ToastController 
} from '@ionic/angular/standalone';

import { DiscussionModalComponent } from '../../components/discussion-modal/discussion-modal.component';
import { BackendUrlPipe } from '../../pipes/backend-url-pipe';

@Component({
  selector: 'app-mod',
  templateUrl: './mod.page.html',
  styleUrls: ['./mod.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    DiscussionModalComponent, 
    BackendUrlPipe,
    // 🚀 Registriamo singolarmente i componenti Ionic usati nell'HTML
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonContent, 
    IonItem, 
    IonLabel, 
    IonToggle, 
    IonIcon
  ]
})
export class ModPage implements OnInit {
  private http = inject(HttpClient);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  // L'interceptor intercetta questo percorso relativo e inietta automaticamente host, porta e Token Bearer
  private apiUrl = 'api/mod/discussions'; 
  
  discussions = signal<any[]>([]);
  showClosed = signal<number>(0); // 0 = Solo attive, 1 = Tutte

  ngOnInit() {
    this.loadDiscussions();
  }

  loadDiscussions() {
    this.http.get<any[]>(`${this.apiUrl}?showClosed=${this.showClosed()}`)
      .subscribe({
        next: (data) => this.discussions.set(data),
        error: () => this.showToast('Errore nel recupero delle discussioni', 'danger')
      });
  }

  toggleFilter(event: any) {
    this.showClosed.set(event.detail.checked ? 1 : 0);
    this.loadDiscussions();
  }

  // Apre la modale globale in modalità CREAZIONE
  async openCreateModal() {
    const modal = await this.modalCtrl.create({
      component: DiscussionModalComponent
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.http.post(this.apiUrl, data.payload).subscribe({
        next: () => {
          this.showToast('Nuova discussione creata con successo', 'success');
          this.loadDiscussions();
        },
        error: (err) => this.showToast(err.error?.message || 'Errore in creazione', 'danger')
      });
    }
  }

  // Apre la modale globale in modalità MODIFICA passando la discussione selezionata
  async openEditModal(discussion: any) {
    const modal = await this.modalCtrl.create({
      component: DiscussionModalComponent,
      componentProps: { discussion }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.http.patch(`${this.apiUrl}/${data.discussionId}`, data.payload).subscribe({
        next: () => {
          this.showToast('Discussione aggiornata con successo', 'success');
          this.loadDiscussions();
        },
        error: () => this.showToast('Errore durante l\'aggiornamento', 'danger')
      });
    }
  }

  deleteDiscussion(id: number) {
    if (confirm('Sei sicuro di voler eliminare questa discussione? L\'azione cancellerà tutti i commenti collegati.')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          this.showToast('Discussione eliminata permanentemente', 'success');
          this.loadDiscussions();
        },
        error: () => this.showToast('Errore durante l\'eliminazione', 'danger')
      });
    }
  }

  // Helper per il parsing sicuro delle stringhe JSON dei titoli multilingua (IT/EN)
  parseLang(jsonStr: string, lang: string = 'it'): string {
    try {
      const obj = JSON.parse(jsonStr);
      return obj[lang] || obj['en'] || 'Titolo non disponibile';
    } catch {
      return jsonStr; // Ritorna la stringa pura se non è un JSON valido
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
  }
}