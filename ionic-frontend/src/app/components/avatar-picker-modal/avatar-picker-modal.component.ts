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

//  IMPORTAZIONI STANDALONE CHIRURGICHE DI IONIC
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    ModalController,
} from '@ionic/angular/standalone'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { addIcons } from '@lib/ionicons'
import { cameraOutline } from '@lib/ionicons/icons'
import { BackendUrlPipe } from '@app/pipes/backend-url-pipe'
import { AvatarPicker } from '@app/services/avatar-picker'
import { PropicGroup } from '@app/models/cataloguer'

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
        BackendUrlPipe,
    ],
})
export class AvatarPickerModalComponent implements OnInit {
    // selectedImg = signal<string>('')
    avatarService = inject(AvatarPicker)
    avatars = signal<PropicGroup[]>([])
    baseUrl = 'api'

    loadPropics() {
        this.avatarService.getPropics().subscribe({
            next: (res) => {
                console.log(res)
                this.avatars.set(res)
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
