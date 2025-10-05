// shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInfoComponent } from '../components/user-info/user-info.component';
import { CopyrightComponent } from '../components/copyright/copyright.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
    declarations: [
        UserInfoComponent,
        CopyrightComponent,
    ],
    imports: [
        CommonModule,
        FontAwesomeModule,
    ],
    exports: [
        UserInfoComponent,
        CopyrightComponent,
    ],
})
export class SharedModule { }
