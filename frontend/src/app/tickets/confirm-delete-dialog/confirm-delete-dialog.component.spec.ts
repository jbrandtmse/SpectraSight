import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

describe('ConfirmDeleteDialogComponent', () => {
  let component: ConfirmDeleteDialogComponent;
  let fixture: ComponentFixture<ConfirmDeleteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteDialogComponent, MatDialogModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { ticketId: 'SS-5' } },
        { provide: MatDialogRef, useValue: {} },
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the ticket ID in the dialog', () => {
    const el = fixture.nativeElement;
    expect(el.textContent).toContain('SS-5');
    expect(el.textContent).toContain('This action cannot be undone');
  });

  it('should display "Delete ticket?" as the title', () => {
    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Delete ticket?');
  });

  it('should have Cancel and Delete action buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const buttonTexts = Array.from(buttons).map((b: any) => b.textContent.trim());
    expect(buttonTexts).toContain('Cancel');
    expect(buttonTexts).toContain('Delete');
  });

  it('should have the data injected correctly', () => {
    expect(component.data.ticketId).toBe('SS-5');
  });
});
