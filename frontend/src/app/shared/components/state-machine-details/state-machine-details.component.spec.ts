import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { StateMachineDetailsComponent } from './state-machine-details.component';

describe('StateMachineDetailsComponent', () => {
    let component: StateMachineDetailsComponent;
    let fixture: ComponentFixture<StateMachineDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StateMachineDetailsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(StateMachineDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
