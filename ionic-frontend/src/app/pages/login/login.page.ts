import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { AuthService } from '@app/services/auth';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
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
    ],
})
export class LoginPage implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);
    private toastController = inject(ToastController);

    loginData = { email: '', password: '' };

    ngOnInit() {}

    /**
     * Mappa i flag attivi sul database in un array di stringhe lineare.
     * @param {any} user L'oggetto utente restituito dal backend.
     * @returns {string[]} Array di ruoli accumulati (es. ['mod', 'cataloguer']).
     */
    private buildRolesArray(user: any): string[] {
        const roles: string[] = [];
        if (user.isAdmin === 1 || user.isAdmin === true) roles.push('admin');
        if (user.isMod === 1 || user.isMod === true) roles.push('mod');
        if (user.isCataloguer === 1 || user.isCataloguer === true) roles.push('cataloguer');
        
        // Se l'array è vuoto, è un utente standard senza privilegi speciali
        if (roles.length === 0) roles.push('user');
        
        return roles;
    }

    login() {
        if (!this.loginData.email || !this.loginData.password) {
            this.presentToast("Inserisci email e password per accedere.", "danger");
            return;
        }

        this.authService.login(this.loginData).subscribe({
            next: (res: any) => {
                console.log('Login OK:', res);
                
                // 1. Salva il Token JWT per le chiamate HTTP
                localStorage.setItem('token', res.token);
                
                // 2. Costruisce l'array dei ruoli e lo salva come stringa JSON nel localStorage
                const userRoles = this.buildRolesArray(res.user);
                localStorage.setItem('user_roles', JSON.stringify(userRoles));
                
                // 3. Salva l'intero oggetto utente per comodità
                localStorage.setItem('user', JSON.stringify(res.user));

                this.presentToast(`Benvenuto, ${res.user.Username}!`, "success");

                // 4. Redirezione Intelligente non gerarchica
                // Se è un admin va al pannello di controllo, altrimenti va alla home generale
                if (userRoles.includes('admin')) {
                    this.router.navigate(["/admin"]);
                } else {
                    this.router.navigate(["/home"]);
                }
            },
            error: (err) => {
                console.error("Errore durante il login: ", err);
                const errMsg = err.error?.message || err.error?.error || "Credenziali non valide.";
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