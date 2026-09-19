import { customerProfileService, shippingRatesService } from '../services';
import { existingRates } from '../fixtures/shippingRates.json';

describe('Shipping Rates Service - GET /posts/{id}', () => {
  existingRates.forEach(({ id, customerId }) => {
    context(`rate ${id}`, () => {
      it('exists and returns the requested rate', () => {
        shippingRatesService.getRate(id).then(({ status, body: rate }) => {
          expect(status, 'status').to.eq(200);
          expect(rate.id, 'rate id').to.eq(id);
          expect(rate.title, 'route').to.be.a('string').and.not.be.empty;
          expect(rate.body, 'rate details').to.be.a('string').and.not.be.empty;
        });
      });

      it(`belongs to existing customer ${customerId}`, () => {
        shippingRatesService.getRate(id).then(({ body: rate }) => {
          expect(rate.userId, 'rate owner').to.eq(customerId);

          customerProfileService.getCustomer(rate.userId).then(({ status, body: customer }) => {
            expect(status, 'customer lookup status').to.eq(200);
            expect(customer.id, 'customer id').to.eq(rate.userId);
          });
        });
      });
    });
  });

  it('every rate maps to an existing customer', () => {
    customerProfileService.getAllCustomers().then(({ body: customers }) => {
      const customerIds = customers.map((customer) => customer.id);

      shippingRatesService.getAllRates().then(({ status, body: rates }) => {
        expect(status, 'status').to.eq(200);
        const orphanRates = rates.filter((rate) => !customerIds.includes(rate.userId));
        expect(orphanRates, 'rates without an existing customer').to.be.empty;
      });
    });
  });
});

describe('Bonus - rates of customers whose username starts with my first letter', () => {
  const letter: string = Cypress.expose('firstNameLetter');

  it(`returns only their own rates for username initial "${letter}"`, () => {
    customerProfileService.findCustomersByUsernameInitial(letter).then((customers) => {
      expect(customers, `customers with username starting with "${letter}"`).to.not.be.empty;

      customers.forEach((customer) => {
        shippingRatesService.getRatesByCustomer(customer.id).then(({ status, body: rates }) => {
          cy.log(`${customer.username} (id ${customer.id}) has ${rates.length} rates`);
          expect(status, 'status').to.eq(200);
          expect(rates, `rates of ${customer.username}`).to.not.be.empty;
          rates.forEach((rate) => expect(rate.userId, `owner of rate ${rate.id}`).to.eq(customer.id));
        });
      });
    });
  });
});
