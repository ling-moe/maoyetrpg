import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Result, Token, User } from './interface';
import { Menu } from '@core';
import { map } from 'rxjs/operators';
import { MD5 } from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(protected http: HttpClient) {}

  login(username: string, password: string) {

    return this.http.post<Token>('/api/user/login', { email: username, pswmd5: MD5(password).toString(), timestamp: Date.now(), device_type: 1 });
  }

  refresh(params: Record<string, any>) {
    return this.http.post<Token>('/auth/refresh', params);
  }

  logout() {
    return this.http.post<any>('/auth/logout', {});
  }

  // me() {
  //   return this.http.get<User>('/me');
  // }

  menu() {
    return this.http.get<{ menu: Menu[] }>('/me/menu').pipe(map(res => res.menu));
  }
}
