import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { RouteMapCardComponent } from '../../shared/components/route-map-card/route-map-card.component';
import { RecoveryRoutingModule } from './recovery-routing.module';
import { RecoveryHomeComponent } from './pages/recovery-home/recovery-home.component';

@NgModule({
    declarations: [
        RecoveryHomeComponent
    ],
    imports: [
        CommonModule,
        RecoveryRoutingModule,
        ConfirmDialogComponent,
        RouteMapCardComponent
    ]
})
export class RecoveryModule { }
