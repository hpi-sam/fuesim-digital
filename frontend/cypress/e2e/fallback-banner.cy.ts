describe('Fallback banner', () => {
    it('stays hidden when the app loads normally', () => {
        cy.visit('/');

        // Once Angular has bootstrapped, app-root contains
        // <router-outlet> and <app-display-messages>.
        cy.get('app-root router-outlet').should('exist');

        cy.get('#fallback-banner')
            .should('have.css', 'display', 'none')
            .and('have.attr', 'aria-hidden', 'true');

        // Wait past the 5s detection timeout and make sure it's still hidden.
        cy.wait(6000);

        cy.get('#fallback-banner')
            .should('have.css', 'display', 'none')
            .and('have.attr', 'aria-hidden', 'true');
    });

    it('shows when the app fails to bootstrap', () => {
        // Delay the request AuthService.initialize() depends on past the
        // 5s detection timeout, so bootstrapApplication() never resolves
        // and <app-root> stays empty.
        cy.intercept('GET', '**/api/auth/user-data', {
            statusCode: 200,
            body: { user: undefined },
            delay: 10000,
        });

        cy.visit('/');

        cy.wait(6000);

        cy.get('#fallback-banner')
            .should('have.css', 'display', 'flex')
            .and('have.attr', 'aria-hidden', 'false');

        cy.contains(
            '#fallback-banner',
            'Die Anwendung konnte nicht geladen werden'
        );
    });
});
