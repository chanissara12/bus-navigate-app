import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TravelSessionHomeComponent } from './pages/travel-session-home/travel-session-home.component';

const routes: Routes = [{ path: '', component: TravelSessionHomeComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TravelSessionRoutingModule { }
