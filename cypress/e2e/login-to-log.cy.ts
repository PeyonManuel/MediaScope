describe('template spec', () => {
  it("logs in and adds a movie, then remove's it", () => {
    cy.intercept('POST', '**/functions/v1/get-watched-item').as(
      'getWatchedItem'
    );
    cy.login('manuel.peyon@globant.com');
    cy.visit('/');

    // Navigate to the moview
    cy.contains('a', 'Search').click();
    cy.get('[type="search"]').should('be.visible').type('Roman holiday');
    cy.contains('a', 'Roman Holiday').should('be.visible').click();

    // Log the movie
    cy.wait('@getWatchedItem');
    cy.wait(1000);
    cy.get('body').then(($body) => {
      if ($body.find('[title="Log as Watched"]:visible').length === 0) {
        cy.log(
          'Button "Log as Watched" is not visible. Clicking "Logged as Watched".'
        );
        cy.get('[title="Logged as Watched"]').should('be.visible').click();
      } else {
        cy.log(
          'Button "Log as Watched" is visible. Skipping click on "Logged as Watched".'
        );
      }
    });
    cy.get('[title="Like"]').should('be.visible').click();
    cy.get('[title="Log as Watched"]').should('not.exist');
    cy.get('[aria-label="Rate 5 stars"]').click('left').as('5thStar');
    cy.get('@5thStar').should('have.attr', 'aria-checked', 'mixed');

    // Check if its actually logged in the user's profile
    cy.get('[aria-label="User menu"]').should('be.visible').click();
    cy.contains('a', 'View Profile').should('be.visible').click();
    cy.contains('a', 'Roman Holiday').should('be.visible').click();

    // Removes the logged movie
    cy.wait('@getWatchedItem');
    cy.contains('button', 'Watched').should('be.visible').click();

    //Checks its no longer in the user's list
    cy.get('[aria-label="User menu"]').should('be.visible').click();
    cy.contains('a', 'View Profile').should('be.visible').click();
    cy.contains('a', 'Roman Holiday').should('not.exist');
  });
});
