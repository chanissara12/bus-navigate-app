import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BusStopRoutingModule } from './bus-stop-routing.module';
import { BusStopHomeComponent } from './pages/bus-stop-home/bus-stop-home.component';
import { BusStopVariantAComponent } from './pages/bus-stop-home/prototype/bus-stop-variant-a.component';
import { BusStopVariantBComponent } from './pages/bus-stop-home/prototype/bus-stop-variant-b.component';
import { BusStopVariantCComponent } from './pages/bus-stop-home/prototype/bus-stop-variant-c.component';
import { PrototypeSwitcherComponent } from '../../shared/components/prototype-switcher/prototype-switcher.component';


@NgModule({
    declarations: [
        BusStopHomeComponent
    ],
    imports: [
        CommonModule,
        BusStopRoutingModule,
        BusStopVariantAComponent,
        BusStopVariantBComponent,
        BusStopVariantCComponent,
        PrototypeSwitcherComponent
    ]
})
export class BusStopModule { }
