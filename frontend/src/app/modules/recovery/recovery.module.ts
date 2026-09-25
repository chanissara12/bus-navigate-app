import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { RecoveryRoutingModule } from './recovery-routing.module';
import { RecoveryHomeComponent } from './pages/recovery-home/recovery-home.component';

@NgModule({
    declarations: [
        RecoveryHomeComponent
    ],
    imports: [
        CommonModule,
        RecoveryRoutingModule,
        ConfirmDialogComponent
    ]
})
export class RecoveryModule { }
