import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import type { Observable } from "rxjs";
import { Subject } from "rxjs";
import { map } from "rxjs/operators";
import { StorageService } from "src/app/services/storage.service";
import { StorageKeys } from "src/app/tokens/storage.tokens";

import type {
  TicketGroup,
  TicketGroupSum,
  TicketGroupUpdate,
} from "./ticket_groups.types";

@Injectable({
  providedIn: "root",
})
export class TicketGroupService {
  private readonly httpClient = inject(HttpClient);

  readonly #storageService = inject(StorageService);
  private API_PATH: string = "ticket_groups";

  private ticket_groupSource = new Subject<TicketGroup>();

  public asObservable(): Observable<TicketGroup> {
    return this.ticket_groupSource.asObservable();
  }

  public register(ticket_group: TicketGroup): void {
    this.ticket_groupSource.next(ticket_group);
  }

  private deleteSource = new Subject<TicketGroup>();

  public deleteAsObservable(): Observable<TicketGroup> {
    return this.deleteSource.asObservable();
  }

  public ticketDelete(ticket_group: TicketGroup): void {
    this.deleteSource.next(ticket_group);
  }

  public get(): Observable<TicketGroup[]> {
    return this.httpClient
      .get(
        new URL(
          `${this.API_PATH}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href
      )
      .pipe(
        map((res: any) => {
          return res.map((result: any) => <TicketGroup[]>result);
        })
      );
  }

  public getById(id: string): Observable<TicketGroup> {
    return this.httpClient
      .get(
        new URL(
          `${this.API_PATH}/${id}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href
      )
      .pipe(
        map((res: any) => {
          return <TicketGroup>res;
        })
      );
  }

  public create(ticket_group: TicketGroup): Observable<TicketGroup> {
    return this.httpClient
      .post(
        new URL(
          `${this.API_PATH}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href,
        ticket_group
      )
      .pipe(
        map((res: any) => {
          return <TicketGroup>res;
        })
      );
  }

  public update(id: string, body: TicketGroupUpdate): Observable<TicketGroup> {
    return this.httpClient
      .put(
        new URL(
          `${this.API_PATH}/${id}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href,
        body
      )
      .pipe(
        map((res: any) => {
          return <TicketGroup>res;
        })
      );
  }

  public delete(id: string): Observable<TicketGroup> {
    return this.httpClient
      .delete(
        new URL(
          `${this.API_PATH}/${id}/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href
      )
      .pipe(
        map((res: any) => {
          return <TicketGroup>res;
        })
      );
  }

  public getActiveSum(): Observable<TicketGroupSum> {
    return this.httpClient
      .get(
        new URL(
          `${this.API_PATH}/active/sum/`,
          this.#storageService.get(StorageKeys.API_URL)!
        ).href
      )
      .pipe(map((ticket_groupSum: any) => <TicketGroupSum>ticket_groupSum));
  }
}
