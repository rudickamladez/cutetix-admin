import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Ticket } from './tickets.types';
import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { StorageService } from 'src/app/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  readonly #httpClient = inject(HttpClient);

  readonly #storageService = inject(StorageService);
  #API_PATH: string = 'tickets';

  #ticketSource = new Subject<Ticket>();

  public asObservable() {
    return this.#ticketSource.asObservable();
  }

  public register(ticket: Ticket) {
    this.#ticketSource.next(ticket);
  }

  #deleteSource = new Subject<Ticket>();

  public deleteAsObservable() {
    return this.#deleteSource.asObservable();
  }

  public ticketDelete(ticket: Ticket) {
    this.#deleteSource.next(ticket);
  }

  public get(): Observable<Ticket[]> {
    return this.#httpClient.get(
      new URL(`${this.#API_PATH}/`, this.#storageService.get(StorageKeys.API_URL)!).href,
    ).pipe(
      map(
        (res: any) => {
          return res.map(
            (result: any) => <Ticket[]>result
          );
        }
      )
    );
  }

  public getById(
    id: string
  ): Observable<Ticket> {
    return this.#httpClient.get(
      new URL(`${this.#API_PATH}/${id}/`, this.#storageService.get(StorageKeys.API_URL)!).href,
    ).pipe(
      map(
        (res: any) => {
          return <Ticket>res;
        }
      )
    )
  }

  public create(ticket: Ticket): Observable<Ticket> {
    return this.#httpClient.post(
      new URL(`${this.#API_PATH}/`, this.#storageService.get(StorageKeys.API_URL)!).href,
      ticket
    ).pipe(
      map(
        (res: any) => {
          return <Ticket>res;
        }
      )
    )
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
    return this.#httpClient.delete(
      new URL(`${this.#API_PATH}/${id}/`, this.#storageService.get(StorageKeys.API_URL)!).href,
    ).pipe(
      map(
        (res: any) => {
          return <Ticket>res;
        }
      )
    )
  }

  public cancel(ticket: Ticket): Observable<Ticket> {
    return this.#httpClient.post(
      new URL(`${this.#API_PATH}/cancel/`, this.#storageService.get(StorageKeys.API_URL)!).href,
      {
        id: ticket.id,
        email: ticket.email,
      }
    ).pipe(
      map(
        (res: any) => {
          return <Ticket>res;
        }
      )
    )
  }
}
