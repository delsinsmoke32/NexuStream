import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { star, starOutline, searchOutline, personCircleOutline, settingsOutline, heartOutline, logOutOutline, playCircle } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonPopover,IonList,IonItem } from '@ionic/angular/standalone';

interface Episodio {
  numero: string;
  titolo: string;
}

interface Anime {
  titolo: string;
  copertina: string;
  numEpisodi: number;
  durata: string;
  trama: string;
  stato: string;
  isPreferito: boolean;
  episodi: Episodio[];
}

@Component({
  selector: 'app-serie',
  templateUrl: './serie.page.html',
  styleUrls: ['./serie.page.scss'],
  standalone: true,
  imports: [IonButton, IonIcon,IonPopover,IonList,IonItem, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, RouterModule, CommonModule, FormsModule]
})
export class SeriePage implements OnInit {
// Usiamo ViewChild per accedere al popover definito nel template con #profilePopover
  @ViewChild('profilePopover') popover: any;
  constructor() {
    
    addIcons({star, searchOutline, starOutline, personCircleOutline, settingsOutline, heartOutline, logOutOutline, playCircle});
  }
  animeData!: Anime;

  ngOnInit() {
    // Simulazione del caricamento dati (es. da un servizio API)
    this.animeData = {
      titolo: 'My Hero Academia ITA',
      copertina: '', // Sostituisci con il tuo percorso o URL reale
      numEpisodi: 25,
      durata: '24 minuti',
      trama: 'Izuku Midoriya, uno studente delle scuole medie, ha sempre sognato di diventare un hero un giorno di entrare, ispirato soprattutto da All Might, l\'hero più potente e simbolo della pace.',
      stato: 'Conclusa',
      isPreferito: false, // Stato iniziale della stellina
      episodi: [
        { numero: '01', titolo: 'Mydoriya Izuku: le origini' },
        { numero: '02', titolo: 'Esame di ammissione' },
        { numero: '03', titolo: 'Un costume fantastico' },
        // Aggiungi qui gli altri episodi...
      ]
    };
  }

  // Funzione per attivare/disattivare i preferiti (dobbiamo fare in modo da aggiungere la serie ai preferiti dell'utente)
  togglePreferito() {
    this.animeData.isPreferito = !this.animeData.isPreferito;
    
    if (this.animeData.isPreferito) {
      console.log(`${this.animeData.titolo} aggiunto ai preferiti!`);
      // Qui andrebbe la chiamata al tuo backend o a Storage
    } else {
      console.log(`${this.animeData.titolo} rimosso dai preferiti.`);
    }
  }

  // Funzione per avviare la riproduzione dell'episodio
  playEpisodio(ep: Episodio) {
    console.log(`Avvio riproduzione Episodio ${ep.numero}: ${ep.titolo}`);
  }
//rinvia alla pagina di ricerca
  toggleSearch(){
    ;
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
