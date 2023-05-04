import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CardToolService {

  constructor(private http: HttpClient) { }

  getJobAndSkill(): Observable<any>{
    return this.http.get('/assets/data/jobandskill.json');
  }
}
