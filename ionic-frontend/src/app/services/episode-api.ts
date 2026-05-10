import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from '@lib/rxjs/dist/types'

export interface EpisodeComment {
    user: string
    text: string
}

export interface Episode {
    id: bigint
    title: string
    description: string
    videuUrl: string
    comments: EpisodeComment[]
}

@Injectable({
    providedIn: 'root',
})
export class EpisodeApi {
    private apiUrl = 'http://localhost:3000'

    constructor(private http: HttpClient) {}

    getEpisode(id: number): Observable<Episode> {
        return this.http.get<Episode>(`${this.apiUrl}/api/episodes/${id}`)
    }
}
