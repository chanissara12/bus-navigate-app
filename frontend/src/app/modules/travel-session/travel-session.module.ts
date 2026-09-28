import { NgModule } from '@angular/core';

import { TravelSessionRoutingModule } from './travel-session-routing.module';
import { TravelSessionHomeComponent } from './pages/travel-session-home/travel-session-home.component';
import { RouteMapCardComponent } from '../../shared/components/route-map-card/route-map-card.component';

@NgModule({
    imports: [
        TravelSessionRoutingModule,
        TravelSessionHomeComponent,
        RouteMapCardComponent
    ]
})
export class TravelSessionModule { }
