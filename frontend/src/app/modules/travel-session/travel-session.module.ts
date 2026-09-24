import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TravelSessionRoutingModule } from './travel-session-routing.module';
import { TravelSessionHomeComponent } from './pages/travel-session-home/travel-session-home.component';
import { TravelSessionVariantAComponent } from './pages/travel-session-home/prototype/travel-session-variant-a.component';
import { TravelSessionVariantBComponent } from './pages/travel-session-home/prototype/travel-session-variant-b.component';
import { TravelSessionVariantCComponent } from './pages/travel-session-home/prototype/travel-session-variant-c.component';
import { PrototypeSwitcherComponent } from '../../shared/components/prototype-switcher/prototype-switcher.component';


@NgModule({
    declarations: [
        TravelSessionHomeComponent
    ],
    imports: [
        CommonModule,
        TravelSessionRoutingModule,
        TravelSessionVariantAComponent,
        TravelSessionVariantBComponent,
        TravelSessionVariantCComponent,
        PrototypeSwitcherComponent
    ]
})
export class TravelSessionModule { }
