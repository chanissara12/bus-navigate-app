import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecoveryRoutingModule } from './recovery-routing.module';
import { RecoveryHomeComponent } from './pages/recovery-home/recovery-home.component';
import { RecoveryVariantAComponent } from './pages/recovery-home/prototype/recovery-variant-a.component';
import { RecoveryVariantBComponent } from './pages/recovery-home/prototype/recovery-variant-b.component';
import { RecoveryVariantCComponent } from './pages/recovery-home/prototype/recovery-variant-c.component';
import { PrototypeSwitcherComponent } from '../../shared/components/prototype-switcher/prototype-switcher.component';


@NgModule({
    declarations: [
        RecoveryHomeComponent
    ],
    imports: [
        CommonModule,
        RecoveryRoutingModule,
        RecoveryVariantAComponent,
        RecoveryVariantBComponent,
        RecoveryVariantCComponent,
        PrototypeSwitcherComponent
    ]
})
export class RecoveryModule { }
