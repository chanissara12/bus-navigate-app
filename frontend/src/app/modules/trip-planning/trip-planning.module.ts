import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TripPlanningRoutingModule } from './trip-planning-routing.module';
import { TripPlanningHomeComponent } from './pages/trip-planning-home/trip-planning-home.component';


@NgModule({
    declarations: [
        TripPlanningHomeComponent
    ],
    imports: [
        CommonModule,
        TripPlanningRoutingModule
    ]
})
export class TripPlanningModule { }
