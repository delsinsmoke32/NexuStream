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
    FormsModule,
} from '@angular/forms'
import { firstValueFrom } from 'rxjs'

import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonGrid,
    IonRow,
    IonCol,
    AlertController,
    ModalController,
    IonIcon,
    IonSelect,
    IonSelectOption,
    ToastController,
    IonSpinner,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import {
    imageOutline,
    videocamOutline,
    documentTextOutline,
    addCircleOutline,
    trashOutline,
    informationCircleOutline,
    checkmarkCircle,
    musicalNotesOutline,
    textOutline,
    volumeHighOutline,
    timeOutline, alertCircleOutline } from 'ionicons/icons'

//  Imports Service, Model e Pipe
import { CataloguerService } from '../../services/cataloguer'
import {
    EpisodePayload,
    EpisodeMarker,
    TrackData,
} from '../../models/cataloguer'
import { BackendUrlPipe } from '../../pipes/backend-url-pipe'

@Component({
    selector: 'app-cataloguer-episode-modal',
    templateUrl: './cataloguer-episode-modal.component.html',
    styleUrls: ['./cataloguer-episode-modal.component.scss'],
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
        FormsModule,
        IonSelect,
        IonSelectOption,
        IonSpinner,
        IonList,
    ],
    providers: [BackendUrlPipe],
})
export class CataloguerEpisodeModalComponent implements OnInit {
    @Input() data: any
    @Input() seasonId!: number
    @Input() autoEpisodeNumber!: number

    thumbInput = viewChild.required<ElementRef<HTMLInputElement>>('thumbInput')
    videoInput = viewChild<ElementRef<HTMLInputElement>>('videoInput')

    thumbnailFile = signal<File | null>(null)
    thumbnailPreview = signal<string | null>(null)

    videoFile = signal<File | null>(null)
    videoFileName = signal<string | null>(null)

    audioTracksList = signal<TrackData[]>([])
    subTracksList = signal<TrackData[]>([])

    existingDubs = signal<string[]>([])
    existingSubs = signal<string[]>([])

    markersList = signal<EpisodeMarker[]>([])
    isUploading = signal<boolean>(false)

    private fb = inject(FormBuilder)
    private modalCtrl = inject(ModalController)
    private cataloguerService = inject(CataloguerService)
    private toastCtrl = inject(ToastController)
    private alertCtrl = inject(AlertController)
    private backendUrl = inject(BackendUrlPipe)

    isMockEpisode = signal<boolean>(true)
    episodeForm!: FormGroup
    isEditMode = false

    constructor() {
        addIcons({imageOutline,documentTextOutline,videocamOutline,volumeHighOutline,trashOutline,textOutline,addCircleOutline,alertCircleOutline,timeOutline,informationCircleOutline,checkmarkCircle,musicalNotesOutline,});
    }

    ngOnInit() {
        this.isEditMode = !!this.data
        console.log(this.data)
        if (this.isEditMode) {
            this.isMockEpisode.set(this.data.StreamURI == 'test')
            if (this.data.ThumbnailURI) {
                this.thumbnailPreview.set(
                    this.backendUrl.transform(this.data.ThumbnailURI)
                )
            }

            this.refreshTracks()
            this.fetchExistingMarkers()
            this.audioTracksList.set([])
            this.subTracksList.set([])
        } else {
            this.isMockEpisode.set(false)
            // In creazione assicurati che partano puliti
            this.existingDubs.set([])
            this.existingSubs.set([])
        }

        this.initForm()
    }

    refreshTracks(): void {
        const id = this.data.EpisodeID

        // Recupera tracce Audio
        this.cataloguerService.getEpisodeTracks(id, 'audio').subscribe({
            next: (response: any) => {
                console.log(response)
                // Se il backend risponde con l'oggetto intero del controller precedente
                this.existingDubs.set(response.tracks)
            },
            error: (err) => console.error('Errore audio:', err),
        })

        // Recupera tracce Sottotitoli
        this.cataloguerService.getEpisodeTracks(id, 'subs').subscribe({
            next: (response: any) => {
                this.existingSubs.set(response.tracks)
            },
            error: (err) => console.error('Errore subs:', err),
        })
    }

    private fetchExistingMarkers() {
        this.cataloguerService
            .getEpisodeMarkers(this.data.EpisodeID)
            .subscribe({
                next: (times) => {
                    if (times && times.length > 0) {
                        this.markersList.set(times)
                    }
                },
                error: (err) =>
                    console.error(
                        "Errore nel recupero dei tempi dell'episodio",
                        err
                    ),
            })
    }

