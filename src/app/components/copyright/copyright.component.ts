import { Component } from "@angular/core";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { DatePipe } from "@angular/common";

@Component({
    selector: 'app-copyright',
    templateUrl: './copyright.component.html',
    styleUrls: ['./copyright.component.scss'],
    imports: [FaIconComponent, DatePipe],
})
export class CopyrightComponent {
    protected readonly feelingIcon = faHeart;
    protected readonly current_date = new Date();
}