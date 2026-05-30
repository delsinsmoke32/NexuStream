import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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
  IonSegment,
  IonSegmentButton,
  IonAccordionGroup,
  IonAccordion,
  IonSearchbar,
  IonSpinner,
  ModalController, 
  ToastController,
  ActionSheetController
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
    FormsModule,
    DiscussionModalComponent, 
    BackendUrlPipe,
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
    IonSegment,
    IonSegmentButton,
    IonAccordionGroup,
    IonAccordion,
    IonSearchbar,
    IonSpinner
  ]
})
export class ModPage implements OnInit {
  private http = inject(HttpClient);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private actionSheetCtrl = inject(ActionSheetController);

  private apiUrl = 'api/mod'; 
  
  // Tab attive: 'discussions' | 'users'
  currentTab = signal<string>('discussions');
  
  // Segnali Discussioni
  discussions = signal<any[]>([]);
  showClosed = signal<number>(0); 

  // Segnali Utenti
  usersList = signal<any[]>([]);
  searchQuery = signal<string>('');
  userPage = signal<number>(1);
  userLimit = signal<number>(50);

  ngOnInit() {
    this.loadDiscussions();
  }

  // Switch dei Segment/Tab
  segmentChanged(event: any) {
    const tab = event.detail.value;
    this.currentTab.set(tab);
    if (tab === 'discussions') {
      this.loadDiscussions();
    } else {
      this.loadUsersList();
    }
  }

  // 📂 LOGICA DISCUSSIONI
  loadDiscussions() {
    this.http.get<any[]>(`${this.apiUrl}/discussions?showClosed=${this.showClosed()}`)
      .subscribe({
        next: (data) => this.discussions.set(data),
        error: () => this.showToast('Errore nel recupero delle discussioni', 'danger')
      });
  }

  toggleFilter(event: any) {
    this.showClosed.set(event.detail.checked ? 1 : 0);
    this.loadDiscussions();
  }

  async openCreateModal() {
    const modal = await this.modalCtrl.create({
      component: DiscussionModalComponent
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.http.post(`${this.apiUrl}/discussions`, data.payload).subscribe({
        next: () => {
          this.showToast('Nuova discussione creata con successo', 'success');
          this.loadDiscussions();
        },
        error: (err) => this.showToast(err.error?.message || 'Errore in creazione', 'danger')
      });
    }
  }

  async openEditModal(discussion: any) {
    const modal = await this.modalCtrl.create({
      component: DiscussionModalComponent,
      componentProps: { discussion }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.http.patch(`${this.apiUrl}/discussions/${data.discussionId}`, data.payload).subscribe({
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
      this.http.delete(`${this.apiUrl}/discussions/${id}`).subscribe({
        next: () => {
          this.showToast('Discussione eliminata permanentemente', 'success');
          this.loadDiscussions();
        },
        error: () => this.showToast('Errore durante l\'eliminazione', 'danger')
      });
    }
  }

  // 📂 LOGICA UTENTI
  loadUsersList() {
    let url = `${this.apiUrl}/users?page=${this.userPage()}&limit=${this.userLimit()}`;
    if (this.searchQuery().trim()) {
      url += `&search=${encodeURIComponent(this.searchQuery().trim())}`;
    }

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        // Prepariamo il campo comments a null per gestire il caricamento on-demand (lazy)
        this.usersList.set(data.map(u => ({ ...u, comments: null })));
      },
      error: () => this.showToast('Errore nel caricamento della lista utenti', 'danger')
    });
  }

  handleSearch(event: any) {
    this.searchQuery.set(event.detail.value || '');
    this.userPage.set(1); // Resetta alla prima pagina ad ogni ricerca
    this.loadUsersList();
  }

  // Intercetta l'apertura della singola scheda utente per caricare i commenti in modalità lazy
  onUserAccordionChange(event: any) {
    const openedUserId = event.detail.value;
    if (!openedUserId) return;

    const currentUsers = this.usersList();
    const user = currentUsers.find(u => u.UserID.toString() === openedUserId);

    // Eseguiamo la GET solo se i commenti non sono già stati caricati in precedenza
    if (user && user.comments === null) {
      this.http.get<any[]>(`${this.apiUrl}/users/${openedUserId}/comments`).subscribe({
        next: (commentsData) => {
          user.comments = commentsData;
          this.usersList.set([...currentUsers]); // Mutazione per aggiornare la UI
        },
        error: () => {
          this.showToast('Impossibile scaricare la cronologia commenti', 'danger');
          user.comments = []; // Sblocca lo spinner indicando una lista vuota forzata
          this.usersList.set([...currentUsers]);
        }
      });
    }
  }

  // Interfaccia d'azione per il Ban
  async openBanActionSheet(user: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: `Restringi permessi di commento per: ${user.Username}`,
      mode: 'md',
      buttons: [
        { text: 'Sanzione Temporanea - 3 Giorni', role: 'destructive', handler: () => this.executeBan(user.UserID, 3) },
        { text: 'Sanzione Temporanea - 7 Giorni', role: 'destructive', handler: () => this.executeBan(user.UserID, 7) },
        { text: 'Sanzione Permanente - Indefinita', role: 'destructive', handler: () => this.executeBan(user.UserID, 0) }, // Passato 0 coerente con express-validator
        { text: 'Annulla', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  executeBan(targetUserId: number, durationDays: number) {
    const payload = { targetUserId, durationDays };
    if (durationDays == undefined) durationDays = 0;
    // Passiamo l'ID anche nel path per rispettare la configurazione delle rotte del backend (/users/:userId/ban)
    this.http.post(`${this.apiUrl}/users/${targetUserId}/ban`, payload).subscribe({
      next: (res: any) => {
        this.showToast(res.message || 'Sanzione applicata con successo', 'success');
        this.refreshSingleUserStatus(targetUserId);
      },
      error: (err) => this.showToast(err.error?.error || 'Errore durante l\'applicazione del ban', 'danger')
    });
  }

  executeUnban(user: any) {
    const payload = { targetUserId: user.UserID };
    this.http.post(`${this.apiUrl}/users/${user.UserID}/unban`, payload).subscribe({
      next: (res: any) => {
        this.showToast(res.message || 'Restrizione revocata. Utente riabilitato.', 'success');
        this.refreshSingleUserStatus(user.UserID);
      },
      error: (err) => this.showToast(err.error?.error || 'Errore durante la revoca del ban', 'danger')
    });
  }

  // Aggiorna lo stato visivo locale della singola card senza distruggere e ricaricare l'intera griglia
  private refreshSingleUserStatus(userId: number) {
    this.http.get<any[]>(`${this.apiUrl}/users?page=1&limit=100`).subscribe({
      next: (data) => {
        const freshData = data.find(u => u.UserID === userId);
        if (freshData) {
          const updatedUsers = this.usersList().map(u => {
            if (u.UserID === userId) {
              return { ...u, canComment: freshData.canComment, BannedUntil: freshData.BannedUntil };
            }
            return u;
          });
          this.usersList.set(updatedUsers);
        }
      }
    });
  }

  parseLang(jsonStr: string, lang: string = 'it'): string {
    try {
      const obj = JSON.parse(jsonStr);
      return obj[lang] || obj['en'] || 'Titolo non disponibile';
    } catch {
      return jsonStr; 
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
  }
}