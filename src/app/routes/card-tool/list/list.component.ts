import { CardToolService } from './../card-tool.service';
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { RoleCard } from '../edit/types';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-tool-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class CardToolListComponent implements OnInit {
  paginator = {
    total: 0,
    pagesize: 10,
    page: 0,
  };

  roleCards: RoleCard[] = [];

  constructor(
    private cardToolService: CardToolService,
    private router: Router
    ) {}

  ngOnInit() {
    this.cardToolService.listRoleCard({
      page: this.paginator.page,
      nextpage: 1,
      pagesize: this.paginator.pagesize,
    }).subscribe(roleCards => {
      console.log(roleCards);

      this.roleCards = roleCards;
    });
  }

  togglePage(event: PageEvent) {
    console.log(event);
  }

}
