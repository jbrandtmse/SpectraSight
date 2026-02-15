import { Component, ChangeDetectionStrategy, input, output, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-field-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatMenuModule, MatIconModule],
  template: `
    @if (freeText()) {
      @if (editing()) {
        <input
          #freeInput
          class="field-dropdown-input"
          type="text"
          [(ngModel)]="editValue"
          (blur)="saveFreeText()"
          (keydown)="onFreeTextKeydown($event)"
          [placeholder]="placeholder()" />
      } @else {
        <span class="field-dropdown-display" tabindex="0" (click)="startFreeTextEdit()" (keydown.enter)="startFreeTextEdit()">
          <span class="field-dropdown-label">{{ label() }}:</span>
          <span class="field-dropdown-value">{{ value() || placeholder() }}</span>
          <mat-icon class="field-dropdown-icon">edit</mat-icon>
        </span>
      }
    } @else {
      <span class="field-dropdown-display" [matMenuTriggerFor]="menu" tabindex="0"
            [attr.aria-label]="label() + ': ' + value() + '. Click to change.'">
        <span class="field-dropdown-label">{{ label() }}:</span>
        <span class="field-dropdown-value">{{ value() || placeholder() }}</span>
        <mat-icon class="field-dropdown-icon">arrow_drop_down</mat-icon>
      </span>
      <mat-menu #menu="matMenu">
        @for (opt of options(); track opt) {
          <button mat-menu-item (click)="select(opt)">
            @if (opt === value()) {
              <mat-icon>check</mat-icon>
            }
            {{ opt }}
          </button>
        }
        @if (allowEmpty()) {
          <button mat-menu-item (click)="select('')">
            <span class="field-dropdown-empty">None</span>
          </button>
        }
      </mat-menu>
    }
  `,
  styleUrl: './field-dropdown.component.scss',
})
export class FieldDropdownComponent implements AfterViewChecked {
  @ViewChild('freeInput') freeInput?: ElementRef<HTMLInputElement>;

  value = input('');
  options = input<string[]>([]);
  label = input('');
  placeholder = input('');
  allowEmpty = input(true);
  freeText = input(false);

  valueChanged = output<string>();

  editing = signal(false);
  editValue = '';
  private needsFocus = false;

  select(option: string): void {
    if (option !== this.value()) {
      this.valueChanged.emit(option);
    }
  }

  startFreeTextEdit(): void {
    this.editValue = this.value();
    this.editing.set(true);
    this.needsFocus = true;
  }

  ngAfterViewChecked(): void {
    if (this.needsFocus && this.freeInput) {
      this.needsFocus = false;
      this.freeInput.nativeElement.focus();
      this.freeInput.nativeElement.select();
    }
  }

  saveFreeText(): void {
    if (this.editValue !== this.value()) {
      this.valueChanged.emit(this.editValue);
    }
    this.editing.set(false);
  }

  onFreeTextKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveFreeText();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.editing.set(false);
    }
  }
}
