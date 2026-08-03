import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER } from '@onecx/angular-utils'
import { BreadcrumbService, AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import { AgentStatus } from 'src/app/shared/generated'

import { AgentCreateUpdateComponent } from './agent-create-update.component'

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

describe('AgentCreateUpdateComponent', () => {
  let component: AgentCreateUpdateComponent
  let fixture: ComponentFixture<AgentCreateUpdateComponent>

  const mockActivatedRoute = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AngularAcceleratorModule,
        FormsModule,
        AgentCreateUpdateComponent,
        ReactiveFormsModule,
        LetDirective,
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

    fixture = TestBed.createComponent(AgentCreateUpdateComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should default status to DRAFT', () => {
    expect(component.formGroup.value.status).toEqual(AgentStatus.Draft)
  })

  it('should set dialogResult with merged itemToEdit and form values on ocxDialogButtonClicked', () => {
    component.vm.itemToEdit = {
      id: '1',
      name: 'Old',
      description: 'OldDesc',
      status: AgentStatus.Live
    } as any
    component.formGroup.setValue({
      name: 'New',
      description: 'NewDesc',
      status: AgentStatus.Deprecated
    })
    component.ocxDialogButtonClicked()
    expect(component.dialogResult).toEqual({
      id: '1',
      name: 'New',
      description: 'NewDesc',
      status: AgentStatus.Deprecated
    })
  })

  it('should patch formGroup with itemToEdit on ngOnInit', () => {
    component.vm.itemToEdit = {
      id: '2',
      name: 'Patched',
      description: 'PatchedDesc',
      status: AgentStatus.Live
    } as any
    component.formGroup.setValue({ name: null, description: null, status: AgentStatus.Draft })
    component.ngOnInit()
    expect(component.formGroup.value).toEqual({
      name: 'Patched',
      description: 'PatchedDesc',
      status: AgentStatus.Live
    })
  })

  it('should default status to DRAFT when itemToEdit has no status', () => {
    component.vm.itemToEdit = {
      id: '3',
      name: 'NoStatus',
      description: 'Desc'
    } as any
    component.ngOnInit()
    expect(component.formGroup.value.status).toEqual(AgentStatus.Draft)
  })

  it('should not patch formGroup on ngOnInit when there is no itemToEdit', () => {
    component.vm.itemToEdit = undefined
    component.formGroup.setValue({ name: null, description: null, status: AgentStatus.Draft })
    component.ngOnInit()
    expect(component.formGroup.value).toEqual({ name: null, description: null, status: AgentStatus.Draft })
  })

  it('should emit primaryButtonEnabled based on form validity', () => {
    const emissions: boolean[] = []
    component.primaryButtonEnabled.subscribe((enabled) => emissions.push(enabled))

    component.formGroup.setValue({ name: null, description: null, status: AgentStatus.Draft })
    expect(emissions[emissions.length - 1]).toBe(false)

    component.formGroup.setValue({ name: 'Valid', description: null, status: AgentStatus.Draft })
    expect(emissions[emissions.length - 1]).toBe(true)
  })
})
