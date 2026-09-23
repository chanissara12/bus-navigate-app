import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PrototypeVariant } from '../../../../shared/components/prototype-switcher/prototype-switcher.component';

// PROTOTYPE: three variants of the wrong-bus recovery view, switchable via
// ?variant=, on the existing /recovery route. See .claude/skills/prototype/UI.md and
// .wayfinder/tickets/T15-recovery-ui-layout.md. Remove the switcher and losing
// variants once a direction is picked — only the winner should reach main.
const PROTOTYPE_VARIANTS: PrototypeVariant[] = [
    { key: 'A', label: 'List-first sectioned' },
    { key: 'B', label: 'Split list + reasons detail' },
    { key: 'C', label: 'Tiered urgency stack' }
];

@Component({
    selector: 'app-recovery-home',
    templateUrl: './recovery-home.component.html',
    styleUrl: './recovery-home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecoveryHomeComponent {
    readonly prototypeVariants = PROTOTYPE_VARIANTS;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router
    ) {}

    get variant(): string {
        const requested = this.route.snapshot.queryParamMap.get('variant');
        const isKnown = PROTOTYPE_VARIANTS.some((v) => v.key === requested);
        return isKnown ? (requested as string) : 'A';
    }

    onVariantChange(key: string): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { variant: key },
            queryParamsHandling: 'merge'
        });
    }
}
