import { Pipe, PipeTransform } from '@angular/core'
import { environment } from '../../environments/environment'

@Pipe({
    name: 'backendUrl',
})
export class BackendUrlPipe implements PipeTransform {
    private readonly baseUrl = `http://${environment.host}:${environment.port}/static`

    transform(value: string): string {
        if (!value) return ''
        const cleanPath = value.startsWith('/') ? value.substring(1) : value
        return `${this.baseUrl}/${cleanPath}`
    }
}
