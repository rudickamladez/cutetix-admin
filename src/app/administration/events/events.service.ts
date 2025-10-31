import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import type { Observable } from "rxjs";
import { Subject } from "rxjs";
import { map } from "rxjs/operators";
import { StorageService } from "src/app/services/storage.service";
import { StorageKeys } from "src/app/tokens/storage.tokens";

import type { Event, EventCapacitySummary } from "./events.types";

@Injectable({
  providedIn: "root",
})
export class EventService {
  private readonly httpClient = inject(HttpClient);

  private API_PATH: string = "events";
  readonly #storageService = inject(StorageService);

  private eventSource = new Subject<Event>();

  public asObservable(): Observable<Event> {
    return this.eventSource.asObservable();
  }

  public register(event: Event): void {
    this.eventSource.next(event);
  }

  private deleteSource = new Subject<Event>();

  public deleteAsObservable(): Observable<Event> {
    return this.deleteSource.asObservable();
  }

  public ticketDelete(event: Event): void {
    this.deleteSource.next(event);
  }

  public get(): Observable<Event[]> {
    return this.httpClient
      .get(
        new URL(
          `${this.API_PATH}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href
      )
      .pipe(
        map((res: any) => {
          return res.map((result: any) => <Event[]>result);
        })
      );
  }

  public getById(id: string): Observable<Event> {
    return this.httpClient
      .get(
        new URL(
          `${this.API_PATH}/${id}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href
      )
      .pipe(
        map((res: any) => {
          return <Event>res;
        })
      );
  }

  public create(event: Event): Observable<Event> {
    return this.httpClient
      .post(
        new URL(
          `${this.API_PATH}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href,
        event
      )
      .pipe(
        map((res: any) => {
          return <Event>res;
        })
      );
  }

  public update(id: string, body: Event): Observable<Event> {
    return this.httpClient
      .patch(
        new URL(
          `${this.API_PATH}/${id}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href,
        body
      )
      .pipe(
        map((res: any) => {
          return <Event>res;
        })
      );
  }

  // public delete(id: string): Observable<Event> {
  //   return this.httpClient.delete(
  //     new URL(`${this.API_PATH}/${id}/`, this.#storageService.get(StorageKeys.API_URL)!).href,
  //   ).pipe(
  //     map(
  //       (res: any) => {
  //         return <Event>res;
  //       }
  //     )
  //   )
  // }

  public capacitySummaryById(id: string): Observable<EventCapacitySummary> {
    return this.httpClient
      .get(
        new URL(
          `${this.API_PATH}/capacity_summary/${id}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href
      )
      .pipe(
        map((res: any) => {
          return <EventCapacitySummary>res;
        })
      );
  }
}
