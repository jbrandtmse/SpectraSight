import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CodeReferenceService } from './code-reference.service';

describe('CodeReferenceService', () => {
  let service: CodeReferenceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CodeReferenceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // AC #2: listClasses without search param
  it('should call GET /api/classes without search param', () => {
    service.listClasses().subscribe((classes) => {
      expect(classes.length).toBe(2);
      expect(classes[0].name).toBe('SpectraSight.Model.Ticket');
    });

    const req = httpMock.expectOne('/api/classes');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('search')).toBeFalse();
    req.flush({
      data: [
        { name: 'SpectraSight.Model.Ticket', super: '%Persistent' },
        { name: 'SpectraSight.REST.Response', super: '' },
      ],
    });
  });

  // AC #2: listClasses with search param
  it('should call GET /api/classes with search param', () => {
    service.listClasses('SpectraSight').subscribe((classes) => {
      expect(classes.length).toBe(1);
    });

    const req = httpMock.expectOne(r => r.url === '/api/classes' && r.params.get('search') === 'SpectraSight');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [{ name: 'SpectraSight.Model.Ticket', super: '%Persistent' }],
    });
  });

  // AC #3: listMethods for a specific class
  it('should call GET /api/classes/:name/methods', () => {
    service.listMethods('SpectraSight.REST.ClassHandler').subscribe((methods) => {
      expect(methods.length).toBe(2);
      expect(methods[0].name).toBe('ListClasses');
      expect(methods[0].classMethod).toBeTrue();
    });

    const req = httpMock.expectOne('/api/classes/SpectraSight.REST.ClassHandler/methods');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        { name: 'ListClasses', classMethod: true, returnType: '%Status' },
        { name: 'ListMethods', classMethod: true, returnType: '%Status' },
      ],
    });
  });

  // AC #6: addCodeReference with className and methodName
  it('should POST code reference with className and methodName', () => {
    service.addCodeReference('SS-1', 'SpectraSight.Model.Ticket', '%OnNew').subscribe((ref) => {
      expect(ref.id).toBe(42);
      expect(ref.className).toBe('SpectraSight.Model.Ticket');
      expect(ref.methodName).toBe('%OnNew');
    });

    const req = httpMock.expectOne(r => r.url === '/api/tickets/SS-1/code-references');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.className).toBe('SpectraSight.Model.Ticket');
    expect(req.request.body.methodName).toBe('%OnNew');
    req.flush({
      data: {
        id: 42,
        className: 'SpectraSight.Model.Ticket',
        methodName: '%OnNew',
        addedBy: 'testuser',
        timestamp: '2026-02-15T10:00:00Z',
      },
    });
  });

  // AC #6: addCodeReference without methodName
  it('should POST code reference without methodName when not provided', () => {
    service.addCodeReference('SS-1', 'SpectraSight.REST.Response').subscribe((ref) => {
      expect(ref.id).toBe(43);
      expect(ref.className).toBe('SpectraSight.REST.Response');
    });

    const req = httpMock.expectOne(r => r.url === '/api/tickets/SS-1/code-references');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.className).toBe('SpectraSight.REST.Response');
    expect(req.request.body.methodName).toBeUndefined();
    req.flush({
      data: {
        id: 43,
        className: 'SpectraSight.REST.Response',
        addedBy: 'testuser',
        timestamp: '2026-02-15T10:00:00Z',
      },
    });
  });

  // AC #8: removeCodeReference
  it('should DELETE code reference', () => {
    service.removeCodeReference('SS-1', 42).subscribe();

    const req = httpMock.expectOne('/api/tickets/SS-1/code-references/42');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  // Edge case: listClasses maps data from ApiResponse envelope
  it('should unwrap ApiResponse envelope for listClasses', () => {
    service.listClasses().subscribe((classes) => {
      expect(classes).toEqual([{ name: 'TestClass', super: '' }]);
    });

    const req = httpMock.expectOne('/api/classes');
    req.flush({ data: [{ name: 'TestClass', super: '' }] });
  });

  // Edge case: listMethods maps data from ApiResponse envelope
  it('should unwrap ApiResponse envelope for listMethods', () => {
    service.listMethods('TestClass').subscribe((methods) => {
      expect(methods).toEqual([{ name: 'TestMethod', classMethod: false, returnType: '' }]);
    });

    const req = httpMock.expectOne('/api/classes/TestClass/methods');
    req.flush({ data: [{ name: 'TestMethod', classMethod: false, returnType: '' }] });
  });

  // Edge case: addCodeReference maps data from ApiResponse envelope
  it('should unwrap ApiResponse envelope for addCodeReference', () => {
    service.addCodeReference('SS-5', 'MyClass', 'MyMethod').subscribe((ref) => {
      expect(ref.id).toBe(99);
    });

    const req = httpMock.expectOne(r => r.url === '/api/tickets/SS-5/code-references');
    req.flush({ data: { id: 99, className: 'MyClass', methodName: 'MyMethod', addedBy: 'user' } });
  });
});
