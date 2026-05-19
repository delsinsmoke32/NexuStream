import { CommonModule } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'
import { AuthService } from '@app/services/auth'
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCol,
    IonContent,
    IonHeader,
    IonInput,
    IonInputPasswordToggle,
    IonItem,
    IonLabel,
    IonRow,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone'
import { Router } from '@lib/@angular/router'

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
        IonInputPasswordToggle,
        ReactiveFormsModule,
    ],
})
export class LoginPage implements OnInit {
    loginForm = new FormGroup({
        email: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.email],
        }),
        password: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(8)],
        }),
    })

    private authService = inject(AuthService)
    private router = inject(Router)

    constructor() {}

    login() {
        this.authService.login(this.loginForm.getRawValue()).subscribe({
            next: (res) => {
                console.log('Login OK: ', res)
                localStorage.setItem('user', JSON.stringify(res.user))
                this.router.navigate(['/episode'])
            },
            error: (err) => {
                console.error('Errore login: ', err)
                alert(err.error.message || 'Errore durante il login.')
            },
        })
    }

    ngOnInit() {}
}
