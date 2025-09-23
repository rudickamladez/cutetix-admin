import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Event } from './events.types';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private API_PATH: string = 'events';

  private eventSource = new Subject<Event>();

  public asObservable() {
    return this.eventSource.asObservable();
  }

  public register(event: Event) {
    this.eventSource.next(event);
  }

  private deleteSource = new Subject<Event>();

  public deleteAsObservable() {
    return this.deleteSource.asObservable();
  }

  public ticketDelete(event: Event) {
    this.deleteSource.next(event);
  }

  constructor(
    private readonly httpClient: HttpClient
  ) {

  }

  public get(): Observable<Event[]> {
    return this.httpClient.get(`${environment.backend.api}/${this.API_PATH}/`).pipe(
      map(
        (res: any) => {
          return res.map(
            (result: any) => <Event[]>result
          );
        }
      )
    );
  }

  public getById(
    id: string
  ): Observable<Event> {
    return this.httpClient.get(
      `${environment.backend.api}/${this.API_PATH}/${id}/`
    ).pipe(
      map(
        (res: any) => {
          return <Event>res;
        }
      )
    )
  }

  public create(event: Event): Observable<Event> {
    return this.httpClient.post(
      `${environment.backend.api}/${this.API_PATH}/`,
      event
    ).pipe(
      map(
        (res: any) => {
          return <Event>res;
        }
      )
    )
  }

  public update(
    id: string,
    body: Event
  ): Observable<Event> {
    return this.httpClient.patch(
      `${environment.backend.api}/${this.API_PATH}/${id}/`,
      body
    ).pipe(
      map(
        (res: any) => {
          return <Event>res;
        }
      )
    )
  }

  // public delete(id: string): Observable<Event> {
  //   return this.httpClient.delete(`${environment.backend.api}/${this.API_PATH}/${id}/`).pipe(
  //     map(
  //       (res: any) => {
  //         return <Event>res;
  //       }
  //     )
  //   )
  // }
}
