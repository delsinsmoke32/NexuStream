import { Component, OnInit, ViewChild } from '@angular/core';
import { addIcons } from 'ionicons';
import { trash, heartDislikeOutline, personCircleOutline, settingsOutline, heartOutline, logOutOutline } from 'ionicons/icons';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, IonPopover,IonGrid, IonBackButton, IonButtons, IonRouterLink, IonRow, IonCol, IonItem, IonList } from '@ionic/angular/standalone';

@Component({
  selector: 'app-favourites',
  templateUrl: './favourites.page.html',
  styleUrls: ['./favourites.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar,IonIcon, IonButton, IonGrid,IonPopover, IonButtons, IonBackButton,IonRouterLink, IonRow, IonCol,IonList, IonItem, RouterModule, CommonModule, FormsModule]
})
export class FavouritesPage implements OnInit {
   @ViewChild('profilePopover') popover: any;
  // Array di anime preferiti (Dati mockati, pronti per essere sostituiti da un servizio)
  favorites = [
    { id: 1, title: 'Attack on Titan', posterUrl: 'assets/imgs/aot.jpg' },
    { id: 2, title: 'Jujutsu Kaisen', posterUrl: 'assets/imgs/jjk.jpg' },
    { id: 3, title: 'Demon Slayer', posterUrl: 'assets/imgs/ds.jpg' },
    { id: 4, title: 'Frieren', posterUrl: 'assets/imgs/frieren.jpg' }
  ];

  constructor() { addIcons({ trash, heartDislikeOutline, personCircleOutline, settingsOutline, heartOutline, logOutOutline });}

  ngOnInit() {
    // Qui andrà la logica per recuperare i preferiti dal database o dal localStorage
  }
  // Funzione per rimuovere un anime dalla lista
  removeFromFavorites(id: number, event: Event) {
    // stopPropagation evita che il click sul cestino attivi anche il routerLink del dettaglio anime
    event.stopPropagation();
    
    // Filtra l'array escludendo l'anime con l'id selezionato
    this.favorites = this.favorites.filter(anime => anime.id !== id);
    
    console.log(`Anime con ID ${id} rimosso dai preferiti.`);
    // Qui andrà la chiamata al tuo servizio/backend per aggiornare i dati reali
  }
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
