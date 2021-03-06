import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Logger, I18nService, AuthenticationService, untilDestroyed } from '@app/core';

const log = new Logger('Reset');

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss']
})
export class ResetComponent implements OnInit, OnDestroy {
  version: string = environment.version;
  resetForm!: FormGroup;
  isLoading = false;
  message: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
    private authenticationService: AuthenticationService
  ) {
    this.createForm();
  }

  ngOnInit() {}

  ngOnDestroy() {}

  reset() {
    this.isLoading = true;
    const payload = {
      id: this.route.snapshot.paramMap.get('params'),
      password: this.resetForm.controls['password'].value
    };
    const reset$ = this.authenticationService.resetPassword(payload);
    reset$
      .pipe(
        finalize(() => {
          this.resetForm.markAsPristine();
          this.isLoading = false;
        }),
        untilDestroyed(this)
      )
      .subscribe(
        res => {
          this.router.navigate([this.route.snapshot.queryParams.redirect || '/'], { replaceUrl: true });
        },
        err => {
          log.debug(`Reset error: ${err}`);
          this.message = err.error.message;
        }
      );
  }

  setLanguage(language: string) {
    this.i18nService.language = language;
  }

  get currentLanguage(): string {
    return this.i18nService.language;
  }

  get languages(): string[] {
    return this.i18nService.supportedLanguages;
  }

  private createForm() {
    this.resetForm = this.formBuilder.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        passwordConfrim: ['', [Validators.required, Validators.minLength(8)]]
      },
      { validator: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator = (): any => {
    if (this.resetForm) {
      let data =
        this.resetForm.get('password').value === this.resetForm.get('passwordConfrim').value
          ? null
          : { mismatch: true };
      return data;
    }
  };
}
