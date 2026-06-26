import { Component, Input, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'

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
    ToastController
} from '@ionic/angular/standalone'

import { SeasonModalData, SeasonPayload } from '../../models/cataloguer'

@Component({
    selector: 'app-cataloguer-season-modal',
    templateUrl: './cataloguer-season-modal.component.html',
    styleUrls: ['./cataloguer-season-modal.component.scss'],
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
    ],
})
export class CataloguerSeasonModalComponent implements OnInit {
    @Input() data!: SeasonModalData
    @Input() autoSeasonNumber!: number

    private fb = inject(FormBuilder)
    private modalCtrl = inject(ModalController)
    private toastCtrl = inject(ToastController)

    seasonForm!: FormGroup
    isEditMode = false

    ngOnInit() {
        this.isEditMode = !!this.data
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

        this.seasonForm = this.fb.group({
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
            seasonNumber: [
                {
                    value: this.data?.SeasonNumber || this.autoSeasonNumber,
                    disabled: true,
                },
            ],
        })
    }

    dismiss(result?: any) {
        this.modalCtrl.dismiss(result)
    }

    save() {
        if (this.seasonForm.invalid) {
            this.presentToast(
                $localize`:@@catSeaModal_formInvalid:Compila tutti i campi obbligatori contrassegnati con l'asterisco.`,
                'danger'
            )
            return
        }
    

        const rawValues = this.seasonForm.getRawValue() as SeasonPayload
        this.dismiss({ payload: rawValues, isEdit: this.isEditMode })
    }

    private async presentToast(message: string, color: 'success' | 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            color,
            position: 'bottom',
        })
        await toast.present()
    }
}
