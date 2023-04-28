import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardToolEditComponent } from './edit.component';

describe('CardToolEditComponent', () => {
  let component: CardToolEditComponent;
  let fixture: ComponentFixture<CardToolEditComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CardToolEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardToolEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
