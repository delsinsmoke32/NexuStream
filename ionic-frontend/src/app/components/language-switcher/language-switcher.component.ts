import { Component, inject, OnInit } from '@angular/core';
import {
    IonItem,
    IonIcon,
    IonSelect,
    IonSelectOption,
    ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { globeOutline, chevronDownOutline } from 'ionicons/icons';
import { LanguageService } from '@app/services/language';

@Component({
    selector: 'app-language-switcher',
    templateUrl: './language-switcher.component.html',
    styleUrls: ['./language-switcher.component.scss'],
    standalone: true,
    imports: [IonItem, IonIcon, IonSelect, IonSelectOption],
})
export class LanguageSwitcherComponent {
    currentLang: string
    private serveMode = false
    private toastController = inject(ToastController)
    private langService = inject(LanguageService);

    constructor() {
        addIcons({ globeOutline, chevronDownOutline })
        
        const langs = ['it', 'en']
        if (langs.includes(window.location.pathname.split('/')[1])) {
            this.currentLang = window.location.pathname.split('/')[1]
        } else {
            this.currentLang = 'it'
            this.serveMode = true
        }
    }

    switchLanguage(event: Event) {
        const target = event.target as HTMLSelectElement
        const nextLang = target.value

        this.langService.setLanguages(nextLang, nextLang);

        
        if (!this.serveMode) {
            const segments = window.location.pathname.split('/')
            segments[1] = nextLang

            console.log(segments)
            
            window.location.href = window.location.origin + segments.join('/')
        } else {
            this.presentToast(
                'Non è possibile cambiare lingua in questa modalità.',
                'warning'
            )
        }
    }
    async presentToast(message: string, color: 'warning') {
        const toast = await this.toastController.create({
            message,
            duration: 2500,
            position: 'bottom',
            color,
        })
        await toast.present()
    }
}
