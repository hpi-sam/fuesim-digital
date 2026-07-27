import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTechnicalChallengeTemplateModalComponent } from './edit-technical-challenge-template-modal.component';

describe('EditTechnicalChallengeTemplateModalComponent', () => {
    let component: EditTechnicalChallengeTemplateModalComponent;
    let fixture: ComponentFixture<EditTechnicalChallengeTemplateModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditTechnicalChallengeTemplateModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(
            EditTechnicalChallengeTemplateModalComponent
        );
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
