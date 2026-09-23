import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TravelSessionRoutingModule } from './travel-session-routing.module';
import { TravelSessionHomeComponent } from './pages/travel-session-home/travel-session-home.component';


@NgModule({
    declarations: [
        TravelSessionHomeComponent
    ],
    imports: [
        CommonModule,
        TravelSessionRoutingModule
    ]
})
export class TravelSessionModule { }
