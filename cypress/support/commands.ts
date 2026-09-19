import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      validateSchema(schema: object): Chainable<Subject>;
    }
  }
}

const describeError = (error: ErrorObject) => {
  const extraField = error.keyword === 'additionalProperties' ? `: '${error.params.additionalProperty}'` : '';
  return `${error.instancePath || '(root)'} ${error.message}${extraField}`;
};

Cypress.Commands.add('validateSchema', { prevSubject: true }, (subject: unknown, schema: object) => {
  const validate = ajv.compile(schema);
  validate(subject);
  const violations = (validate.errors ?? []).map(describeError);
  const schemaName = (schema as { title?: string }).title ?? 'schema';

  Cypress.log({ name: 'validateSchema', message: `${schemaName}: ${violations.length ? 'invalid' : 'valid'}` });
  expect(violations.length, `${schemaName} violations:\n${violations.join('\n')}\n`).to.eq(0);

  return cy.wrap(subject, { log: false });
});
