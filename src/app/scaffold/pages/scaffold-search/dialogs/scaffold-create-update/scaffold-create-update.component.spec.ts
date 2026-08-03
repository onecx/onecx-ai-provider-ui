/* eslint-disable @typescript-eslint/no-var-requires */
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { MultiSelectModule } from 'primeng/multiselect'
import { TextareaModule } from 'primeng/textarea'

import { AngularAcceleratorModule, BreadcrumbService } from '@onecx/angular-accelerator'
import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER } from '@onecx/angular-utils'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'

import { ScaffoldCreateUpdateComponent } from './scaffold-create-update.component'

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

describe('ScaffoldCreateUpdateComponent', () => {
  let component: ScaffoldCreateUpdateComponent
  let fixture: ComponentFixture<ScaffoldCreateUpdateComponent>

  const mockActivatedRoute = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScaffoldCreateUpdateComponent,
        AngularAcceleratorModule,
        FloatLabelModule,
        InputTextModule,
        FormsModule,
        LetDirective,
        ReactiveFormsModule,
        TranslateTestingModule.withTranslations({
          de: require('../../../../../../assets/i18n/de.json'),
          en: require('../../../../../../assets/i18n/en.json')
        }).withDefaultLanguage('en'),
        MultiSelectModule,
        TextareaModule
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(withInterceptorsFromDi()),
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useClass: AlwaysGrantPermissionChecker
        },
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
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
      systemPrompt: 'systemPrompt',
      skills: [{ id: 'skill1', name: 'Skill 1' }]
    } as any
    component.formGroup.setValue({
      name: 'New',
      systemPrompt: 'NewSystemPrompt',
      skills: [
        { id: 'skill1', name: 'Skill 1' },
        { id: 'skill2', name: 'Skill 2' }
      ]
    })
    component.ocxDialogButtonClicked()
    expect(component.dialogResult).toEqual({
      id: '1',
      name: 'New',
      systemPrompt: 'NewSystemPrompt',
      skills: [
        { id: 'skill1', name: 'Skill 1' },
        { id: 'skill2', name: 'Skill 2' }
      ]
    })
  })

  it('should patch formGroup with itemToEdit on ngOnInit', () => {
    component.vm.itemToEdit = {
      id: '2',
      name: 'Patched',
      systemPrompt: 'PatchedSystemPrompt',
      skills: [{ id: 'skill1', name: 'Skill 1' }]
    } as any
    component.formGroup.setValue({ name: null, systemPrompt: null, skills: null })
    component.ngOnInit()
    expect(component.formGroup.value).toEqual({
      name: 'Patched',
      systemPrompt: 'PatchedSystemPrompt',
      skills: [{ id: 'skill1', name: 'Skill 1' }]
    })
  })

  it('should default skills to an empty array when itemToEdit has no skills ngOnInit', () => {
    component.vm.itemToEdit = {
      id: '3',
      name: 'NoSkills',
      systemPrompt: 'NoSkillsSystemPrompt'
    } as any
    component.ngOnInit()
    expect(component.formGroup.value.skills).toEqual([])
  })
})
