import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PrototypeVariant } from '../../../../shared/components/prototype-switcher/prototype-switcher.component';

// PROTOTYPE: three variants of the bus-stop lookup/context view, switchable via
// ?variant=, on the existing /bus-stop route. See .claude/skills/prototype/UI.md and
// .wayfinder/tickets/T13-bus-stop-ui-layout.md. Remove the switcher and losing
// variants once a direction is picked — only the winner should reach main.
const PROTOTYPE_VARIANTS: PrototypeVariant[] = [
    { key: 'A', label: 'List-first accordion' },
    { key: 'B', label: 'Split list + grouped detail' },
    { key: 'C', label: 'Walking-guide focus' }
];

@Component({
    selector: 'app-bus-stop-home',
    templateUrl: './bus-stop-home.component.html',
    styleUrl: './bus-stop-home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusStopHomeComponent {
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
