import { Routes } from '@angular/router';

import { sessionIdGuard } from './shared/guards/session-id.guard';

export const routes: Routes = [
    {
        path: 'trip-planning',
        loadChildren: () =>
            import('./modules/trip-planning/trip-planning.module').then((m) => m.TripPlanningModule)
    },
    {
        path: 'bus-stop',
        loadChildren: () => import('./modules/bus-stop/bus-stop.module').then((m) => m.BusStopModule)
    },
    // travel-session/recovery always carry a TravelSession id — a bare path (no id)
    // redirects to trip-planning, same target as an id the guard rejects.
    { path: 'travel-session', pathMatch: 'full', redirectTo: 'trip-planning' },
    {
        path: 'travel-session/:id',
        canActivate: [sessionIdGuard],
        loadChildren: () =>
            import('./modules/travel-session/travel-session.module').then((m) => m.TravelSessionModule)
    },
    { path: 'recovery', pathMatch: 'full', redirectTo: 'trip-planning' },
    {
        path: 'recovery/:id',
        canActivate: [sessionIdGuard],
        loadChildren: () => import('./modules/recovery/recovery.module').then((m) => m.RecoveryModule)
    },
    { path: '', pathMatch: 'full', redirectTo: 'trip-planning' }
];
