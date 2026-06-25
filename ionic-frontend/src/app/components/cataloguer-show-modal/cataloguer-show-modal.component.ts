import {
    Component,
    ElementRef,
    Input,
    OnInit,
    inject,
    signal,
    viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';

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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { imageOutline, imagesOutline } from 'ionicons/icons';

// 🚀 Import Service, Model e Pipe
import { CataloguerService } from '../../services/cataloguer';
import { ShowModalData, ShowPayload } from '../../models/cataloguer';
import { BackendUrlPipe } from '../../pipes/backend-url-pipe';

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
    providers: [BackendUrlPipe] // 🚀 Aggiungiamo il Pipe nei providers per iniettarlo!
})
export class CataloguerShowModalComponent implements OnInit {
    @Input() data!: ShowModalData; // 🚀 Tipizzato

    thumbInput = viewChild.required<ElementRef<HTMLInputElement>>('thumbInput');
    bannerInput = viewChild.required<ElementRef<HTMLInputElement>>('bannerInput');

    thumbnailFile = signal<File | null>(null);
    thumbnailPreview = signal<string | null>(null);

    bannerFile = signal<File | null>(null);
    bannerPreview = signal<string | null>(null);

    isUploading = signal<boolean>(false);

    private fb = inject(FormBuilder);
    private modalCtrl = inject(ModalController);
    private cataloguerService = inject(CataloguerService);
    private backendUrl = inject(BackendUrlPipe); // 🚀 Iniezione del Pipe

    showForm!: FormGroup;
    isEditMode = false;

    constructor() {
        addIcons({ imageOutline, imagesOutline });
    }

    ngOnInit() {
        this.isEditMode = !!this.data;

        if (this.isEditMode) {
            // 🚀 Usiamo il Pipe per trasformare l'URI nel link completo, NIENTE RAW URL!
            if (this.data.ThumbnailURI) {
                this.thumbnailPreview.set(this.backendUrl.transform(this.data.ThumbnailURI));
            }
            if (this.data.BannerURI) {
                this.bannerPreview.set(this.backendUrl.transform(this.data.BannerURI));
            }
        }

        this.initForm();
    }

    private initForm() {
        const getLangText = (jsonStr: string, lang: string) => {
            try {
                const obj = JSON.parse(jsonStr);
                return obj[lang] || '';
            } catch {
                return jsonStr || '';
            }
        };

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
        });
    }

    triggerSelect(type: 'thumbnail' | 'banner') {
        if (type === 'thumbnail') this.thumbInput().nativeElement.click();
        if (type === 'banner') this.bannerInput().nativeElement.click();
    }

    onFileSelect(event: Event, type: 'thumbnail' | 'banner') {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const reader = new FileReader();

            reader.onload = () => {
                if (type === 'thumbnail') {
                    this.thumbnailFile.set(file);
                    this.thumbnailPreview.set(reader.result as string);
                } else {
                    this.bannerFile.set(file);
                    this.bannerPreview.set(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    }

    dismiss(result?: any) {
        this.modalCtrl.dismiss(result);
    }

    async save() {
        if (this.showForm.invalid) return;
        this.isUploading.set(true);

        try {
            let finalThumbURI = this.data?.ThumbnailURI || null;
            let finalBannerURI = this.data?.BannerURI || null;

            // 🚀 Deleghiamo l'upload al service
            if (this.thumbnailFile()) {
                const res = await firstValueFrom(this.cataloguerService.uploadShowImage(this.thumbnailFile()!, 'thumbnail'));
                finalThumbURI = res.uri;
            }
            if (this.bannerFile()) {
                const res = await firstValueFrom(this.cataloguerService.uploadShowImage(this.bannerFile()!, 'banner'));
                finalBannerURI = res.uri;
            }

            const rawValues = this.showForm.getRawValue();

            const payload: ShowPayload = {
                ...rawValues,
                thumbnailURI: finalThumbURI,
                bannerURI: finalBannerURI,
            };

            this.dismiss({ payload, isEdit: this.isEditMode });
        } catch (error) {
            console.error("Errore durante l'upload delle immagini:", error);
        } finally {
            this.isUploading.set(false);
        }
    }
}