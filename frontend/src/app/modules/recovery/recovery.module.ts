import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecoveryRoutingModule } from './recovery-routing.module';
import { RecoveryHomeComponent } from './pages/recovery-home/recovery-home.component';


@NgModule({
    declarations: [
        RecoveryHomeComponent
    ],
    imports: [
        CommonModule,
        RecoveryRoutingModule
    ]
})
export class RecoveryModule { }
