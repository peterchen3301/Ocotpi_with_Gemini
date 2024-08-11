import { TestBed } from '@angular/core/testing';

import { DraftWizardService } from './draft-wizard.service';

describe('DraftWizardService', () => {
  let service: DraftWizardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DraftWizardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
