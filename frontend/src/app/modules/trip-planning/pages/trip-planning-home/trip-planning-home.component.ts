import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PrototypeVariant } from '../../../../shared/components/prototype-switcher/prototype-switcher.component';

// PROTOTYPE: three variants of the trip-planning search/results view, switchable
// via ?variant=, on the existing /trip-planning route. See
// .claude/skills/prototype/UI.md. Remove the switcher and losing variants once a
// direction is picked — only the winner should reach main.
const PROTOTYPE_VARIANTS: PrototypeVariant[] = [
    { key: 'A', label: 'List-first' },
    { key: 'B', label: 'Split map + list' },
    { key: 'C', label: 'Comparison carousel' }
];

@Component({
    selector: 'app-trip-planning-home',
    templateUrl: './trip-planning-home.component.html',
    styleUrl: './trip-planning-home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripPlanningHomeComponent {
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
