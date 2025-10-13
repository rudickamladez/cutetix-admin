// shared/shared.module.ts
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

import { CopyrightComponent } from "../components/copyright/copyright.component";
import { UserInfoComponent } from "../components/user-info/user-info.component";

@NgModule({
  declarations: [UserInfoComponent, CopyrightComponent],
  imports: [CommonModule, FontAwesomeModule],
  exports: [UserInfoComponent, CopyrightComponent],
})
export class SharedModule {}
