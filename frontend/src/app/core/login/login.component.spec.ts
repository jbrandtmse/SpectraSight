import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a login form with username and password fields', () => {
    expect(component.loginForm.contains('username')).toBeTrue();
    expect(component.loginForm.contains('password')).toBeTrue();
  });

  it('should require username', () => {
    component.loginForm.controls.username.setValue('');
    expect(component.loginForm.controls.username.valid).toBeFalse();
  });

  it('should require password', () => {
    component.loginForm.controls.password.setValue('');
    expect(component.loginForm.controls.password.valid).toBeFalse();
  });

  it('should be invalid when form is empty', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should be valid when both fields are filled', () => {
    component.loginForm.controls.username.setValue('admin');
    component.loginForm.controls.password.setValue('secret');
    expect(component.loginForm.valid).toBeTrue();
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(component.loading()).toBeFalse();
  });

  it('should start with no error message', () => {
    expect(component.errorMessage()).toBe('');
  });

  it('should start with loading false', () => {
    expect(component.loading()).toBeFalse();
  });
});
