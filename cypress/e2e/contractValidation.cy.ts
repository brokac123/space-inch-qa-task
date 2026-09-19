import { customerProfileService, shippingRatesService } from '../services';
import { customerProfileSchema, listOf, shippingRateSchema } from '../schemas';
import { existingRates } from '../fixtures/shippingRates.json';
import { newQuotes } from '../fixtures/shippingQuotes.json';

function expectContract(response: Cypress.Response<unknown>, expectedStatus: number, schema: object) {
  expect(response.status, 'status').to.eq(expectedStatus);
  expect(response.headers['content-type'], 'content type').to.include('application/json');
  cy.wrap(response.body).validateSchema(schema);
}

describe('Contract - Shipping Rates Service', () => {
  existingRates.forEach(({ id }) => {
    it(`GET /posts/${id} matches the ShippingRate schema`, () => {
      shippingRatesService.getRate(id).then((response) => {
        expectContract(response, 200, shippingRateSchema);
      });
    });
  });

  it('GET /posts returns a list where every rate matches the schema', () => {
    shippingRatesService.getAllRates().then((response) => {
      expectContract(response, 200, listOf(shippingRateSchema));
    });
  });

  it('GET /posts?userId= returns a list where every rate matches the schema', () => {
    shippingRatesService.getRatesByCustomer(1).then((response) => {
      expectContract(response, 200, listOf(shippingRateSchema));
    });
  });

  it('POST /posts response matches the ShippingRate schema', () => {
    const [{ quote }] = newQuotes;

    shippingRatesService.createQuote(quote).then((response) => {
      expectContract(response, 201, shippingRateSchema);
    });
  });
});

describe('Contract - Customer Profile Service', () => {
  it('GET /users/1 matches the CustomerProfile schema', () => {
    customerProfileService.getCustomer(1).then((response) => {
      expectContract(response, 200, customerProfileSchema);
    });
  });

  it('GET /users returns a list where every customer matches the schema', () => {
    customerProfileService.getAllCustomers().then((response) => {
      expectContract(response, 200, listOf(customerProfileSchema));
    });
  });
});
