import { TestBed } from '@angular/core/testing'

import { EpisodeApi } from './episode-api'

describe('EpisodeApi', () => {
    let service: EpisodeApi

    beforeEach(() => {
        TestBed.configureTestingModule({})
        service = TestBed.inject(EpisodeApi)
    })

    it('should be created', () => {
        expect(service).toBeTruthy()
    })
})
