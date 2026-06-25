// percorso: src/app/services/auth.service.ts
import { inject, Injectable } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '../models/auth'; 

/**
 * Servizio globale per la gestione dell'autenticazione utente.
 * Si occupa di login, registrazione e recupero password.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(private http: HttpClient) {}

    private toastCtrl = inject(ToastController);
    private alertCtrl = inject(AlertController);
    private router = inject(Router);

    /**
     * Autentica un utente esistente.
     * @param credentials Oggetto contenente email e password.
     * @returns Un Observable contenente il token JWT e i dati dell'utente.
     */
    login(credentials: LoginCredentials): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`api/login`, credentials);
    }

    /**
     * Registra un nuovo utente nel sistema.
     * @param credentials Dati anagrafici, credenziali e preferenze (lingua, propic) del nuovo utente.
     * @returns Un Observable contenente il token JWT e i dati dell'utente appena creato.
     */
    register(credentials: RegisterCredentials): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`api/register`, credentials);
    }

    /**
     * Invia una richiesta al backend per generare un token temporaneo 
     * e recapitare il link di sblocco all'indirizzo email specificato.
     * @param payload Oggetto contenente l'email dell'utente compilata nel form.
     * @returns Un messaggio di conferma dell'invio dell'email.
     */
    forgotPassword(payload: { email: string }): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`api/login/forgot-password`, payload);
    }

    /**
     * Trasmette al backend il token recuperato dall'URL del browser 
     * e la nuova password sanificata per finalizzare il ripristino dell'account.
     * @param payload Oggetto composto dal token di verifica temporaneo e dalla nuova password scelta.
     * @returns Un messaggio di conferma dell'avvenuto reset.
     */
    resetPassword(payload: { token: string; newPassword: string }): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`api/login/reset-password`, payload);
    }

    /**
     * Gestisce il flusso globale di disconnessione:
     * Mostra l'avviso, pulisce il localStorage e reindirizza al login.
     */
    async confirmLogout(): Promise<void> {
        const alert = await this.alertCtrl.create({
            header: $localize `:@@disconnectHeader:Disconnetti`,
            message: $localize `:@@disconnectMessage:Sei sicuro di voler uscire da NexuStream?`,
            buttons: [
                { text: $localize `:@@cancelBtn:Annulla`, role: 'cancel' },
                {
                    text: $localize `:@@logOut:Esci`,
                    role: 'destructive',
                    handler: async () => {
                        // 1. Raso al suolo la memoria
                        localStorage.clear();

                        // 2. Mostro il feedback
                        const toast = await this.toastCtrl.create({
                            message: $localize `:@@closeSession:Sessione chiusa`,
                            duration: 2000,
                            color: 'dark'
                        });
                        await toast.present();

                        window.location.href = '/login'; //per ripulire i dati delle pagine (ad es., refreshare definitvamente i continua a guardare)
                    }
                }
            ]
        });

        await alert.present();
    }
}