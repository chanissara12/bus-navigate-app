import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TripPlanningHomeComponent } from './pages/trip-planning-home/trip-planning-home.component';

const routes: Routes = [{ path: '', component: TripPlanningHomeComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TripPlanningRoutingModule { }
