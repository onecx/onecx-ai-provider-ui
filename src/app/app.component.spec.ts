import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { PortalCoreModule } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { AppComponent } from './app.component'
import { provideHttpClient } from '@angular/common/http'

describe('AppComponent', () => {
  const mockActivatedRoute = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [
        PortalCoreModule,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        TranslateTestingModule.withTranslations('en', require('./../assets/i18n/en.json')).withTranslations(
          'de',
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('./../assets/i18n/de.json')
        )
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()
  })

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.componentInstance
    expect(app).toBeTruthy()
  })
})
