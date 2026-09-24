import { NgModule } from '@angular/core';

import { TravelSessionRoutingModule } from './travel-session-routing.module';
import { TravelSessionHomeComponent } from './pages/travel-session-home/travel-session-home.component';

@NgModule({
    imports: [
        TravelSessionRoutingModule,
        TravelSessionHomeComponent
    ]
})
export class TravelSessionModule { }
