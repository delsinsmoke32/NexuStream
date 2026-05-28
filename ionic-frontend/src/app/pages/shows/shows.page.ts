import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { star, starOutline, searchOutline, personCircleOutline, settingsOutline, heartOutline, logOutOutline, playCircle } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonSpinner,IonIcon, IonPopover,IonList,IonItem, IonSelect, IonSelectOption } from '@ionic/angular/standalone';

@Component({
  selector: 'app-shows',
  templateUrl: './shows.page.html',
  styleUrls: ['./shows.page.scss'],
  standalone: true,
  imports: [IonButton, IonIcon,IonPopover,IonList,IonItem, IonButtons, IonContent,IonSpinner, IonHeader, IonTitle, IonToolbar,IonSelect, IonSelectOption,RouterModule, CommonModule, FormsModule]
})
export class ShowsPage implements OnInit {
// Usiamo ViewChild per accedere al popover definito nel template con #profilePopover
  @ViewChild('profilePopover') popover: any;

  animeId!: string | null;
  animeData: any = null;
  seasonSelected : any;
  private apiUrl = 'api/shows';

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    
    addIcons({star, searchOutline, starOutline, personCircleOutline, settingsOutline, heartOutline, logOutOutline, playCircle});
  }
 

  ngOnInit() {
    // 3. Recuperiamo l'ID dall'URL (es. "12" o "45")
    this.animeId = this.route.snapshot.paramMap.get('id');

    if (this.animeId) {
      // 4. Facciamo la chiamata dinamica al server: http://tuosito.com/api/serie/12
      this.http.get(`${this.apiUrl}/${this.animeId}`).subscribe({
        next: (datiRicevuti) => {
          // Quando il server risponde, salviamo i dati. 
          // La pagina HTML si accorgerà del cambiamento e si aggiornerà istantaneamente!
          this.animeData = datiRicevuti; 
          // Appena la pagina si carica, mostra automaticamente la PRIMA stagione della lista
        if (this.animeData.stagioni && this.animeData.stagioni.length > 0) {
          this.seasonSelected = this.animeData.stagioni[0];
        }
        },
        error: (err) => {
          console.error("Errore nel caricamento della serie:", err);
        }
      });
    }
  }

  // Questa funzione viene attivata quando l'utente cambia stagione nel menu a tendina
  cambiaStagione(event: any) {
    const numeroStagioneScelta = event.detail.value;
    
    // Cerchiamo nell'array delle stagioni quella che ha lo stesso numero scelto dall'utente
    this.seasonSelected = this.animeData.stagioni.find(
      (st: any) => st.numeroStagione === numeroStagioneScelta
    );
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
  playEpisodio(ep: any) {
    console.log(`Avvio riproduzione Episodio ${ep.numero}: ${ep.titolo}`);
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
