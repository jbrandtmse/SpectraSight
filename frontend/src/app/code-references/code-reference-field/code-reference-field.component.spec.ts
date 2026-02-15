import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CodeReferenceFieldComponent } from './code-reference-field.component';
import { CodeReference } from '../../tickets/ticket.model';
import { ComponentRef } from '@angular/core';

const MOCK_REFS: CodeReference[] = [
  { id: 1, className: 'SpectraSight.Model.Ticket', methodName: '%OnNew', addedBy: 'alice', timestamp: '2026-02-15T10:00:00Z' },
  { id: 2, className: 'SpectraSight.REST.Response', addedBy: 'bob', timestamp: '2026-02-15T11:00:00Z' },
];

describe('CodeReferenceFieldComponent', () => {
  let component: CodeReferenceFieldComponent;
  let componentRef: ComponentRef<CodeReferenceFieldComponent>;
  let fixture: ComponentFixture<CodeReferenceFieldComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeReferenceFieldComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeReferenceFieldComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    httpMock = TestBed.inject(HttpTestingController);

    componentRef.setInput('ticketId', 'SS-1');
    componentRef.setInput('codeReferences', []);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Add code reference" button when not editing', () => {
    const btn = fixture.nativeElement.querySelector('.code-ref-add-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Add code reference');
  });

  it('should display code references in monospace when provided', () => {
    componentRef.setInput('codeReferences', MOCK_REFS);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.code-ref-item');
    expect(items.length).toBe(2);

    const firstDisplay = items[0].querySelector('.code-ref-display');
    expect(firstDisplay.textContent.trim()).toBe('SpectraSight.Model.Ticket.%OnNew');

    const secondDisplay = items[1].querySelector('.code-ref-display');
    expect(secondDisplay.textContent.trim()).toBe('SpectraSight.REST.Response');
  });

  it('should show remove button on each code reference', () => {
    componentRef.setInput('codeReferences', MOCK_REFS);
    fixture.detectChanges();

    const removeButtons = fixture.nativeElement.querySelectorAll('.code-ref-remove');
    expect(removeButtons.length).toBe(2);
  });

  it('should enter editing mode on Add button click', () => {
    const btn = fixture.nativeElement.querySelector('.code-ref-add-btn');
    btn.click();
    fixture.detectChanges();

    expect(component.editing()).toBeTrue();
    const form = fixture.nativeElement.querySelector('.code-ref-form');
    expect(form).toBeTruthy();
  });

  it('should cancel editing mode', () => {
    component.startEditing();
    fixture.detectChanges();

    const cancelBtn = fixture.nativeElement.querySelector('.code-ref-actions button:last-child');
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.editing()).toBeFalse();
  });

  it('should have aria-label on class input', () => {
    component.startEditing();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[aria-label="ObjectScript code reference"]');
    expect(input).toBeTruthy();
  });

  it('should have aria-label on method input', () => {
    component.startEditing();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[aria-label="ObjectScript method reference"]');
    expect(input).toBeTruthy();
  });

  it('should emit referenceRemoved when remove is clicked', () => {
    componentRef.setInput('codeReferences', MOCK_REFS);
    fixture.detectChanges();

    let emittedId: number | undefined;
    component.referenceRemoved.subscribe((id: number) => (emittedId = id));

    const removeButtons = fixture.nativeElement.querySelectorAll('.code-ref-remove');
    removeButtons[0].click();

    const req = httpMock.expectOne(r => r.url.includes('/code-references/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(emittedId).toBe(1);
  });

  it('should emit referenceAdded when add is confirmed', fakeAsync(() => {
    component.startEditing();
    fixture.detectChanges();

    component.classControl.setValue('SpectraSight.Model.Ticket');
    tick(300);

    let emittedRef: CodeReference | undefined;
    component.referenceAdded.subscribe((ref: CodeReference) => (emittedRef = ref));

    component.addReference();

    const req = httpMock.expectOne(r => r.url.includes('/code-references') && r.method === 'POST');
    expect(req.request.body.className).toBe('SpectraSight.Model.Ticket');
    req.flush({ data: { id: 99, className: 'SpectraSight.Model.Ticket', addedBy: 'test' } });

    expect(emittedRef).toBeTruthy();
    expect(emittedRef!.id).toBe(99);
    expect(component.editing()).toBeFalse();

    // Flush debounced class autocomplete request if any
    httpMock.match(() => true);
  }));

  it('should format reference with method name', () => {
    const ref: CodeReference = { id: 1, className: 'MyClass', methodName: 'MyMethod' };
    expect(component.formatReference(ref)).toBe('MyClass.MyMethod');
  });

  it('should format reference without method name', () => {
    const ref: CodeReference = { id: 1, className: 'MyClass' };
    expect(component.formatReference(ref)).toBe('MyClass');
  });

  it('should display Code References label', () => {
    const label = fixture.nativeElement.querySelector('.code-ref-label');
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toBe('Code References');
  });
});
