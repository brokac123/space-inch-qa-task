export interface ShippingRate {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export type NewShippingRate = Omit<ShippingRate, 'id'>;
