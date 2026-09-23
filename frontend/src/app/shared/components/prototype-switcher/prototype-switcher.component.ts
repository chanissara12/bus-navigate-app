// PROTOTYPE ONLY — throwaway UI-variant switcher. Do not fold into production code;
// see .claude/skills/prototype/UI.md. Hidden automatically outside dev builds.
import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import { environment } from '../../../../environments/environment';

export interface PrototypeVariant {
    key: string;
    label: string;
}

@Component({
    selector: 'app-prototype-switcher',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './prototype-switcher.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrototypeSwitcherComponent {
    @Input({ required: true }) variants: PrototypeVariant[] = [];
    @Input({ required: true }) current = '';
    @Output() currentChange = new EventEmitter<string>();

    readonly isDev = !environment.production;

    get currentIndex(): number {
        return this.variants.findIndex((v) => v.key === this.current);
    }

    get currentVariant(): PrototypeVariant | undefined {
        return this.variants[this.currentIndex];
    }

    previous(): void {
        const count = this.variants.length;
        const nextIndex = (this.currentIndex - 1 + count) % count;
        this.currentChange.emit(this.variants[nextIndex].key);
    }

    next(): void {
        const count = this.variants.length;
        const nextIndex = (this.currentIndex + 1) % count;
        this.currentChange.emit(this.variants[nextIndex].key);
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;
        const isEditable =
            target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
        if (isEditable || !this.isDev) {
            return;
        }

        if (event.key === 'ArrowLeft') {
            this.previous();
        } else if (event.key === 'ArrowRight') {
            this.next();
        }
    }
}
