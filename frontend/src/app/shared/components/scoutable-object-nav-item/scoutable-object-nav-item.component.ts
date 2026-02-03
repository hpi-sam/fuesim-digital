import { Component, OnInit } from '@angular/core';
import { Observable } from 'ol';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-scoutable-object-nav-item',
    templateUrl: './scoutable-object-nav-item.component.html',
    styleUrls: ['./scoutable-object-nav-item.component.scss'],
    standalone: false,
})
export class ScoutableObjectNavItemComponent implements OnInit {
    remarks$!: Observable<string>;

    ngOnInit(): void {
        this.remarks$ = '';
    }
    public updateRemarks(remark: string) {}
}
