import { TestBed } from '@angular/core/testing';

import { CardToolService } from './card-tool.service';

describe('CardToolService', () => {
  let service: CardToolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardToolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
