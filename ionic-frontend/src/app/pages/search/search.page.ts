import { Component,ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {trendingUpOutline, alertCircleOutline, chatbubbleEllipsesOutline, searchOutline, personCircleOutline, settingsOutline, heartOutline, logOutOutline} from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonSearchbar, IonButton, IonButtons, IonList, IonItem, IonPopover, IonIcon } from '@ionic/angular/standalone';



@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [IonIcon, IonSearchbar, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonBackButton, IonPopover, IonList, IonItem, CommonModule, FormsModule, RouterModule]
})
export class SearchPage implements OnInit {
// Usiamo ViewChild per accedere al popover definito nel template con #profilePopover
  @ViewChild('profilePopover') popover: any;
  searchQuery: string = "";
  // Array filtrato che mostriamo a schermo
  filteredResults: any[] = [];
  constructor(private http: HttpClient, private router: Router) { 
    addIcons({ trendingUpOutline, alertCircleOutline, chatbubbleEllipsesOutline, searchOutline, personCircleOutline, settingsOutline, heartOutline, logOutOutline });
  }

  ngOnInit() {
    
  }
  cercaSerie(testoDigitato:any){
    const url = `http://localhost:8100/api/search?q=${testoDigitato}`
    return this.http.get<any[]>(url);
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value;

    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredResults = [];
      return;
    }

    // 4. Chiami la funzione interna usando "this." e ti iscrivi al risultato
    this.cercaSerie(this.searchQuery).subscribe({
      next: (risultati) => {
        this.filteredResults = risultati;
      },
      error: (err) => {
        console.error('Errore durante la ricerca:', err);
      }
    });
  }

  goToSerie(anime:any){
    this.router.navigate(['/serie', anime.id]);

  }

  // Funzione per aprire il menu a tendina del profilo
  async openProfileMenu(ev: any) {
    // Passiamo l'evento 'ev' così il popover sa di dover apparire vicino al tasto cliccato
    this.popover.event = ev;
    await this.popover.present();
  }
 // Funzione chiamata dal (didDismiss)
  onPopoverDismiss() {
    console.log('Il menu profilo è stato chiuso');
  }

  // Azioni del menu profilo
  openUserSettings() {
    console.log('Apro le impostazioni...');
    this.popover.dismiss();
  }

  openFavorites() {
    console.log('Apro i preferiti...');
    this.popover.dismiss();
  }

 logout() {
    console.log('Eseguo il logout...');
    this.popover.dismiss();
  }
}
