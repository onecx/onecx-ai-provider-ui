/* eslint-disable @typescript-eslint/no-var-requires */
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { AngularAcceleratorModule, BreadcrumbService } from '@onecx/angular-accelerator'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { distinctUntilChanged, skip, take, toArray } from 'rxjs'
import { Skill } from 'src/app/shared/generated'
import { SkillCreateUpdateComponent } from './skill-create-update.component'

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

describe('SkillCreateUpdateComponent', () => {
  let component: SkillCreateUpdateComponent
  let fixture: ComponentFixture<SkillCreateUpdateComponent>

  const mockActivatedRoute = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SkillCreateUpdateComponent,
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

    fixture = TestBed.createComponent(SkillCreateUpdateComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should emit primaryButtonEnabled as true when form is valid', (done) => {
    component.primaryButtonEnabled
      .pipe(
        // Skip initial emission to start fresh
        skip(1),
        // Only look at the first two emitted values after changes
        take(2),
        // Convert both emitted values into a single array
        toArray()
      )
      .subscribe((values) => {
        // Expect button to be disabled for invalid form and enabled for valid form
        expect(values).toEqual([false, true])
        done()
      })

    // Start with invalid form
    component.formGroup.setValue({ name: 'x'.repeat(256), description: '' })
    component.formGroup.updateValueAndValidity()

    // Then make it valid
    component.formGroup.setValue({ name: 'valid value', description: '' })
    component.formGroup.updateValueAndValidity()
  })

  it('should dynamically emit primaryButtonEnabled based on form validity changes', fakeAsync(() => {
    const emissions: boolean[] = []
    component.primaryButtonEnabled.pipe(distinctUntilChanged()).subscribe((enabled) => {
      emissions.push(enabled)
    })

    tick()

    component.formGroup.setValue({ name: 'initial valid', description: '' })
    component.formGroup.updateValueAndValidity()
    tick()

    // Make invalid
    component.formGroup.setValue({ name: 'x'.repeat(256), description: '' })
    component.formGroup.updateValueAndValidity()
    tick()

    // Make valid
    component.formGroup.setValue({ name: 'valid', description: '' })
    component.formGroup.updateValueAndValidity()
    tick()

    expect(emissions).toEqual([true, false, true])
  }))

  it('should set dialogResult with merged values on ocxDialogButtonClicked', () => {
    component.vm.itemToEdit = { id: '1', name: 'oldName', description: 'oldDesc' } as Skill
    component.formGroup.setValue({ name: 'newVal', description: 'newDesc' })

    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      id: '1',
      name: 'newVal',
      description: 'newDesc'
    })
  })

  it('should patch formGroup values from vm.itemToEdit on ngOnInit', () => {
    component.vm.itemToEdit = { id: '1', name: 'editVal', description: 'desc' } as Skill
    component.ngOnInit()
    expect(component.formGroup.value).toEqual({ name: 'editVal', description: 'desc' })
  })

  it('should set dialogResult to form values when creating (no itemToEdit)', () => {
    component.vm.itemToEdit = undefined
    component.formGroup.setValue({ name: 'createVal', description: 'desc' })

    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({ name: 'createVal', description: 'desc' })
  })
})
