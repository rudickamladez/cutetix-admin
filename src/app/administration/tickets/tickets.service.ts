import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import type { Observable } from "rxjs";
import { Subject } from "rxjs";
import { map } from "rxjs/operators";
import { StorageService } from "src/app/services/storage.service";
import { StorageKeys } from "src/app/tokens/storage.tokens";

import type { Ticket } from "./tickets.types";

@Injectable({
  providedIn: "root",
})
export class TicketService {
  private readonly httpClient = inject(HttpClient);

  readonly #storageService = inject(StorageService);
  private API_PATH: string = "tickets";

  private ticketSource = new Subject<Ticket>();

  public asObservable(): Observable<Ticket> {
    return this.ticketSource.asObservable();
  }

  public register(ticket: Ticket): void {
    this.ticketSource.next(ticket);
  }

  private deleteSource = new Subject<Ticket>();

  public deleteAsObservable(): Observable<Ticket> {
    return this.deleteSource.asObservable();
  }

  public ticketDelete(ticket: Ticket): void {
    this.deleteSource.next(ticket);
  }

  public get(): Observable<Ticket[]> {
    return this.httpClient
      .get(
        new URL(
          `${this.API_PATH}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href
      )
      .pipe(
        map((res: any) => {
          return res.map((result: any) => <Ticket[]>result);
        })
      );
  }

  public getById(id: string): Observable<Ticket> {
    return this.httpClient
      .get(
        new URL(
          `${this.API_PATH}/${id}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href
      )
      .pipe(
        map((res: any) => {
          return <Ticket>res;
        })
      );
  }

  public create(ticket: Ticket): Observable<Ticket> {
    return this.httpClient
      .post(
        new URL(
          `${this.API_PATH}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href,
        ticket
      )
      .pipe(
        map((res: any) => {
          return <Ticket>res;
        })
      );
  }

  // public update(
  //   id: string,
  //   body: Ticket
  // ): Observable<Ticket> {
  //   return this.httpClient.patch(
  //     new URL(`${this.API_PATH}/${id}/`, this.#storageService.get(StorageKeys.API_URL)!).href,
  //     body
  //   ).pipe(
  //     map(
  //       (res: any) => {
  //         return <Ticket>res;
  //       }
  //     )
  //   )
  // }

  public delete(id: string): Observable<Ticket> {
    return this.httpClient
      .delete(
        new URL(
          `${this.API_PATH}/${id}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href
      )
      .pipe(
        map((res: any) => {
          return <Ticket>res;
        })
      );
  }

  public cancel(ticket: Ticket): Observable<Ticket> {
    return this.httpClient
      .post(
        new URL(
          `${this.API_PATH}/cancel/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href,
        {
          id: ticket.id,
          email: ticket.email,
        }
      )
      .pipe(
        map((res: any) => {
          return <Ticket>res;
        })
      );
  }
}
