import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CocConfig, PageRequest, RoleCard } from './edit/types';
import { TokenService } from '@core';

@Injectable({
  providedIn: 'root',
})
export class CardToolService {
  constructor(private http: HttpClient, private tokenService: TokenService) {}

  getJobAndSkill(): Observable<CocConfig> {
    return this.http.get('/assets/data/jobandskill.json').pipe(map(res => res as CocConfig));
  }

  createRoleCard(roleCard: RoleCard): Observable<any> {
    return this.http.post('/api/rolecard/info', roleCard, {
      params: { name: 'rolecard', rg: 'coc7' },
    });
  }

  listRoleCard(pageRequest: PageRequest): Observable<RoleCard[]> {
    return this.http
      .get('/api/rolecard/list', {
        params: {
          name: 'rolecard',
          filter: JSON.stringify({ userid: this.tokenService.simpleUser().userid }),
          ...pageRequest,
        },
      })
      .pipe(map(res => res as RoleCard[]));
  }

  detailRoleCard(chartId: string): Observable<RoleCard> {
    return this.http
      .post('/api/rolecard/get', { chartid: chartId }, { params: { name: 'rolecard' } })
      .pipe(map((res: any) => res[0] as RoleCard));
  }
}