    private initForm() {
        const getLangText = (jsonStr: string, lang: string) => {
            if (!jsonStr) return ''
            try {
                const obj = JSON.parse(jsonStr)
                return obj[lang] || ''
            } catch {
                // Se non è un JSON (stringa nativa), la usiamo solo se la lingua richiesta è l'italiano
                return lang === 'it' ? jsonStr : ''
            }
        }

        this.episodeForm = this.fb.group({
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
            releaseDate: [
                {
                    value: this.data?.ReleaseDate || '',
                    disabled: this.isEditMode,
                },
                this.isEditMode ? [] : [Validators.required],
            ],
            duration: [
                { value: this.data?.Duration || '', disabled: this.isEditMode },
                this.isEditMode ? [] : [Validators.required, Validators.min(1)],
            ],
            episodeNumber: [
                {
                    value: this.data?.EpisodeNumber || this.autoEpisodeNumber,
                    disabled: true,
                },
            ],
            refSeason: [this.seasonId],
        })
    }

    triggerThumbSelect() {
        this.thumbInput().nativeElement.click()
    }
    triggerVideoSelect() {
        const vInput = this.videoInput()
        if (vInput) vInput.nativeElement.click()
    }

    onThumbSelect(event: Event) {
        const input = event.target as HTMLInputElement
        if (input.files && input.files.length > 0) {
            const file = input.files[0]
            const reader = new FileReader()
            reader.onload = () => {
                this.thumbnailFile.set(file)
                this.thumbnailPreview.set(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    onVideoSelect(event: Event) {
        const input = event.target as HTMLInputElement
        if (input.files && input.files.length > 0) {
            const file = input.files[0]
            this.videoFile.set(file)
            this.videoFileName.set(file.name)

            const videoNode = document.createElement('video')
            videoNode.preload = 'metadata'
            videoNode.src = URL.createObjectURL(file)
            videoNode.onloadedmetadata = () => {
                const durationInSeconds = Math.round(videoNode.duration)
                this.episodeForm.patchValue({ duration: durationInSeconds })
                URL.revokeObjectURL(videoNode.src)
            }
        }
    }

    dismiss(result?: any) {
        this.modalCtrl.dismiss(result)
    }

    // --- AUDIO ---
    addAudioTrack() {
        this.audioTracksList.update((list) => [
            ...list,
            { lang: 'it', file: null },
        ])
    }
    removeAudioTrack(index: number) {
        this.audioTracksList.update((list) =>
            list.filter((_, i) => i !== index)
        )
    }
    triggerAudioSelect(index: number) {
        document.getElementById('audioInput_' + index)?.click()
    }
    onAudioSelect(event: Event, index: number) {
        const input = event.target as HTMLInputElement
        if (input.files && input.files.length > 0) {
            const file = input.files[0]
            this.audioTracksList.update((list) => {
                const newList = [...list]
                newList[index].file = file
                return newList
            })
        }
    }

    // --- SUB ---
    addSubTrack() {
        this.subTracksList.update((list) => [
            ...list,
            { lang: 'it', file: null },
        ])
    }
    removeSubTrack(index: number) {
        this.subTracksList.update((list) => list.filter((_, i) => i !== index))
    }
    triggerSubSelect(index: number) {
        document.getElementById('subInput_' + index)?.click()
    }
    onSubSelect(event: Event, index: number) {
        const input = event.target as HTMLInputElement
        if (input.files && input.files.length > 0) {
            const file = input.files[0]
            this.subTracksList.update((list) => {
                const newList = [...list]
                newList[index].file = file
                return newList
            })
        }
    }

    // --- MARKERS TEMPORALI ---
    addMarker() {
        this.markersList.update((list) => [
            ...list,
            { StartTime: null, EndTime: null, Type: 'intro' },
        ])
    }
    removeMarker(index: number) {
        this.markersList.update((list) => list.filter((_, i) => i !== index))
    }

    async deleteServerTrack(type: 'audio' | 'subs', lang: string) {
        const alert = await this.alertCtrl.create({
            header: $localize`:@@catEpModal_deleteTrackHeader:Conferma Eliminazione`,
            message: `:@@catEpModal_deleteTrackMsg:Sei sicuro di voler eliminare la traccia ${type.toUpperCase()} in ${lang.toUpperCase()}?`,
            buttons: [
                { text: $localize`:@@catEpModal_cancel:Annulla`, role: 'cancel' },
                {
                    text: $localize`:@@catEpModal_delete:Elimina`,
                    role: 'destructive',
                    handler: async () => {
                        this.isUploading.set(true)
                        try {
                            
                            await firstValueFrom(
                                this.cataloguerService.deleteEpisodeTrack(
                                    this.data.EpisodeID,
                                    type,
                                    lang
                                )
                            )

                            if (type === 'audio') {
                                this.existingDubs.update((list) =>
                                    list.filter((l) => l !== lang)
                                )
                                this.data.DubLanguages =
                                    this.existingDubs().join(',')
                            } else {
                                this.existingSubs.update((list) =>
                                    list.filter((l) => l !== lang)
                                )
                                this.data.SubLanguages =
                                    this.existingSubs().join(',')
                            }
                            this.presentToast($localize`:@@catEpModal_trackDeleted:Traccia eliminata!`, 'success')
                        } catch (err) {
                            this.presentToast(
                                $localize`:@@catEpModal_errDeleteTrack:Impossibile eliminare la traccia.`,
                                'danger'
                            )
                        } finally {
                            this.isUploading.set(false)
                        }
                    },
                },
            ],
        })
        await alert.present()
    }

    async save() {
        const hasEmptyAudio = this.audioTracksList().some(
            (track) => !track.file
        )
        const hasEmptySub = this.subTracksList().some((track) => !track.file)

        if (hasEmptyAudio || hasEmptySub) {
            this.presentToast(
                $localize`:@@catEpModal_emptyTrackFile:Hai aggiunto una traccia ma non hai selezionato il file.`,
                'warning'
            )
            return
        }

        if (this.episodeForm.invalid) {
            this.presentToast($localize`:@@catEpModal_invalidForm:Compila tutti i campi obbligatori.`, 'danger')
            return
        }

        if (!this.isEditMode && !this.videoFile()) {
            this.presentToast(
                $localize`:@@catEpModal_missingVideo:Devi selezionare il file video principale.`,
                'danger'
            )
            return
        }

        const currentMarkers = this.markersList()
        for (const marker of currentMarkers) {
            if (
                marker.StartTime === null ||
                marker.EndTime === null ||
                marker.StartTime >= marker.EndTime ||
                marker.StartTime < 0 ||
                marker.EndTime > this.data!.Duration
            ) {
                this.presentToast(
                    $localize`:@@catEpModal_markerError:Errore nei Marker: controlla i tempi e la durata.`,
                    'warning'
                )
                return
            }
        }

        this.isUploading.set(true)

        try {
            let finalThumbURI = this.data?.ThumbnailURI || null
            if (this.thumbnailFile()) {
                const res = await firstValueFrom(
                    this.cataloguerService.uploadEpisodeMedia(
                        this.thumbnailFile()!,
                        'thumbnail'
                    )
                )
                finalThumbURI = res.uri
            }

            let finalRawVideoURI = null
            if (this.videoFile()) {
                const res = await firstValueFrom(
                    this.cataloguerService.uploadEpisodeMedia(
                        this.videoFile()!,
                        'raw_video'
                    )
                )
                finalRawVideoURI = res.uri
            }

            const uploadedAudioTracks = []
            for (const track of this.audioTracksList()) {
                if (track.file) {
                    const res = await firstValueFrom(
                        this.cataloguerService.uploadEpisodeMedia(
                            track.file,
                            'track'
                        )
                    )
                    uploadedAudioTracks.push({ lang: track.lang, uri: res.uri })
                }
            }

            const uploadedSubTracks = []
            for (const track of this.subTracksList()) {
                if (track.file) {
                    const res = await firstValueFrom(
                        this.cataloguerService.uploadEpisodeMedia(
                            track.file,
                            'track'
                        )
                    )
                    uploadedSubTracks.push({ lang: track.lang, uri: res.uri })
                }
            }

            const rawValues = this.episodeForm.getRawValue()

            const payload: EpisodePayload = {
                ...rawValues,
                thumbnailURI: finalThumbURI,
                ...(finalRawVideoURI && { rawVideoURI: finalRawVideoURI }),
                audioTracks: uploadedAudioTracks,
                subTracks: uploadedSubTracks,
                times: currentMarkers,
            }

            console.log('this is payload', payload)

            this.dismiss({ payload, isEdit: this.isEditMode })
        } catch (error) {
            console.error("Errore durante l'upload:", error)
        } finally {
            this.isUploading.set(false)
        }
    }

    async presentToast(message: string, color: string = 'danger') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            color,
            position: 'bottom',
        })
        await toast.present()
    }
}
