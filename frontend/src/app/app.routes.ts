import { Routes } from '@angular/router';

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
    {
        path: 'travel-session',
        loadChildren: () =>
            import('./modules/travel-session/travel-session.module').then((m) => m.TravelSessionModule)
    },
    {
        path: 'recovery',
        loadChildren: () => import('./modules/recovery/recovery.module').then((m) => m.RecoveryModule)
    },
    { path: '', pathMatch: 'full', redirectTo: 'trip-planning' }
];
