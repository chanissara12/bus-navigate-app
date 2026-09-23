import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BusStopHomeComponent } from './pages/bus-stop-home/bus-stop-home.component';

const routes: Routes = [{ path: '', component: BusStopHomeComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BusStopRoutingModule { }
