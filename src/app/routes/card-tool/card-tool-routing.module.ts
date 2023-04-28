import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CardToolEditComponent } from './edit/edit.component';

const routes: Routes = [
  { path: '', redirectTo: 'Edit', pathMatch: 'full' },
  { path: 'Edit', component: CardToolEditComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CardToolRoutingModule { }
