import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { ActiveSessionService } from '../../services/active-session.service';

type NavTab = 'trip-planning' | 'bus-stop' | 'travel-session' | undefined;

function tabForUrl(url: string): NavTab {
    if (url.startsWith('/trip-planning')) {
        return 'trip-planning';
    }
    if (url.startsWith('/bus-stop')) {
        return 'bus-stop';
    }
    if (url.startsWith('/travel-session')) {
        return 'travel-session';
    }
    return undefined;
}

// Persistent bottom-tab nav (map-frontend.md's charted Notes). recovery is
// intentionally not a tab — reached only via a CTA from the MISBOARDED state.
@Component({
    selector: 'app-bottom-nav',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './bottom-nav.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BottomNavComponent {
    readonly activeTab$: Observable<NavTab>;

    constructor(
        private readonly router: Router,
        private readonly activeSessionService: ActiveSessionService
    ) {
        this.activeTab$ = this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            map((event) => tabForUrl(event.urlAfterRedirects)),
            startWith(tabForUrl(this.router.url))
        );
    }

    // travel-session has no static route to link to — it needs the persisted session
    // id first, so this reads ActiveSessionService (F02) instead of a [routerLink].
    onTravelSessionTabClick(): void {
        const activeSessionId = this.activeSessionService.getActiveSessionId();
        const commands = activeSessionId !== undefined ? ['/travel-session', activeSessionId] : ['/trip-planning'];
        this.router.navigate(commands);
    }
}
