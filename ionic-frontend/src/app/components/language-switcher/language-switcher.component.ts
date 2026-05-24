import { Component, OnInit } from '@angular/core'
import {
    IonItem,
    IonIcon,
    IonSelect,
    IonSelectOption,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { globeOutline } from 'ionicons/icons'

@Component({
    selector: 'app-language-switcher',
    templateUrl: './language-switcher.component.html',
    styleUrls: ['./language-switcher.component.scss'],
    standalone: true,
    imports: [IonItem, IonIcon, IonSelect, IonSelectOption],
})
export class LanguageSwitcherComponent {
    currentLang: string

    constructor() {
        addIcons({ globeOutline })
        // Extract language code from the current URL path (e.g., /en/dashboard)
        this.currentLang =
            window.location.pathname.split('/')[1] in ['it', 'en']
                ? window.location.pathname.split('/')[1]
                : 'it'
    }

    switchLanguage(event: Event) {
        const target = event.target as HTMLSelectElement
        const nextLang = target.value

        // Replace the language segment in the URL
        const segments = window.location.pathname.split('/')
        segments[1] = nextLang

        // Reload the page with the new language bundle
        window.location.href = window.location.origin + segments.join('/')
    }
}
