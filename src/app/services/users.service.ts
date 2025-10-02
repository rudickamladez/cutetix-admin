import { inject, Injectable, OnInit, signal } from "@angular/core";

// import { Socket } from "ngx-socket-io";
import { ToastrService } from "ngx-toastr";

import { equal } from "../utils/deepEqual";
import { LoggingService } from "./logging.service";
import { User } from "../types/auth.types";
import { map, Observable } from "rxjs";
import { StorageKeys } from "../tokens/storage.tokens";
import { StorageService } from "./storage.service";
import { HttpClient } from "@angular/common/http";

@Injectable({
    providedIn: "root"
})
export class UsersService implements OnInit {
    readonly #toastr = inject(ToastrService);
    // readonly #socket = inject(Socket);
    readonly #logging = inject(LoggingService);

    readonly #user = signal<User | null>(null, { equal });
    readonly user = this.#user.asReadonly();

    private API_PATH: string = "users";
    readonly #storageService = inject(StorageService);
    readonly #httpClient = inject(HttpClient)


    ngOnInit(
    ) {
        // this.#socket.on("user_update", (data: any) => {
        //     this.#logging.debug("User update received", data);
        //     this.#user.set(data);
        //     this.#toastr.info("Your user information has been updated", "User Update");
        // });

        // maybe unsubscribe on destroy???
        this.getMe().subscribe({
            next: (user) => {
                this.#user.set(user);
                this.#logging.log("user", "User info loaded", user);
            },
            error: (err) => {
                this.#logging.error("user", "Failed to get user info", err);
                this.#toastr.error("Failed to get user info", err.message || err.statusText || "Unknown error");
            }
        });
    }

    public getMe(): Observable<User> {
        return this.#httpClient.get(
            new URL(`${this.API_PATH}/me/`, this.#storageService.get(StorageKeys.API_URL)!).href,
        ).pipe(
            map(
                (res: any) => { return <User>res; }
            )
        );
    }
}