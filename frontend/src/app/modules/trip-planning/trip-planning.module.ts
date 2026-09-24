import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TripPlanningRoutingModule } from './trip-planning-routing.module';
import { TripPlanningHomeComponent } from './pages/trip-planning-home/trip-planning-home.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';


@NgModule({
    declarations: [
        TripPlanningHomeComponent
    ],
    imports: [
        CommonModule,
        TripPlanningRoutingModule,
        ConfirmDialogComponent
    ]
})
export class TripPlanningModule { }
