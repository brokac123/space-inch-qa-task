import { customerProfileService, shippingRatesService } from '../services';
import { invalidQuotePayloads, nonExistentCustomerId, nonExistentRateIds } from '../fixtures/invalidRequests.json';

describe('Negative - non-existent resources', () => {
  nonExistentRateIds.forEach((id) => {
    it(`GET /posts/${id} returns 404 Not Found with an empty body`, () => {
      shippingRatesService.getRate(id).then(({ status, body }) => {
        expect(status, 'status').to.eq(404);
        expect(body, 'body').to.deep.eq({});
      });
    });
  });

  it(`GET /users/${nonExistentCustomerId} returns 404 Not Found`, () => {
    customerProfileService.getCustomer(nonExistentCustomerId).its('status').should('eq', 404);
  });
});

// These tests assert the CURRENT (wrong) behaviour, so the pipeline stays green while the bugs are open.
// Each one is documented in the README "Findings" section. When a bug gets fixed, its test fails -
// that is the signal to flip it to the correct expectation.
describe('Known bugs - documented in README', () => {
  it('KNOWN BUG BUG-01: PUT on a non-existent rate returns 500 with a stack trace instead of 404', () => {
    const rate = { userId: 1, title: 'Ghost rate', body: 'does not exist' };

    shippingRatesService.updateRate(99999, rate).then(({ status, headers, body }) => {
      expect(status, 'status (should be 404)').to.eq(500);
      expect(headers['content-type'], 'content type (should be JSON)').to.include('text/html');
      expect(body, 'body leaks a stack trace').to.include('TypeError').and.include('node_modules');
    });
  });

  invalidQuotePayloads.forEach(({ bugId, description, payload }) => {
    it(`KNOWN BUG ${bugId}: POST /posts accepts ${description} with 201 instead of 400`, () => {
      shippingRatesService.createQuoteWithRawPayload(payload).then(({ status, body }) => {
        expect(status, 'status (should be 400)').to.eq(201);
        expect(body, 'invalid data is echoed back').to.deep.include(payload);
      });
    });
  });
});
