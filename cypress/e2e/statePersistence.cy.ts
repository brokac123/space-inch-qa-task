import { shippingRatesService } from '../services';
import { newQuotes } from '../fixtures/shippingQuotes.json';

describe('Shipping Rates Service - POST /posts (create shipping quote)', () => {
  newQuotes.forEach(({ carrier, quote }) => {
    context(carrier, () => {
      it('returns 201 Created with the stored quote and a new id', () => {
        shippingRatesService.createQuote(quote).then(({ status, body: created, headers }) => {
          expect(status, 'status').to.eq(201);
          expect(created, 'created quote').to.deep.include(quote);
          expect(created.id, 'assigned id').to.be.a('number');
          expect(headers.location, 'Location header').to.match(new RegExp(`/posts/${created.id}$`));
        });
      });
    });
  });

  // Runs once: the assigned id does not depend on the carrier, so repeating it per payload adds nothing.
  it('assigns an id that does not collide with existing rates', () => {
    const [{ quote }] = newQuotes;

    shippingRatesService.getAllRates().then(({ body: existingRates }) => {
      const highestExistingId = Math.max(...existingRates.map((rate) => rate.id));

      shippingRatesService.createQuote(quote).its('body.id').should('be.greaterThan', highestExistingId);
    });
  });

  it('Bonus: created quote can be read back (simulated persistence)', () => {
    const [{ quote }] = newQuotes;

    shippingRatesService.createQuote(quote).then(({ status, body: created }) => {
      expect(status, 'create status').to.eq(201);
      expect(created, 'response echoes the sent quote').to.deep.include(quote);

      // JSONPlaceholder fakes writes, so the follow-up GET returns 404 instead of 200 + the quote.
      // Asserting the real mock behaviour keeps the suite honest: if the backend ever starts
      // persisting, this fails and should be changed to expect 200 with the created data.
      shippingRatesService.getRate(created.id).then(({ status: readStatus, body }) => {
        expect(readStatus, 'follow-up GET status (mock does not persist)').to.eq(404);
        expect(body, 'follow-up GET body').to.deep.eq({});
      });
    });
  });
});
