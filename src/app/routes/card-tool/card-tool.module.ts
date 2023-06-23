import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { CardToolRoutingModule } from './card-tool-routing.module';
import { CardToolEditComponent } from './edit/edit.component';
import { CardToolListComponent } from './list/list.component';
import {ScrollingModule} from '@angular/cdk/scrolling';

const COMPONENTS: any[] = [CardToolEditComponent, CardToolListComponent];
const COMPONENTS_DYNAMIC: any[] = [];

@NgModule({
  imports: [
    SharedModule,
    CardToolRoutingModule,
    ScrollingModule
  ],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_DYNAMIC
  ]
})
export class CardToolModule { }
