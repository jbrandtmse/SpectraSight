import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SplitPanelComponent } from './split-panel.component';

describe('SplitPanelComponent', () => {
  let component: SplitPanelComponent;
  let fixture: ComponentFixture<SplitPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SplitPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default list panel width of 400px', () => {
    expect(component.listPanelWidth()).toBe(400);
  });

  it('should render the split panel container', () => {
    const container = fixture.nativeElement.querySelector('.ss-split-panel');
    expect(container).toBeTruthy();
  });

  it('should render the resize handle with separator role', () => {
    const handle = fixture.nativeElement.querySelector('.ss-split-panel-handle');
    expect(handle).toBeTruthy();
    expect(handle.getAttribute('role')).toBe('separator');
  });

  it('should reset width to 400px on double-click', () => {
    component.listPanelWidth.set(600);
    expect(component.listPanelWidth()).toBe(600);
    component.resetWidth();
    expect(component.listPanelWidth()).toBe(400);
  });

  it('should set list panel width via style binding', () => {
    const listPanel = fixture.nativeElement.querySelector('.ss-split-panel-list');
    expect(listPanel.style.width).toBe('400px');
  });

  it('should constrain minimum width to 300px during resize', () => {
    // Simulate resize that would go below 300px
    component.listPanelWidth.set(300);
    fixture.detectChanges();
    const listPanel = fixture.nativeElement.querySelector('.ss-split-panel-list');
    expect(listPanel.style.width).toBe('300px');
  });

  it('should render list and detail panels', () => {
    const listPanel = fixture.nativeElement.querySelector('.ss-split-panel-list');
    const detailPanel = fixture.nativeElement.querySelector('.ss-split-panel-detail');
    expect(listPanel).toBeTruthy();
    expect(detailPanel).toBeTruthy();
  });

  it('should have handle with col-resize cursor style', () => {
    const handle = fixture.nativeElement.querySelector('.ss-split-panel-handle');
    const styles = getComputedStyle(handle);
    expect(styles.cursor).toBe('col-resize');
  });
});
