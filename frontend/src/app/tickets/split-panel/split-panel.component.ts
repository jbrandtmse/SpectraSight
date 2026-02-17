import {
  Component,
  ChangeDetectionStrategy,
  signal,
  ElementRef,
  ViewChild,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';

@Component({
  selector: 'ss-split-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './split-panel.component.html',
  styleUrl: './split-panel.component.scss',
})
export class SplitPanelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;

  listPanelWidth = signal(0);
  private defaultWidth = 550;

  private isResizing = false;
  private startX = 0;
  private startWidth = 0;
  private boundOnResizeMove: ((e: MouseEvent) => void) | null = null;
  private boundOnResizeEnd: (() => void) | null = null;

  ngAfterViewInit(): void {
    this.boundOnResizeMove = this.onResizeMove.bind(this);
    this.boundOnResizeEnd = this.onResizeEnd.bind(this);

    const containerWidth = this.containerRef.nativeElement.offsetWidth;
    if (containerWidth > 0) {
      this.defaultWidth = Math.round(containerWidth * 0.45);
    }
    this.listPanelWidth.set(this.defaultWidth);
  }

  ngOnDestroy(): void {
    this.removeListeners();
  }

  onResizeStart(event: MouseEvent): void {
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.listPanelWidth();
    event.preventDefault();

    document.addEventListener('mousemove', this.boundOnResizeMove!);
    document.addEventListener('mouseup', this.boundOnResizeEnd!);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  onResizeMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    const delta = event.clientX - this.startX;
    const containerWidth = this.containerRef.nativeElement.offsetWidth;
    const newWidth = Math.max(300, Math.min(containerWidth * 0.5, this.startWidth + delta));
    this.listPanelWidth.set(newWidth);
  }

  onResizeEnd(): void {
    this.isResizing = false;
    this.removeListeners();
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  resetWidth(): void {
    const containerWidth = this.containerRef.nativeElement.offsetWidth;
    this.listPanelWidth.set(containerWidth > 0 ? Math.round(containerWidth * 0.45) : this.defaultWidth);
  }

  private removeListeners(): void {
    if (this.boundOnResizeMove) {
      document.removeEventListener('mousemove', this.boundOnResizeMove);
    }
    if (this.boundOnResizeEnd) {
      document.removeEventListener('mouseup', this.boundOnResizeEnd);
    }
  }
}
