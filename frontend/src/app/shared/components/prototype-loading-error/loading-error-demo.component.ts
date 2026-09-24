// PROTOTYPE — F04: three variants of skeleton-loading + error-banner treatment,
// switchable via ?loadingVariant= (kept separate from a host page's own ?variant=
// layout param so the two prototypes don't collide). See
// .claude/skills/prototype/UI.md and .wayfinder/tickets/F04-loading-error-ui-patterns.md.
// Remove this whole folder and its usages once a direction is picked.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { LoadingErrorVariantAComponent } from './loading-error-variant-a.component';
import { LoadingErrorVariantBComponent } from './loading-error-variant-b.component';
import { LoadingErrorVariantCComponent } from './loading-error-variant-c.component';
import { LoadingErrorVariantDComponent } from './loading-error-variant-d.component';

const VARIANTS = [
    { key: 'A', label: 'Minimal inline banner' },
    { key: 'B', label: 'Shimmer cards + top banner stack' },
    { key: 'C', label: 'Generic blocks + bottom-right toasts' },
    { key: 'D', label: 'Shimmer cards + contextual banner near action' }
];

@Component({
    selector: 'app-loading-error-demo',
    standalone: true,
    imports: [
        CommonModule,
        LoadingErrorVariantAComponent,
        LoadingErrorVariantBComponent,
        LoadingErrorVariantCComponent,
        LoadingErrorVariantDComponent
    ],
    templateUrl: './loading-error-demo.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingErrorDemoComponent {
    readonly variants = VARIANTS;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router
    ) {}

    get variant(): string {
        const requested = this.route.snapshot.queryParamMap.get('loadingVariant');
        const isKnown = VARIANTS.some((v) => v.key === requested);
        return isKnown ? (requested as string) : 'A';
    }

    get currentLabel(): string {
        return VARIANTS.find((v) => v.key === this.variant)?.label ?? '';
    }

    previous(): void {
        this.cycle(-1);
    }

    next(): void {
        this.cycle(1);
    }

    private cycle(step: number): void {
        const currentIndex = VARIANTS.findIndex((v) => v.key === this.variant);
        const nextIndex = (currentIndex + step + VARIANTS.length) % VARIANTS.length;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { loadingVariant: VARIANTS[nextIndex].key },
            queryParamsHandling: 'merge'
        });
    }
}
