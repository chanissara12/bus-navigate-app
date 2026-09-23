import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BusStopRoutingModule } from './bus-stop-routing.module';
import { BusStopHomeComponent } from './pages/bus-stop-home/bus-stop-home.component';


@NgModule({
    declarations: [
        BusStopHomeComponent
    ],
    imports: [
        CommonModule,
        BusStopRoutingModule
    ]
})
export class BusStopModule { }
