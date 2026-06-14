import { Pipe, PipeTransform } from '@angular/core'
import { environment } from '../../environments/environment'

@Pipe({
    name: 'backendUrl',
})
export class BackendUrlPipe implements PipeTransform {
    private readonly baseUrl = `http://${environment.host}:${environment.port}`

    transform(value: string, basepath: string = ''): string {
        if (!value) return ''
        const cleanPath = value.startsWith('/') ? value.substring(1) : value
        if (basepath.trim().length != 0) {
            return `${this.baseUrl}/${basepath}/${cleanPath}`
        }
        return `${this.baseUrl}/${cleanPath}`
    }
}
