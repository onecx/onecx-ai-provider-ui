import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER } from '@onecx/angular-utils'
import { BreadcrumbService, AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { ScaffoldCreateUpdateComponent } from './scaffold-create-update.component'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import { fakeAsync, tick } from '@angular/core/testing'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

describe('ScaffoldCreateUpdateComponent', () => {
  let component: ScaffoldCreateUpdateComponent
  let fixture: ComponentFixture<ScaffoldCreateUpdateComponent>

  const mockActivatedRoute = {
    snapshot: { data: {} }
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AngularAcceleratorModule,
        FormsModule,
        ReactiveFormsModule,
        LetDirective,
        ScaffoldCreateUpdateComponent,
        TranslateTestingModule.withTranslations({
          en: require('./src/assets/i18n/en.json'),
          de: require('./src/assets/i18n/de.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useClass: AlwaysGrantPermissionChecker
        }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ScaffoldCreateUpdateComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set dialogResult with merged itemToEdit and form values on ocxDialogButtonClicked', () => {
    component.vm.itemToEdit = {
      id: '1',
      name: 'Old',
      systemPrompt: 'OldPrompt',
      sourceProduct: 'OldProduct'
    }

    component.formGroup.setValue({
      name: 'New',
      systemPrompt: 'NewPrompt',
      sourceProduct: 'NewProduct'
    })

    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      id: '1',
      name: 'New',
      systemPrompt: 'NewPrompt',
      sourceProduct: 'NewProduct'
    })
  })

  it('should patch formGroup with itemToEdit on ngOnInit', () => {
    component.vm.itemToEdit = {
      id: '2',
      name: 'Patched',
      systemPrompt: 'PatchedPrompt',
      sourceProduct: 'PatchedProduct'
    }

    component.formGroup.setValue({
      name: null,
      systemPrompt: null,
      sourceProduct: null
    })

    component.ngOnInit()

    expect(component.formGroup.getRawValue()).toEqual({
      name: 'Patched',
      systemPrompt: 'PatchedPrompt',
      sourceProduct: 'PatchedProduct'
    })
  })

  it('should disable sourceProduct if present in itemToEdit', () => {
    component.vm.itemToEdit = {
      id: '3',
      name: 'Test',
      systemPrompt: 'Prompt',
      sourceProduct: 'LockedProduct'
    }

    component.ngOnInit()

    expect(component.formGroup.get('sourceProduct')?.disabled).toBe(true)
  })

  it('should enable primaryButton when form is valid', fakeAsync(() => {
    const emitSpy = jest.spyOn(component.primaryButtonEnabled, 'emit')

    component.formGroup.setValue({
      name: null,
      systemPrompt: null,
      sourceProduct: null
    })
    component.formGroup.updateValueAndValidity()
    
    component.formGroup.setValue({
      name: 'Valid',
      systemPrompt: 'Prompt',
      sourceProduct: 'Product'
    })
    component.formGroup.updateValueAndValidity()
    tick()

    expect(emitSpy).toHaveBeenCalledWith(true)
  }))
})