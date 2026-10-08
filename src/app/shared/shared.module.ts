import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInfoComponent } from '../components/user-info/user-info.component';
import { CopyrightComponent } from '../components/copyright/copyright.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormatScopesPipe } from '../format-scopes.pipe';
import { TableSearchComponent } from '../components/table-search/table-search.component';
import { TableSortHeaderComponent } from '../components/table-sort-header/table-sort-header.component';

@NgModule({
    declarations: [
        UserInfoComponent,
        CopyrightComponent,
        TableSearchComponent,
        TableSortHeaderComponent,
    ],
    imports: [
        CommonModule,
        FontAwesomeModule,
        FormatScopesPipe,
    ],
    exports: [
        UserInfoComponent,
        CopyrightComponent,
        TableSearchComponent,
        TableSortHeaderComponent,
    ],
})
export class SharedModule { }
