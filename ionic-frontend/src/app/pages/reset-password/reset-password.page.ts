import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/services/auth';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonInput, 
  IonButton, 
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
  ToastController 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonItem, 
    IonInput, 
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonText
  ]
})
export class ResetPasswordPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  resetForm!: FormGroup;
  token: string = '';

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.presentToast($localize `:@@missingToken:Token di ripristino mancante o scaduto.`, 'danger');
      this.router.navigate(['/login']);
      return;
    }

    this.initForm();
  }

  private initForm() {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(24)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('newPassword')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.presentToast($localize `:@@resetFormInvalid:Assicurati che i campi siano validi e coincidano.`, "danger");
      return;
    }

    if (!this.token) {
      this.presentToast($localize `:@@invalidToken:Token sessione non valido.`, "danger");
      return;
    }

    const cleanPassword = this.resetForm.value.newPassword?.trim();
    if (!cleanPassword) {
      this.presentToast($localize `:@@rawPassword:La password non può contenere solo spazi vuoti.`, "danger");
      return;
    }

    const payload = {
      token: this.token,
      newPassword: cleanPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: (res: any) => {
        this.presentToast(res.message ||$localize `:@@resetPassSuccess: Password modificata con successo!`, 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error("Errore HTTP Reset Password:", err);
        this.presentToast(
          err.error?.error ||$localize `:@@expiredLink: Link scaduto o non valido.`,
          'danger'
        );
      }
    });
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3500, color, position: 'bottom' });
    await toast.present();
  }
}