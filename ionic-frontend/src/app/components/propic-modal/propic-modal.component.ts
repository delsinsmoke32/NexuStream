import { CommonModule } from '@angular/common'
import {
    Component,
    ElementRef,
    Input,
    OnInit,
    inject,
    signal,
    viewChild,
} from '@angular/core'
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'


import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonSpinner,
    IonTitle,
    IonToolbar,
    ModalController,
    ToastController,
} from '@ionic/angular/standalone'

import { addIcons } from 'ionicons'
import { cloudUploadOutline, imageOutline } from 'ionicons/icons'


import { CataloguerService } from '../../services/cataloguer'

@Component({
    selector: 'app-propic-modal',
    templateUrl: './propic-modal.component.html',
    styleUrls: ['./propic-modal.component.scss'],
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
        IonIcon,
        IonSpinner,
    ],
})
export class PropicModalComponent implements OnInit {
    @Input() bundleName?: string
    fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput')

    imagePreview = signal<string | null>(null)
    selectedFile = signal<File | null>(null)
    isUploading = signal<boolean>(false)

    private cataloguerService = inject(CataloguerService)
    private fb = inject(FormBuilder)
    private modalCtrl = inject(ModalController)
    private toastCtrl = inject(ToastController)

    propicForm!: FormGroup

    constructor() {
        addIcons({ cloudUploadOutline, imageOutline })
    }

    ngOnInit() {
        this.propicForm = this.fb.group({
            // Se bundleName esiste, lo mettiamo come valore di default
            bundle: [
                this.bundleName || '',
                [Validators.required, Validators.minLength(2)],
            ],
        })
    }

    triggerSelect() {
        this.fileInput().nativeElement.click()
    }

    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement
        if (input.files && input.files.length > 0) {
            const file = input.files[0]
            this.selectedFile.set(file)

            
            const reader = new FileReader()
            reader.onload = () => {
                this.imagePreview.set(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    uploadPicture() {
        const file = this.selectedFile()
        if (!file || this.propicForm.invalid) return

        this.isUploading.set(true)
        const bundleName = this.propicForm.value.bundle

       
        this.cataloguerService.uploadPropic(bundleName, file).subscribe({
            next: (res) => {
                this.presentToast('Avatar caricato con successo!', 'success')
                this.isUploading.set(false)
                
                this.dismiss({ success: true })
            },
            error: (err) => {
                console.error('Upload failed', err)
                this.presentToast(
                    "Errore nel caricamento dell'immagine.",
                    'danger'
                )
                this.isUploading.set(false)
            },
        })
    }

    dismiss(result?: any) {
        this.modalCtrl.dismiss(result)
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 2500,
            position: 'bottom',
            color,
        })
        await toast.present()
    }
}
