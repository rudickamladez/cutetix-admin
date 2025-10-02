import { inject, Injectable, signal } from "@angular/core";

// import { Socket } from "ngx-socket-io";
import { ToastrService } from "ngx-toastr";

import { equal } from "../utils/deepEqual";
import { LoggingService } from "./logging.service";
import { User } from "../types/auth.types";

@Injectable()
export class UsersService {
    readonly #toastr = inject(ToastrService);
    // readonly #socket = inject(Socket);
    readonly #logging = inject(LoggingService);

    readonly #user = signal<User | null>(null, { equal });
    readonly user = this.#user.asReadonly();
}