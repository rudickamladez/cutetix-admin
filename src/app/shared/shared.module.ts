// shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInfoComponent } from '../components/user-info/component';

@NgModule({
    declarations: [UserInfoComponent],
    imports: [CommonModule],
    exports: [UserInfoComponent],
})
export class SharedModule { }
