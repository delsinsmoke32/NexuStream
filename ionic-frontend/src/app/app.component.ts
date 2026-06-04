import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor() {}
  ngOnInit() {
    this.checkGlobalLanguageRedirect();
  }

  checkGlobalLanguageRedirect() {
    // 1. Recupera le preferenze salvate
    const savedPrefs = localStorage.getItem('user_language_preferences');
    if (!savedPrefs) return; // Se non c'è nulla salvato, non fare reindirizzamenti forzati

    const targetLang = JSON.parse(savedPrefs).appLanguage; // es. 'en'
    
    // 2. Controlla in quale lingua si trova l'URL attuale
    const currentLang = window.location.pathname.split('/')[1]; // Prende il primo segmento dopo il dominio

    // 3. Se l'URL non corrisponde alla lingua salvata nei settings, dirottiamo l'utente
    if (currentLang && (currentLang === 'it' || currentLang === 'en') && currentLang !== targetLang) {
      
      // Sostituisce la lingua vecchia con quella corretta nell'URL
      const newPath = window.location.pathname.replace(`/${currentLang}/`, `/${targetLang}/`);
      
      // Salta istantaneamente alla versione corretta dell'app
      window.location.href = window.location.origin + newPath + window.location.search;
    }
  }
}
