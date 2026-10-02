import { TestBed } from '@angular/core/testing';
import { RouterOutlet } from '@angular/router';
import { AppComponent } from './app.component';
import { UpdateService } from './services/update.service';
import { StorageKeys } from './tokens/storage.tokens';
import { environment } from 'src/environments/environment';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      imports: [
        RouterOutlet,
      ],
      providers: [
        // UpdateService only wires service-worker update toasts; the real
        // SwUpdate it injects needs the whole service-worker stack, which has
        // nothing to do with what AppComponent does.
        { provide: UpdateService, useValue: {} },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should seed the API URL from the environment when unset', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(localStorage.getItem(StorageKeys.API_URL)).toEqual(environment.backend.api);
    expect(localStorage.getItem(StorageKeys.BROWSER_CORE_CHECK)).toEqual(
      environment.BROWSER_CORE_CHECK.toString(),
    );
  });

  it('should keep an API URL the user already set', () => {
    localStorage.setItem(StorageKeys.API_URL, 'https://custom.example/api/');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(localStorage.getItem(StorageKeys.API_URL)).toEqual('https://custom.example/api/');
  });
});
