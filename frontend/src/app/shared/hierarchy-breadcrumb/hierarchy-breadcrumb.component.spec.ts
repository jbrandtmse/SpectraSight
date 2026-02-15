import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HierarchyBreadcrumbComponent } from './hierarchy-breadcrumb.component';
import { Ticket } from '../../tickets/ticket.model';

const TICKET_WITH_PARENT: Ticket = {
  id: 'SS-3',
  type: 'task',
  title: 'Implement login form',
  status: 'In Progress',
  priority: 'High',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-15T10:00:00Z',
  parent: { id: 'SS-2', title: 'User Auth Story', type: 'story' },
};

const TICKET_WITHOUT_PARENT: Ticket = {
  id: 'SS-1',
  type: 'epic',
  title: 'Auth system',
  status: 'Open',
  priority: 'Critical',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-15T10:00:00Z',
};

@Component({
  standalone: true,
  imports: [HierarchyBreadcrumbComponent],
  template: `<ss-hierarchy-breadcrumb [ticket]="ticket" (ancestorClicked)="onClicked($event)" />`,
})
class TestHostComponent {
  ticket: Ticket = TICKET_WITH_PARENT;
  clickedId: string | null = null;
  onClicked(id: string): void {
    this.clickedId = id;
  }
}

describe('HierarchyBreadcrumbComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  // AC #5: breadcrumb renders ancestor chain
  it('should render breadcrumb nav when ticket has a parent', () => {
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav.breadcrumb');
    expect(nav).toBeTruthy();
  });

  it('should show parent title as clickable link', () => {
    fixture.detectChanges();
    const ancestor = fixture.nativeElement.querySelector('.ancestor');
    expect(ancestor).toBeTruthy();
    expect(ancestor.textContent.trim()).toBe('User Auth Story');
  });

  it('should show current ticket title at the end', () => {
    fixture.detectChanges();
    const current = fixture.nativeElement.querySelector('.current');
    expect(current).toBeTruthy();
    expect(current.textContent.trim()).toBe('Implement login form');
  });

  it('should show chevron separator between parent and current', () => {
    fixture.detectChanges();
    const chevron = fixture.nativeElement.querySelector('.chevron');
    expect(chevron).toBeTruthy();
    expect(chevron.textContent.trim()).toBe('>');
  });

  it('should have aria-label for accessibility', () => {
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('Ticket hierarchy');
  });

  // AC #6: clicking ancestor emits the ancestor ticket ID
  it('should emit ancestorClicked with parent id when ancestor is clicked', () => {
    fixture.detectChanges();
    const ancestor = fixture.nativeElement.querySelector('.ancestor');
    ancestor.click();
    expect(host.clickedId).toBe('SS-2');
  });

  it('should have the ancestor element be keyboard-focusable', () => {
    fixture.detectChanges();
    const ancestor: HTMLElement = fixture.nativeElement.querySelector('.ancestor');
    expect(ancestor).toBeTruthy();
    // Verify the element is focusable (tabIndex is 0 for elements with tabindex="0")
    expect(ancestor.tabIndex).toBe(0);
  });

  // AC #9: no breadcrumb when ticket has no parent
  it('should not render breadcrumb when ticket has no parent', () => {
    host.ticket = TICKET_WITHOUT_PARENT;
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav.breadcrumb');
    expect(nav).toBeFalsy();
  });

  it('should not render any content when ticket has no parent', () => {
    host.ticket = TICKET_WITHOUT_PARENT;
    fixture.detectChanges();
    const breadcrumb = fixture.nativeElement.querySelector('ss-hierarchy-breadcrumb');
    expect(breadcrumb.children.length).toBe(0);
  });
});
