import { BaseService } from './BaseService';
import { NewShippingRate, ShippingRate } from '../models/ShippingRate';

export class ShippingRatesService extends BaseService {
  constructor() {
    super('/posts');
  }

  getAllRates() {
    return this.get<ShippingRate[]>();
  }

  // string is allowed so negative tests can send invalid ids like "abc"
  getRate(id: number | string) {
    return this.get<ShippingRate>(String(id));
  }

  getRatesByCustomer(userId: number) {
    return this.get<ShippingRate[]>('', { userId });
  }

  createQuote(quote: NewShippingRate) {
    return this.post<ShippingRate>(quote);
  }

  // negative tests only: sends any payload, including invalid ones
  createQuoteWithRawPayload(payload: object) {
    return this.post<ShippingRate>(payload);
  }

  updateRate(id: number | string, rate: NewShippingRate) {
    return this.put<ShippingRate>(rate, String(id));
  }
}
