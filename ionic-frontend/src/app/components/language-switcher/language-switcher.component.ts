import { Component, OnInit } from '@angular/core'
import {
    IonItem,
    IonIcon,
    IonSelect,
    IonSelectOption,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { globeOutline, chevronDownOutline } from 'ionicons/icons'

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
        addIcons({ globeOutline, chevronDownOutline })
        // Extract language code from the current URL path (e.g., /en/dashboard)
        const langs = ['it', 'en']
        this.currentLang = langs.includes(
            window.location.pathname.split('/')[1]
        )
            ? window.location.pathname.split('/')[1]
            : 'it'
    }

    switchLanguage(event: Event) {
        const target = event.target as HTMLSelectElement
        const nextLang = target.value

        // Replace the language segment in the URL
        const segments = window.location.pathname.split('/')
        segments[1] = nextLang

        console.log(segments)
        // Reload the page with the new language bundle
        window.location.href = window.location.origin + segments.join('/')
    }
}
