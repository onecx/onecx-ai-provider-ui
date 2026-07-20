/* eslint-disable @typescript-eslint/no-var-requires */
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { AngularAcceleratorModule, BreadcrumbService } from '@onecx/angular-accelerator'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { Scaffold } from 'src/app/shared/generated'
import { ScaffoldCreateUpdateComponent } from './scaffold-create-update.component'

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

  const mockActivatedRoute = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScaffoldCreateUpdateComponent],
      imports: [
        AngularAcceleratorModule,
        FloatLabelModule,
        InputTextModule,
        FormsModule,
        LetDirective,
        ReactiveFormsModule,
        TranslateTestingModule.withTranslations({
          de: require('../../../../../../assets/i18n/de.json'),
          en: require('../../../../../../assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClientTesting(),
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
      name: 'Old'
    } as Scaffold
    component.formGroup.setValue({
      name: 'New'
    })
    component.ocxDialogButtonClicked()
    expect(component.dialogResult).toEqual({
      id: '1',
      name: 'New'
    })
  })

  it('should patch formGroup with itemToEdit on ngOnInit', () => {
    component.vm.itemToEdit = {
      id: '2',
      name: 'Patched'
    } as Scaffold
    component.formGroup.setValue({ name: null })
    component.ngOnInit()
    expect(component.formGroup.value).toEqual({
      name: 'Patched'
    })
  })

  it('should not patch formGroup on ngOnInit when there is no itemToEdit', () => {
    component.vm.itemToEdit = undefined
    component.formGroup.setValue({ name: null })
    component.ngOnInit()
    expect(component.formGroup.value).toEqual({ name: null })
  })

  it('should emit primaryButtonEnabled based on form validity', () => {
    const emissions: boolean[] = []
    component.primaryButtonEnabled.subscribe((enabled) => emissions.push(enabled))

    component.formGroup.get('name')?.setValue('a'.repeat(256))
    expect(emissions[emissions.length - 1]).toBe(false)

    component.formGroup.get('name')?.setValue('Valid')
    expect(emissions[emissions.length - 1]).toBe(true)
  })
})
