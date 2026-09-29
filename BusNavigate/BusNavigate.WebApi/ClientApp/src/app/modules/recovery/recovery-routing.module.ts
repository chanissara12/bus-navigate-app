import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RecoveryHomeComponent } from './pages/recovery-home/recovery-home.component';

const routes: Routes = [{ path: '', component: RecoveryHomeComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RecoveryRoutingModule { }
