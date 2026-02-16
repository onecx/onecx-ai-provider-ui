
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { AlwaysGrantPermissionChecker, BreadcrumbService, HAS_PERMISSION_CHECKER, PortalCoreModule } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { ProviderCreateUpdateComponent } from './provider-create-update.component'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

describe('ProviderCreateUpdateComponent', () => {
  let component: ProviderCreateUpdateComponent
  let fixture: ComponentFixture<ProviderCreateUpdateComponent>

  const mockActivatedRoute = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProviderCreateUpdateComponent],
      imports: [
        PortalCoreModule,
        FormsModule,
        ReactiveFormsModule,
        LetDirective,
        TranslateTestingModule.withTranslations(
          'en',
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('./../../../../../../assets/i18n/en.json')
          // eslint-disable-next-line @typescript-eslint/no-require-imports
        ).withTranslations('de', require('./../../../../../../assets/i18n/de.json'))
      ],
      providers: [BreadcrumbService, { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useClass: AlwaysGrantPermissionChecker
        }
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(ProviderCreateUpdateComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set dialogResult with merged itemToEdit and form values on ocxDialogButtonClicked', () => {
    component.vm.itemToEdit = { id: '1', name: 'Old', description: 'OldDesc', modelName: 'model', llmUrl: 'OldUrl', apiKey: 'OldKey'}
    component.formGroup.setValue({ name: 'New', description: 'NewDesc', modelName: 'NewModel', llmUrl: 'NewUrl', apiKey: 'NewKey' })
    component.ocxDialogButtonClicked()
    expect(component.dialogResult).toEqual({
      id: '1',
      name: 'New',
      description: 'NewDesc',
      modelName: 'NewModel',
      llmUrl: 'NewUrl',
      apiKey: 'NewKey'
    })
  })

  it('should patch formGroup with itemToEdit on ngOnInit', () => {
    component.vm.itemToEdit = { id: '2', name: 'Patched', description: 'PatchedDesc', modelName: 'PatchedModel', llmUrl: 'PatchedUrl', apiKey: 'PatchedKey'}
    component.formGroup.setValue({ name: null, description: null, modelName: null, llmUrl: null, apiKey: null })
    component.ngOnInit()
    expect(component.formGroup.value).toEqual({
      name: 'Patched',
      description: 'PatchedDesc',
      modelName: 'PatchedModel',
      llmUrl: 'PatchedUrl',
      apiKey: 'PatchedKey'
    })
  })
})
