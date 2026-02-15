import {
  Component, ChangeDetectionStrategy, input, output, signal,
  ViewChild, ElementRef, AfterViewChecked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inline-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './inline-edit.component.html',
  styleUrl: './inline-edit.component.scss',
})
export class InlineEditComponent implements AfterViewChecked {
  @ViewChild('inputRef') inputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('textareaRef') textareaRef?: ElementRef<HTMLTextAreaElement>;

  value = input('');
  type = input<'text' | 'textarea'>('text');
  placeholder = input('Click to edit');
  fieldClass = input('');

  valueChanged = output<string>();

  editing = signal(false);
  editValue = '';
  private needsFocus = false;

  startEdit(): void {
    this.editValue = this.value();
    this.editing.set(true);
    this.needsFocus = true;
  }

  ngAfterViewChecked(): void {
    if (this.needsFocus) {
      this.needsFocus = false;
      const el = this.inputRef?.nativeElement || this.textareaRef?.nativeElement;
      if (el) {
        el.focus();
        el.select();
      }
    }
  }

  save(): void {
    if (this.editValue !== this.value()) {
      this.valueChanged.emit(this.editValue);
    }
    this.editing.set(false);
  }

  cancel(): void {
    this.editing.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    } else if (event.key === 'Enter') {
      if (this.type() === 'text') {
        event.preventDefault();
        this.save();
      } else if (event.ctrlKey) {
        event.preventDefault();
        this.save();
      }
    }
  }
}
