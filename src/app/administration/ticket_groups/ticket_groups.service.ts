import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { TicketGroup, TicketGroupSum, TicketGroupUpdate } from './ticket_groups.types';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketGroupService {
  private API_PATH: string = 'ticket_groups';

  private ticket_groupSource = new Subject<TicketGroup>();

  public asObservable() {
    return this.ticket_groupSource.asObservable();
  }

  public register(ticket_group: TicketGroup) {
    this.ticket_groupSource.next(ticket_group);
  }

  private deleteSource = new Subject<TicketGroup>();

  public deleteAsObservable() {
    return this.deleteSource.asObservable();
  }

  public ticketDelete(ticket_group: TicketGroup) {
    this.deleteSource.next(ticket_group);
  }

  constructor(
    private readonly httpClient: HttpClient
  ) {

  }

  public get(): Observable<TicketGroup[]> {
    return this.httpClient.get(`${environment.backend.api}/${this.API_PATH}/`).pipe(
      map(
        (res: any) => {
          return res.map(
            (result: any) => <TicketGroup[]>result
          );
        }
      )
    );
  }

  public getById(
    id: string
  ): Observable<TicketGroup> {
    return this.httpClient.get(
      `${environment.backend.api}/${this.API_PATH}/${id}/`
    ).pipe(
      map(
        (res: any) => {
          return <TicketGroup>res;
        }
      )
    )
  }

  public create(ticket_group: TicketGroup): Observable<TicketGroup> {
    return this.httpClient.post(
      `${environment.backend.api}/${this.API_PATH}/`,
      ticket_group
    ).pipe(
      map(
        (res: any) => {
          return <TicketGroup>res;
        }
      )
    )
  }

  public update(
    id: string,
    body: TicketGroupUpdate
  ): Observable<TicketGroup> {
    return this.httpClient.put(
      `${environment.backend.api}/${this.API_PATH}/${id}/`,
      body
    ).pipe(
      map(
        (res: any) => {
          return <TicketGroup>res;
        }
      )
    )
  }

  public delete(id: string): Observable<TicketGroup> {
    return this.httpClient.delete(`${environment.backend.api}/${this.API_PATH}/${id}/`).pipe(
      map(
        (res: any) => {
          return <TicketGroup>res;
        }
      )
    )
  }

  public getActiveSum(): Observable<TicketGroupSum> {
    return this.httpClient.get(`${environment.backend.api}/${this.API_PATH}/active/sum`).pipe(
      map(
        (ticket_groupSum: any) => <TicketGroupSum>ticket_groupSum
      )
    );
  }
}
