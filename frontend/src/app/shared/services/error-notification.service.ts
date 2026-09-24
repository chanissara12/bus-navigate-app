import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// Note: per-call catchError blocks stay where they are (they know call-site context
// for a good message) — they report here instead of a global HTTP-error interceptor,
// which would have no context to translate an error into a useful message.
@Injectable({ providedIn: 'root' })
export class ErrorNotificationService {
    private readonly errorsSubject = new Subject<string>();

    readonly errors$: Observable<string> = this.errorsSubject.asObservable();

    notify(message: string): void {
        this.errorsSubject.next(message);
    }
}
