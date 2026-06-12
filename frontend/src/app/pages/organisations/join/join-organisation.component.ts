import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';

@Component({
    selector: 'app-join-organisation',
    templateUrl: './join-organisation.component.html',
    styleUrls: ['./join-organisation.component.scss'],
    imports: [],
})
export class JoinOrganisationComponent implements OnInit {
    private readonly apiService = inject(ApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);

    async ngOnInit() {
        const token: string = this.route.snapshot.params['token'];
        try {
            const organisation = await this.apiService.joinOrganisation(token);
            await this.router.navigate([`/organisations/${organisation.id}`]);
            this.messageService.postMessage({
                title: 'Erfolgreich der Organisation beigetreten',
                body: `Sie sind soeben erfolgreich der Organisation ${organisation.name} als Betrachter beigetreten.`,
                color: 'success',
            });
        } catch {
            await this.router.navigate(['/']);
        }
    }
}
