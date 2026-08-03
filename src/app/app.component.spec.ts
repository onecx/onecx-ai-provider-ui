import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { AngularAcceleratorModule } from '@onecx/angular-accelerator'

import { AppComponent } from './app.component'

describe('AppComponent', () => {
  const mockActivatedRoute = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        AngularAcceleratorModule,
        TranslateTestingModule.withTranslations({
          en: require('./src/assets/i18n/en.json'),
          de: require('./src/assets/i18n/de.json')
        }).withDefaultLanguage('en')
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
