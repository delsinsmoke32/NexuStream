import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
    name: 'backendUrl',
})
export class BackendUrlPipe implements PipeTransform {
    private readonly baseUrl = 'http://localhost:3000'

    transform(value: string): string {
        if (!value) return ''
        const cleanPath = value.startsWith('/') ? value.substring(1) : value
        return `${this.baseUrl}/${cleanPath}`
    }
}
