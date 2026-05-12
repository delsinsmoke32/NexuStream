import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
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
} from '@ionic/angular/standalone'
import { AuthService } from '@app/services/auth';
import { Router } from '@lib/@angular/router';

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

    loginData = {email: '', password: ''};


    constructor(
        private authService: AuthService,
        private router: Router, 
    ) {}

    login() {
        this.authService.login(this.loginData).subscribe({
            next: (res) => {
                console.log('Login OK: ', res);
                localStorage.setItem('user', JSON.stringify(res.user));
                this.router.navigate(["/episode"]);
            },
            error: (err) => {
                console.error("Errore login: ", err);
                alert(err.error.message || "Errore durante il login.");
            }
        });
    };

    ngOnInit() {}
}
