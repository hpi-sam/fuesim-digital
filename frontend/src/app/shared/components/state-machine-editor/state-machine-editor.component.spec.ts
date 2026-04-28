import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateMachineEditorComponent } from './state-machine-editor.component';

describe('StateMachineEditorComponent', () => {
    let component: StateMachineEditorComponent;
    let fixture: ComponentFixture<StateMachineEditorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StateMachineEditorComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(StateMachineEditorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
