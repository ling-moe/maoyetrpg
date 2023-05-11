import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CocConfig, RoleCard } from './edit/types';
import { TokenService } from '@core';

@Injectable({
  providedIn: 'root'
})
export class CardToolService {

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
    ) { }

  getJobAndSkill(): Observable<CocConfig>{
    return this.http.get('/assets/data/jobandskill.json').pipe(map(res => res as CocConfig));
  }
//   userid: 3060
// token: a754e87def3811edbf5e52540009a734
// name: rolecard
// rg: coc7

  createRoleCard(roleCard: RoleCard): Observable<any>{
    return this.http.post('/api/rolecard/info', roleCard, {params: {userid: roleCard.userid, token: this.tokenService.getAccessToken(), name: 'rolecard', rg: 'coc7'}, withCredentials: false});
  }
}
