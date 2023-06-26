import { CardToolService } from './../card-tool.service';
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { RoleCard } from '../edit/types';
import { Router } from '@angular/router';
import { NgxIndexedDBService } from 'ngx-indexed-db';

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
    private router: Router,
    private dbService: NgxIndexedDBService
    ) {}

  ngOnInit() {
    this.dbService.getAll<RoleCard>('RoleCards').subscribe(roleCards => {
      this.roleCards = roleCards;
    });
  }

}
