import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { CardToolRoutingModule } from './card-tool-routing.module';
import { CardToolEditComponent } from './edit/edit.component';

const COMPONENTS: any[] = [CardToolEditComponent];
const COMPONENTS_DYNAMIC: any[] = [];

@NgModule({
  imports: [
    SharedModule,
    CardToolRoutingModule
  ],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_DYNAMIC
  ]
})
export class CardToolModule { }
