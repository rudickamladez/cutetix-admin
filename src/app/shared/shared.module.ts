import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInfoComponent } from '../components/user-info/user-info.component';
import { CopyrightComponent } from '../components/copyright/copyright.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormatScopesPipe } from '../format-scopes.pipe';
import { TableSearchComponent } from '../components/table-search/table-search.component';
import { TableSortHeaderComponent } from '../components/table-sort-header/table-sort-header.component';
import { DialogModule } from '@angular/cdk/dialog';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';

@NgModule({
    imports: [
        CommonModule,
        DialogModule,
        FontAwesomeModule,
        FormatScopesPipe,
        UserInfoComponent,
        CopyrightComponent,
        TableSearchComponent,
        TableSortHeaderComponent,
        ConfirmDialogComponent,
    ],
    exports: [
        UserInfoComponent,
        CopyrightComponent,
        TableSearchComponent,
        TableSortHeaderComponent,
        ConfirmDialogComponent,
    ],
})
export class SharedModule { }
