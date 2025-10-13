import { Component } from "@angular/core";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "app-copyright",
  templateUrl: "./copyright.component.html",
  styleUrls: ["./copyright.component.scss"],
  standalone: false,
})
export class CopyrightComponent {
  feelingIcon = faHeart;
  current_date = new Date();
}
