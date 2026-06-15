import {
    Component,
    ElementRef,
    Inject,
    Input,
    OnInit,
    SimpleChanges,
    ViewChild,
    inject,
    input,
    signal,
    viewChild,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'

// 🚀 IMPORTAZIONI STANDALONE CHIRURGICHE DI IONIC
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    ModalController,
    IonText,
    IonIcon,
    IonAvatar,
} from '@ionic/angular/standalone'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { addIcons } from '@lib/ionicons'
import { cameraOutline } from '@lib/ionicons/icons'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'

@Component({
    selector: 'app-avatar-picker-modal',
    templateUrl: './avatar-picker-modal.component.html',
    styleUrls: ['./avatar-picker-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonContent,
        IonItem,
        IonLabel,
        IonInput,
        IonText,
        IonIcon,
        IonAvatar,
        BackendUrlPipe,
    ],
})
export class AvatarPickerModalComponent implements OnInit {
    // selectedImg = signal<string>('')

    avatars = signal<any>([])
    baseUrl = 'api'
    loadPropics() {
        const url = `${this.baseUrl}/propics/getAllBundled`
        this.http
            .get<
                Record<string, string[]>
            >(url, { headers: this.getAuthHeaders() })
            .subscribe({
                next: (res) => {
                    console.log(res)
                    this.avatars.set(
                        Object.keys(res).map((key) => ({
                            name: key,
                            items: res[key],
                        }))
                    )
                    // ;(this.avatars.set(res), console.log(res))
                },
                error: (err) => console.error(err),
            })
    }

    http = inject(HttpClient)

    constructor() {}

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token')
        return new HttpHeaders({ Authorization: `Bearer ${token}` })
    }

    // SERVE IL DECORATORE per qualche motivo
    @Input() propic = ''

    // Signal interno per gestire la selezione visiva temporanea nel modal
    selectedAvatar = signal<string>('')

    private modalCtrl = inject(ModalController)

    ngOnInit() {
        this.loadPropics()
        // Inizializza la selezione interna con il valore ricevuto in input
        this.selectedAvatar.set(this.propic)
        console.log(this.selectedAvatar())
    }

    // Cambia l'avatar selezionato temporaneamente quando l'utente clicca
    select(avatarUri: string) {
        this.selectedAvatar.set(avatarUri)
    }

    // Chiude il modal passando l'avatar selezionato
    confirmSelection() {
        this.modalCtrl.dismiss({
            selectedAvatar: this.selectedAvatar(),
        })
    }

    dismiss() {
        this.modalCtrl.dismiss() // Chiude senza salvare se l'utente annulla
    }
}
