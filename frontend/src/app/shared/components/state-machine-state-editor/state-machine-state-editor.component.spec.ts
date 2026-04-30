import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateMachineStateEditorComponent } from './state-machine-state-editor.component';

describe('StateMachineStateEditorComponent', () => {
    let component: StateMachineStateEditorComponent;
    let fixture: ComponentFixture<StateMachineStateEditorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StateMachineStateEditorComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(StateMachineStateEditorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
