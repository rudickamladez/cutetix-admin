/* eslint-disable  @typescript-eslint/no-explicit-any */

// import { Injectable, isDevMode } from "@angular/core";
import { Injectable } from "@angular/core";

const interestedFields = ["auth", "ws", "swUpdate", "user"] as const;

export type Fields = typeof interestedFields[number];

@Injectable({
    providedIn: "root"
})
export class LoggingService {
    readonly #output = true;
    // readonly #output = !isDevMode();
    readonly #interestedFields = new Set<Fields>(["auth", "ws", "swUpdate", "user"]);

    log(field: Fields, message?: any, ...optionalParams: any[]) {
        if (this.#output && this.#interestedFields.has(field)) {
            console.log(`[${field}]`, message, ...optionalParams);
        }
    }

    error(field: Fields, message?: any, ...optionalParams: any[]) {
        if (this.#output && this.#interestedFields.has(field)) {
            console.error(`[${field}]`, message, ...optionalParams);
        }
    }
}
