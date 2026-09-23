import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TripPlanningRoutingModule } from './trip-planning-routing.module';
import { TripPlanningHomeComponent } from './pages/trip-planning-home/trip-planning-home.component';
import { TripPlanningVariantAComponent } from './pages/trip-planning-home/prototype/trip-planning-variant-a.component';
import { TripPlanningVariantBComponent } from './pages/trip-planning-home/prototype/trip-planning-variant-b.component';
import { TripPlanningVariantCComponent } from './pages/trip-planning-home/prototype/trip-planning-variant-c.component';
import { PrototypeSwitcherComponent } from '../../shared/components/prototype-switcher/prototype-switcher.component';


@NgModule({
    declarations: [
        TripPlanningHomeComponent
    ],
    imports: [
        CommonModule,
        TripPlanningRoutingModule,
        TripPlanningVariantAComponent,
        TripPlanningVariantBComponent,
        TripPlanningVariantCComponent,
        PrototypeSwitcherComponent
    ]
})
export class TripPlanningModule { }
