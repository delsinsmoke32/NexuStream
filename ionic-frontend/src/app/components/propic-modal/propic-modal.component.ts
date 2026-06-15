import {
    Component,
    ElementRef,
    Inject,
    Input,
    OnInit,
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
    ToastController
} from '@ionic/angular/standalone'
import {
    HttpClient,
    HttpEvent,
    HttpEventType,
    HttpHeaders,
} from '@angular/common/http'
import { addIcons } from '@lib/ionicons'
import { cameraOutline } from '@lib/ionicons/icons'

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
        IonText,
        IonIcon,
        IonAvatar,
    ],
})
export class PropicModalComponent implements OnInit {
    fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

    imagePreview = signal<string | null>(null);
    // Using Angular Signals for optimized reactivity
    selectedFile = signal<File | null>(null);
    isUploading = signal<boolean>(false);

    http = inject(HttpClient);
    toastCtrl = inject(ToastController);
    constructor() {
        addIcons({ cameraOutline });
    }

    triggerSelect() {
        this.fileInput().nativeElement.click();
    }

    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.selectedFile.set(file);

            // Aggiorna il valore nel form reattivo di Angular
            // this.propicForm.patchValue({ img: file })
            this.propicForm.get('img')?.setValue('file_selected'); //dummy, maybe rimuovere
            // this.propicForm.get('img')?.updateValueAndValidity()
            // --- LOGICA PER L'ANTEPRIMA ---
            const reader = new FileReader();
            reader.onload = () => {
                // Il risultato è un URL in formato Base64 utilizzabile nel tag <img>
                this.imagePreview.set(reader.result as string);
            }
            reader.readAsDataURL(file);
            // ------------------------------
        }
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    uploadPicture() {
        const file = this.selectedFile();
        if (!file || this.propicForm.invalid) return;

        this.isUploading.set(true);
        const formData = new FormData();
        formData.append('bundle', this.propicForm.get('bundle')?.value ?? '');
        formData.append('img', file, file.name);
        // console.log(formData, file, file.name)
        // const payload = this.propicForm.getRawValue()

        const endpoint = 'api/cataloguer/propic/add';

        // Replace with your active API endpoint URL
        this.http
            .post(endpoint, formData, {
                headers: this.getAuthHeaders(),
                reportProgress: true,
                observe: 'events',
            })
            .subscribe({
                next: (event: HttpEvent<any>) => {
                    if (event.type === HttpEventType.UploadProgress) {
                        const percentDone = Math.round(
                            (100 * event.loaded) / (event.total ?? 1)
                        );
                        console.log(`Dati caricati al ${percentDone}%`);
                        // Qui puoi aggiornare un signal o una variabile di stato, es: this.uploadPercent.set(percentDone)
                    } else if (event.type === HttpEventType.Response) {
                        let response = event.body;
                        console.log('Upload success', response);
                        this.selectedFile.set(null);

                        // Resetta il form Angular
                        this.propicForm.reset();

                        // Resetta l'elemento HTML nativo per permettere di selezionare nuovamente lo stesso file
                        this.fileInput().nativeElement.value = '';
                        this.imagePreview.set(null);
                    }
                    this.presentToast("Propic caricata!", "success");
                },
                error: (error: any) => {
                    this.presentToast("Errore nel caricamento della propic", "danger");
                    console.error('Upload failed', error);
                },
                complete: () => {
                    this.isUploading.set(false);
                },
            })
    }

    propic: any = input(); // Contiene l'oggetto se siamo in modalità modifica

    private fb = inject(FormBuilder);
    private modalCtrl = inject(ModalController);

    propicForm!: FormGroup;
    isEditMode = false;

    ngOnInit() {
        this.isEditMode = !!this.propic;
        this.initForm();
    }

    private initForm() {
        // const getLangText = (jsonStr: string, lang: string) => {
        //     try {
        //         const obj = JSON.parse(jsonStr)
        //         return obj[lang] || ''
        //     } catch {
        //         return jsonStr || ''
        //     }
        // }

        this.propicForm = this.fb.group({
            bundle: [
                this.isEditMode ? this.propic.bundle : '',
                [Validators.required],
            ],
            img: [
                this.isEditMode ? this.propic.file : '',
                [Validators.required],
            ],
        })
    }

    dismiss(result?: any) {
        this.modalCtrl.dismiss(result);
    }

    save() {
        if (this.propicForm.invalid) return;

        // Includiamo i campi disabilitati per non perdere chiavi primarie/strutturali nel backend
        const rawValues = this.propicForm.getRawValue();
        this.dismiss({ payload: rawValues, isEdit: this.isEditMode });
    }

    async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message, duration: 2500, position: 'bottom', color,
        });
        await toast.present();
    }

}
