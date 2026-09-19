import { BaseService } from './BaseService';
import { CustomerProfile } from '../models/CustomerProfile';

export class CustomerProfileService extends BaseService {
  constructor() {
    super('/users');
  }

  getAllCustomers() {
    return this.get<CustomerProfile[]>();
  }

  getCustomer(id: number | string) {
    return this.get<CustomerProfile>(String(id));
  }

  findCustomersByUsernameInitial(letter: string): Cypress.Chainable<CustomerProfile[]> {
    return this.getAllCustomers().then((response) => {
      expect(response.status, 'GET /users status').to.eq(200);
      return response.body.filter((customer) =>
        customer.username.toLowerCase().startsWith(letter.toLowerCase()),
      );
    });
  }
}
