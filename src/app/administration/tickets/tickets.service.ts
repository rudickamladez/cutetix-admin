import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Ticket } from './tickets.types';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private API_PATH: string = 'tickets';

  private ticketSource = new Subject<Ticket>();

  public asObservable() {
    return this.ticketSource.asObservable();
  }

  public register(ticket: Ticket) {
    this.ticketSource.next(ticket);
  }

  private deleteSource = new Subject<Ticket>();

  public deleteAsObservable() {
    return this.deleteSource.asObservable();
  }

  public ticketDelete(ticket: Ticket) {
    this.deleteSource.next(ticket);
  }

  constructor(
    private readonly httpClient: HttpClient
  ) {

  }

  public get(): Observable<Ticket[]> {
    return this.httpClient.get(`${environment.backend.api}/${this.API_PATH}/`).pipe(
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
    return this.httpClient.get(
      `${environment.backend.api}/${this.API_PATH}/${id}/`
    ).pipe(
      map(
        (res: any) => {
          return <Ticket>res;
        }
      )
    )
  }

  public create(ticket: Ticket): Observable<Ticket> {
    return this.httpClient.post(
      `${environment.backend.api}/${this.API_PATH}/`,
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
  //     `${environment.backend.api}/${this.API_PATH}/${id}/`,
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
    return this.httpClient.delete(`${environment.backend.api}/${this.API_PATH}/${id}/`).pipe(
      map(
        (res: any) => {
          return <Ticket>res;
        }
      )
    )
  }

  public cancel(ticket: Ticket): Observable<Ticket> {
    return this.httpClient.post(
      `${environment.backend.api}/${this.API_PATH}/cancel/`,
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
