import shippingRateSchema from './shippingRate.schema.json';
import customerProfileSchema from './customerProfile.schema.json';

export function listOf(itemSchema: { title: string }) {
  return {
    title: itemSchema.title + '[]',
    type: 'array',
    minItems: 1,
    items: itemSchema,
  };
}

export { shippingRateSchema, customerProfileSchema };
