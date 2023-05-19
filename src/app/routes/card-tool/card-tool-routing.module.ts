import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CardToolEditComponent } from './edit/edit.component';
import { CardToolListComponent } from './list/list.component';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'list', component: CardToolListComponent },
  { path: ':chartid', component: CardToolEditComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CardToolRoutingModule { }
