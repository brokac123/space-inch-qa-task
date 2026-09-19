type QueryParams = Record<string, string | number>;

export abstract class BaseService {
  protected constructor(private readonly resourcePath: string) {}

  protected get<T>(path = '', qs?: QueryParams): Cypress.Chainable<Cypress.Response<T>> {
    return this.send<T>({ method: 'GET', url: this.url(path), qs });
  }

  protected post<T>(body: object, path = ''): Cypress.Chainable<Cypress.Response<T>> {
    return this.send<T>({ method: 'POST', url: this.url(path), body });
  }

  protected put<T>(body: object, path = ''): Cypress.Chainable<Cypress.Response<T>> {
    return this.send<T>({ method: 'PUT', url: this.url(path), body });
  }

  private send<T>(options: Partial<Cypress.RequestOptions>): Cypress.Chainable<Cypress.Response<T>> {
    return cy.request<T>({ failOnStatusCode: false, ...options });
  }

  private url(path: string): string {
    return path === '' ? this.resourcePath : `${this.resourcePath}/${path}`;
  }
}
