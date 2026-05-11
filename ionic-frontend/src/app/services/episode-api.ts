import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from '@lib/rxjs/dist/types'
import { Episode, Comment } from '@app/models/interfaces'

@Injectable({
    providedIn: 'root',
})
export class EpisodeApi {
    constructor(private http: HttpClient) {}

    getEpisode(id: number): Observable<Episode> {
        return this.http.get<Episode>(`api/episode/${id}`)
    }
}

export { Episode };