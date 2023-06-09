import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '@core/authentication';

@Component({
  selector: 'app-user-panel',
  template: `
    <div class="matero-user-panel" fxLayout="column" fxLayoutAlign="center center">
      <img class="matero-user-panel-avatar" [src]="avatar" alt="avatar" width="64" />
      <h4 class="matero-user-panel-name">{{ user?.name }}</h4>
      <div class="matero-user-panel-icons">
        <button mat-icon-button routerLink="/profile/overview">
          <mat-icon class="icon-18">account_circle</mat-icon>
        </button>
        <button mat-icon-button routerLink="/profile/settings">
          <mat-icon class="icon-18">settings</mat-icon>
        </button>
        <button mat-icon-button (click)="logout()">
          <mat-icon class="icon-18">exit_to_app</mat-icon>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./user-panel.component.scss'],
})
export class UserPanelComponent implements OnInit {
  user?: User;

  constructor(private router: Router, private auth: AuthService) {}

  get avatar(): string{
    return this.user?.touxiang ?`https://maoyetrpg-1254195378.cos.ap-guangzhou.myqcloud.com/resource/${this.user.touxiang}` : '';
  }

  ngOnInit(): void {
    this.auth.user().subscribe(user => (this.user = user));
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/auth/login'));
  }
}
