import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, switchMap, of } from 'rxjs';
import { CodeReference } from '../../tickets/ticket.model';
import { CodeReferenceService } from '../code-reference.service';

@Component({
  selector: 'ss-code-reference',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './code-reference-field.component.html',
  styleUrl: './code-reference-field.component.scss',
})
export class CodeReferenceFieldComponent {
  codeReferences = input<CodeReference[]>([]);
  ticketId = input.required<string>();

  referenceAdded = output<CodeReference>();
  referenceRemoved = output<number>();

  private codeRefService = inject(CodeReferenceService);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);

  editing = signal(false);
  classControl = new FormControl('');
  methodControl = new FormControl('');
  classSuggestions = signal<string[]>([]);
  methodSuggestions = signal<string[]>([]);
  selectedClass = signal<string>('');
  private allMethods: string[] = [];

  constructor() {
    this.classControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap((value) => {
          if (!value || value.length < 2) {
            return of([]);
          }
          return this.codeRefService.listClasses(value);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((classes) => {
        this.classSuggestions.set(classes.map((c) => c.name));
      });

    this.methodControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.methodSuggestions.set(this.allMethods);
          return;
        }
        const lower = value.toLowerCase();
        this.methodSuggestions.set(
          this.allMethods.filter((m) => m.toLowerCase().includes(lower)),
        );
      });
  }

  onClassSelected(className: string): void {
    this.selectedClass.set(className);
    this.methodControl.setValue('');
    this.allMethods = [];
    this.methodSuggestions.set([]);
    this.codeRefService.listMethods(className)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((methods) => {
        this.allMethods = methods.map((m) => m.name);
        this.methodSuggestions.set(this.allMethods);
      });
  }

  startEditing(): void {
    this.editing.set(true);
    this.classControl.setValue('');
    this.methodControl.setValue('');
    this.selectedClass.set('');
    this.classSuggestions.set([]);
    this.methodSuggestions.set([]);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  addReference(): void {
    const className = this.classControl.value?.trim();
    if (!className) return;

    const methodName = this.methodControl.value?.trim() || undefined;

    this.codeRefService.addCodeReference(this.ticketId(), className, methodName).subscribe({
      next: (ref) => {
        this.referenceAdded.emit(ref);
        this.editing.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to add code reference', 'Dismiss', { duration: 5000 });
      },
    });
  }

  removeReference(refId: number): void {
    this.codeRefService.removeCodeReference(this.ticketId(), refId).subscribe({
      next: () => {
        this.referenceRemoved.emit(refId);
      },
      error: () => {
        this.snackBar.open('Failed to remove code reference', 'Dismiss', { duration: 5000 });
      },
    });
  }

  formatReference(ref: CodeReference): string {
    if (ref.methodName) {
      return `${ref.className}.${ref.methodName}`;
    }
    return ref.className;
  }
}
