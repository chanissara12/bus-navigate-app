import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PrototypeVariant } from '../../../../shared/components/prototype-switcher/prototype-switcher.component';

// PROTOTYPE: three variants of the active-trip tracking view, switchable via
// ?variant=, on the existing /travel-session route. See
// .claude/skills/prototype/UI.md and
// .wayfinder/tickets/T14-travel-session-ui-layout.md. Remove the switcher and losing
// variants once a direction is picked — only the winner should reach main.
const PROTOTYPE_VARIANTS: PrototypeVariant[] = [
    { key: 'A', label: 'Single status card' },
    { key: 'B', label: 'Step timeline' },
    { key: 'C', label: 'Full-screen state takeover' }
];

@Component({
    selector: 'app-travel-session-home',
    templateUrl: './travel-session-home.component.html',
    styleUrl: './travel-session-home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelSessionHomeComponent {
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
