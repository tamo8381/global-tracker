import { createCompanyPrintElement, createAllCompaniesPrintElement } from './printUtils';

describe('printUtils', () => {
  test('createCompanyPrintElement builds expected structure', () => {
    const company = {
      name: 'Acme Corp',
      country: { name: 'Freedonia' },
      website: 'https://acme.example',
      ipAddresses: ['192.0.2.1', '198.51.100.2'],
      subdomains: ['app.acme.example', 'api.acme.example'],
      people: [
        { firstName: 'John', lastName: 'Doe', email: 'john@example', position: 'Engineer' },
      ],
    };

    const el = createCompanyPrintElement(company, 'http://localhost');
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.querySelector('h1').textContent).toBe('Acme Corp');
    expect(el.textContent).toMatch(/Freedonia/);
    expect(el.textContent).toMatch(/192.0.2.1/);
    expect(el.textContent).toMatch(/app.acme.example/);
    expect(el.querySelectorAll('table tbody tr').length).toBe(1);
  });

  test('createAllCompaniesPrintElement paginates and aggregates', async () => {
    const companiesPage1 = { data: [{ _id: 'c1', name: 'C1' }], pagination: { total: 2 } };
    const companiesPage2 = { data: [{ _id: 'c2', name: 'C2' }], pagination: { total: 2 } };
    const peoplePage1 = { data: [{ _id: 'p1', company: 'c1', firstName: 'A' }], pagination: { total: 2 } };
    const peoplePage2 = { data: [{ _id: 'p2', company: 'c2', firstName: 'B' }], pagination: { total: 2 } };

    let cCalls = 0;
    const fetchCompanies = async ({ page }) => {
      cCalls += 1;
      return page === 1 ? companiesPage1 : companiesPage2;
    };

    let pCalls = 0;
    const fetchPeople = async ({ page }) => {
      pCalls += 1;
      return page === 1 ? peoplePage1 : peoplePage2;
    };

    const root = await createAllCompaniesPrintElement(fetchCompanies, fetchPeople, 'http://localhost');
    // It should contain two company sections
    const sections = root.querySelectorAll('.print-company');
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(cCalls).toBeGreaterThanOrEqual(1);
    expect(pCalls).toBeGreaterThanOrEqual(1);
  });

  test('photo column uses provided base URL and sets an onerror fallback', () => {
    const company = {
      name: 'Acme Corp',
      people: [ { firstName: 'Jane', lastName: 'Smith', photo: 'jane.png' } ]
    };

    const el = createCompanyPrintElement(company, 'http://backend.local:5000');
    const img = el.querySelector('table tbody tr td img');
    expect(img).toBeTruthy();
    expect(img.src).toMatch(/^http:\/\/backend.local:5000\/uploads\/jane.png/);
    expect(typeof img.onerror).toBe('function');
  });
});
