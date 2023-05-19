import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardToolListComponent } from './list.component';

describe('CardToolListComponent', () => {
  let component: CardToolListComponent;
  let fixture: ComponentFixture<CardToolListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CardToolListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardToolListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
