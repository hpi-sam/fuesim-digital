import type { MessageService } from '../../core/messages/message.service';

export function shareLink(url: string, messageService: MessageService) {
    // Could be unavailable in insecure contexts
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (navigator.share) {
        navigator.share({ url }).catch((error) => {
            if (error.name === 'AbortError') {
                return;
            }
            messageService.postError({
                title: 'Fehler beim Teilen der Übung',
                error: { error, url },
            });
        });
        return;
    }
    navigator.clipboard.writeText(url);

    messageService.postMessage({
        title: 'Link wurde in die Zwischenablage kopiert',
        body: 'Sie können ihn nun teilen.',
        color: 'info',
    });
}
