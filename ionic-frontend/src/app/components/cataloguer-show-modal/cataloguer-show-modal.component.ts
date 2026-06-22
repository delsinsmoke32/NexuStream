import {
    Component,
    ElementRef,
    Input,
    OnInit,
    inject,
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
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'

// IONIC STANDALONE
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
    IonTextarea,
    IonGrid,
    IonRow,
    IonCol,
    ModalController,
    IonIcon,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { imageOutline, imagesOutline } from 'ionicons/icons'

@Component({
    selector: 'app-cataloguer-show-modal',
    templateUrl: './cataloguer-show-modal.component.html',
    styleUrls: ['./cataloguer-show-modal.component.scss'],
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
        IonTextarea,
        IonGrid,
        IonRow,
        IonCol,
        IonIcon,
    ],
})
export class CataloguerShowModalComponent implements OnInit {
    @Input() data: any // Contiene l'oggetto se siamo in modalità modifica

    // ViewChild per i due input file nascosti
    thumbInput = viewChild.required<ElementRef<HTMLInputElement>>('thumbInput')
    bannerInput =
        viewChild.required<ElementRef<HTMLInputElement>>('bannerInput')

    // Signals per gestire file e anteprime in modo reattivo
    thumbnailFile = signal<File | null>(null)
    thumbnailPreview = signal<string | null>(null)

    bannerFile = signal<File | null>(null)
    bannerPreview = signal<string | null>(null)

    isUploading = signal<boolean>(false)

    private fb = inject(FormBuilder)
    private modalCtrl = inject(ModalController)
    private http = inject(HttpClient)

    showForm!: FormGroup
    isEditMode = false

    constructor() {
        addIcons({ imageOutline, imagesOutline })
    }

    ngOnInit() {
        this.isEditMode = !!this.data

        // Se siamo in modifica e abbiamo già delle immagini sul server, le impostiamo come anteprime iniziali
        if (this.isEditMode) {
            if (this.data.ThumbnailURI)
                this.thumbnailPreview.set(
                    `http://localhost:3000/${this.data.ThumbnailURI}`
                )
            if (this.data.BannerURI)
                this.bannerPreview.set(
                    `http://localhost:3000/${this.data.BannerURI}`
                )
        }

        this.initForm()
    }

    private initForm() {
        const getLangText = (jsonStr: string, lang: string) => {
            try {
                const obj = JSON.parse(jsonStr)
                return obj[lang] || ''
            } catch {
                return jsonStr || ''
            }
        }

        this.showForm = this.fb.group({
            title_it: [
                this.isEditMode ? getLangText(this.data.Title, 'it') : '',
                [Validators.required],
            ],
            description_it: [
                this.isEditMode ? getLangText(this.data.Description, 'it') : '',
                [Validators.required],
            ],
            title_en: [
                this.isEditMode ? getLangText(this.data.Title, 'en') : '',
            ],
            description_en: [
                this.isEditMode ? getLangText(this.data.Description, 'en') : '',
            ],
            dateStarted: [
                {
                    value: this.data?.DateStarted || '',
                    disabled: this.isEditMode,
                },
                this.isEditMode ? [] : [Validators.required],
            ],
            dateEnded: [this.data?.DateEnded || ''],
        })
    }

    triggerSelect(type: 'thumbnail' | 'banner') {
        if (type === 'thumbnail') this.thumbInput().nativeElement.click()
        if (type === 'banner') this.bannerInput().nativeElement.click()
    }

    onFileSelect(event: Event, type: 'thumbnail' | 'banner') {
        const input = event.target as HTMLInputElement
        if (input.files && input.files.length > 0) {
            const file = input.files[0]
            const reader = new FileReader()

            reader.onload = () => {
                if (type === 'thumbnail') {
                    this.thumbnailFile.set(file)
                    this.thumbnailPreview.set(reader.result as string)
                } else {
                    this.bannerFile.set(file)
                    this.bannerPreview.set(reader.result as string)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    dismiss(result?: any) {
        this.modalCtrl.dismiss(result)
    }

    // Helper per caricare un singolo file e farsi restituire l'URI
    private async uploadImage(
        file: File,
        type: 'thumbnail' | 'banner'
    ): Promise<string> {
        const formData = new FormData()
        formData.append(type, file, file.name) // 'thumbnail' o 'banner' (deve coincidere col backend)

        const token = localStorage.getItem('token')
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` })

        // Sostituisci la base URL con il tuo environment
        let endpoint = ``
        if (type === 'thumbnail') {
            endpoint = `http://localhost:3000/api/upload/show_thumbnails`
        } else {
            endpoint = `http://localhost:3000/api/upload/banners`
        }

        const response: any = await firstValueFrom(
            this.http.post(endpoint, formData, { headers })
        )
        return response.uri
    }

    async save() {
        if (this.showForm.invalid) return
        this.isUploading.set(true)

        try {
            // 1. STEP 1: Upload Fisico (se l'utente ha selezionato file nuovi)
            let finalThumbURI = this.data?.ThumbnailURI || null
            let finalBannerURI = this.data?.BannerURI || null

            if (this.thumbnailFile()) {
                finalThumbURI = await this.uploadImage(
                    this.thumbnailFile()!,
                    'thumbnail'
                )
            }
            if (this.bannerFile()) {
                finalBannerURI = await this.uploadImage(
                    this.bannerFile()!,
                    'banner'
                )
            }

            // 2. Raccogliamo i testi
            const rawValues = this.showForm.getRawValue()

            // 3. STEP 2: Impacchettiamo Testi + URI e passiamo tutto al genitore
            const payload = {
                ...rawValues,
                thumbnailURI: finalThumbURI,
                bannerURI: finalBannerURI,
            }

            this.dismiss({ payload, isEdit: this.isEditMode })
        } catch (error) {
            console.error("Errore durante l'upload delle immagini:", error)
            // Qui potresti mostrare un toast di errore Ionic
        } finally {
            this.isUploading.set(false)
        }
    }
}
