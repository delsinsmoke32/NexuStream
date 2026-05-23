import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    ToastController
} from '@ionic/angular/standalone';
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe';

@Component({
    selector: 'app-register',
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
    standalone: true,
    imports: [
        IonContent,
        IonHeader,
        IonTitle,
        IonToolbar,
        IonCard,
        IonRow,
        IonCol,
        IonItem,
        IonCardHeader,
        IonCardContent,
        IonCardTitle,
        IonButton,
        CommonModule,
        FormsModule,
        IonLabel,
        IonInput,
        BackendUrlPipe,
        RouterModule // Inserito nel caso volessi aggiungere un link alla pagina di login
    ],
})
export class RegisterPage implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    private toastController = inject(ToastController);

    // Modello dati per il form di registrazione
    registerData = {
        username: '',
        email: '',
        password: '',
        conf_password: ''
    };

    private baseUrl = 'http://localhost:3000/api/register'; // Adatta l'URL al tuo backend

    constructor() {}

    ngOnInit() {}

    register() {
        const { username, email, password, conf_password } = this.registerData;

        // 1. Validazione locale dei campi vuoti
        if (!username.trim() || !email.trim() || !password || !conf_password) {
            this.presentToast("Tutti i campi sono obbligatori.", "danger");
            return;
        }

        // 2. Controllo coincidenza password
        if (password !== conf_password) {
            this.presentToast("Le password inserite non coincidono.", "danger");
            return;
        }

        // Costruiamo il payload pulito da inviare alle API Express
        // NOTA: AGGIUNGERE MODO PER SELEZIONARE LINGUA AUDIO/TESTO/APP (menu a tendina?)
        // NOTA: AGGIUNGERE MODO PER SELEZIONARE PROPICURI (cioè rendere funzionale l'immagine di mob in basso a destra)
        const payload = {
            username: username.trim(),
            email: email.trim(),
            password: password,
            audioLanguageId: "it",
            textLanguageId: "it",
            appLanguageId: "it",
            propicURI: "/static/avatars/avatar-000.png"
        };

        // 3. Chiamata HTTP POST verso l'endpoint di registrazione del server
        this.http.post(`${this.baseUrl}`, payload).subscribe({
            next: () => {
                this.presentToast("Registrazione completata con successo! Ora puoi accedere.", "success");
                this.router.navigate(['/login']); // Sposta l'utente sulla pagina di login
            },
            error: (err) => {
                console.error("Errore registrazione:", err);
                const errMsg = err.error?.message || err.error?.error || "Errore durante la registrazione.";
                this.presentToast(errMsg, "danger");
            }
        });
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastController.create({
            message: message,
            duration: 3000,
            position: 'bottom',
            color: color
        });
        await toast.present();
    }
}