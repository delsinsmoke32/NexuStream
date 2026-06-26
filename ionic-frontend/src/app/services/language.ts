// src/app/services/language.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  // Impostiamo il default a 'it' per app e text, 'jp' per audio
  private http = inject(HttpClient);
  private currentAppLang = localStorage.getItem('appLang') || 'it';
  private currentTextLang = localStorage.getItem('textLang') || 'it';
  private currentAudioLang = localStorage.getItem('audioLang') || 'jp';
  

  //overloading
  setLanguages(appLang: string, textLang: string): void;
  setLanguages(appLang: string, textLang: string, audioLang: string): void;

  setLanguages(appLang: string, textLang: string, audioLang?: string,): void {
    if (audioLang) this.currentAudioLang = audioLang;
    this.currentAppLang = appLang;
    this.currentTextLang = textLang;

    localStorage.setItem('appLang', this.currentAppLang);
    localStorage.setItem('textLang', this.currentTextLang);
    localStorage.setItem('audioLang', this.currentAudioLang);

    const token = localStorage.getItem('token');
    if (token) {
      this.syncWithBackend();
    }
  }

  private syncWithBackend() {
    const payload = {
      appLanguageId: this.currentAppLang,
      textLanguageId: this.currentTextLang,
      audioLanguageId: this.currentAudioLang
    };

    this.http.patch(`api/users/preferences`, payload).subscribe({
      next: () => console.log('Preferenze lingua aggiornate sul DB!'),
      error: (err) => console.error('Impossibile salvare le preferenze sul DB', err)
    });
  }

  getAudioLang() { return this.currentAudioLang }
  getAppLang() { return this.currentAppLang; }
  getTextLang() { return this.currentTextLang; }
}