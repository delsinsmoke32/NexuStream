import { Component, ViewChild, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  searchOutline,
  personCircleOutline,
  settingsOutline,
  heartOutline,
  logOutOutline,
  playCircle,
  informationCircleOutline
} from 'ionicons/icons';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton,
  IonSearchbar, IonButton, IonButtons, IonList, IonItem,
  IonPopover, IonIcon, IonChip, IonLabel, IonSpinner
} from '@ionic/angular/standalone';

// Pipe per le immagini dal backend
import { BackendUrlPipe } from '../../pipes/backend-url-pipe';
import { ShowCardComponent } from '@app/components/show-card/show-card.component';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, BackendUrlPipe,
    IonIcon, IonSearchbar, IonContent, IonHeader, IonTitle,
    IonToolbar, IonButton, IonButtons, IonBackButton,
    IonPopover, IonList, IonItem, IonChip, IonLabel, IonSpinner, ShowCardComponent
  ],
})
export class SearchPage implements OnInit {
  @ViewChild('profilePopover') popover: any;
  
  private http = inject(HttpClient);
  private router = inject(Router);

  // Stati reattivi
  searchQuery = signal<string>('');
  selectedGenre = signal<number | null>(null);
  filteredResults = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  
  // Lista dei generi dal database
  genres = signal<any[]>([]);

  constructor() {
    addIcons({
      alertCircleOutline, searchOutline, personCircleOutline,
      settingsOutline, heartOutline, logOutOutline, playCircle, informationCircleOutline
    });
  }

  ngOnInit() {
    this.loadGenres();
  }

  // 1. Carica i generi disponibili dal backend
  loadGenres() {
    this.http.get<any[]>('api/genres').subscribe({
      next: (res) => this.genres.set(res),
      error: (err) => console.error('Errore nel caricamento dei generi:', err)
    });
  }

  // 2. L'utente digita nella barra di ricerca
  onSearchChange(event: any) {
    this.searchQuery.set(event.detail.value || '');
    this.triggerSearch();
  }

  // 3. L'utente clicca su un genere ("Chip")
  selectGenre(genreId: number | null) {
    // Se clicca sul genere già attivo, lo deseleziona
    if (this.selectedGenre() === genreId) {
      this.selectedGenre.set(null);
    } else {
      this.selectedGenre.set(genreId);
    }
    this.triggerSearch();
  }

  // 4. Esegue la ricerca vera e propria combinando Testo + Genere
  triggerSearch() {
    const q = this.searchQuery().trim();
    const g = this.selectedGenre();

    // Se non c'è né testo né genere, svuotiamo i risultati
    if (!q && !g) {
      this.filteredResults.set([]);
      return;
    }

    this.isLoading.set(true);

    let url = `api/search?q=${encodeURIComponent(q)}`;
    if (g) {
      url += `&genre=${g}`;
    }

    this.http.get<any[]>(url).subscribe({
      next: (risultati) => {
        this.filteredResults.set(risultati);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Errore durante la ricerca:', err);
        this.isLoading.set(false);
      },
    });
  }

  // Navigazione
  openSeriesInfo(showId: string | number, event?: Event) {
    if(event) event.stopPropagation();
    
    // Usa direttamente lo showId passato dall'HTML!
    this.router.navigate(['/shows', showId]); 
  }

  // Menu Profilo
  async openProfileMenu(ev: any) {
    this.popover.event = ev;
    await this.popover.present();
  }
  onPopoverDismiss() {}
  openUserSettings() { this.popover.dismiss(); }
  openFavorites() { this.popover.dismiss(); }
  logout() { this.popover.dismiss(); }
}