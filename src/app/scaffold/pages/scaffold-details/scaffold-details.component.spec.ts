import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { of, firstValueFrom } from 'rxjs'

import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslatePipe } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'
import { MultiSelectModule } from 'primeng/multiselect'

import { AngularAcceleratorModule, BreadcrumbService } from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import { provideUserServiceMock, UserServiceMock } from '@onecx/angular-integration-interface/mocks'
import {
  HAS_PERMISSION_CHECKER,
  PermissionService,
  PortalPageComponent,
  TranslationConnectionService
} from '@onecx/angular-utils'

// ACTION D11: Add missing imports here
import { scaffoldDetailsActions } from './scaffold-details.actions'
import { ScaffoldDetailsComponent } from './scaffold-details.component'
import { ScaffoldDetailsHarness } from './scaffold-details.harness'
import { initialState } from './scaffold-details.reducers'
import { selectScaffoldDetailsViewModel } from './scaffold-details.selectors'
import { ScaffoldDetailsViewModel } from './scaffold-details.viewmodel'

describe('ScaffoldDetailsComponent', () => {
  beforeAll(() => {
    ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {
        // no-op for jsdom
      }
      unobserve() {
        // no-op for jsdom
      }
      disconnect() {
        // no-op for jsdom
      }
    }
  })

  const origAddEventListener = window.addEventListener
  const origPostMessage = window.postMessage

  let listeners: unknown[] = []
  window.addEventListener = (_type: unknown, listener: unknown) => {
    listeners.push(listener)
  }

  window.removeEventListener = (_type: unknown, listener: unknown) => {
    listeners = listeners.filter((l) => l !== listener)
  }

  window.postMessage = (m: unknown) => {
    for (const l of listeners) {
      ;(l as (event: { data: unknown; stopImmediatePropagation: () => void; stopPropagation: () => void }) => void)({
        data: m,
        stopImmediatePropagation: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
        stopPropagation: () => {} // eslint-disable-line @typescript-eslint/no-empty-function
      })
    }
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  let component: ScaffoldDetailsComponent
  let fixture: ComponentFixture<ScaffoldDetailsComponent>
  let store: MockStore<Store>
  let scaffoldDetails: ScaffoldDetailsHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseScaffoldDetailsViewModel: ScaffoldDetailsViewModel = {
    details: undefined,
    detailsLoadingIndicator: false,
    detailsLoaded: true,
    backNavigationPossible: true,
    editMode: true,
    isSubmitting: false,
    skills: [],
    skillsLoadingIndicator: false,
    skillsLoaded: true,
    tools: [],
    toolsLoadingIndicator: false,
    toolsLoaded: true
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScaffoldDetailsComponent,
        AngularAcceleratorModule,
        PortalPageComponent,
        LetDirective,
        ReactiveFormsModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en'),
        MultiSelectModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PermissionService,
        provideMockStore({
          initialState: { scaffold: { details: initialState } }
        }),
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useExisting: UserService
        },
        {
          provide: TranslationConnectionService,
          useValue: { init: jest.fn(), destroy: jest.fn() }
        }
      ]
    }).compileComponents()
  })

  beforeEach(async () => {
    const userServiceMock = TestBed.inject(UserServiceMock)
    userServiceMock.permissionsTopic$.publish([
      'SCAFFOLD#CREATE',
      'SCAFFOLD#EDIT',
      'SCAFFOLD#DELETE',
      'SCAFFOLD#IMPORT',
      'SCAFFOLD#EXPORT',
      'SCAFFOLD#VIEW',
      'SCAFFOLD#SEARCH'
    ])

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectScaffoldDetailsViewModel, baseScaffoldDetailsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(ScaffoldDetailsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    scaffoldDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, ScaffoldDetailsHarness)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct breadcrumbs', () => {
    const breadcrumbService = component['breadcrumbService'] as BreadcrumbService
    const spy = jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith([
      { titleKey: 'SCAFFOLD_DETAILS.BREADCRUMB', labelKey: 'SCAFFOLD_DETAILS.BREADCRUMB', routerLink: '/scaffold' }
    ])
  })

  it('should display translated headers', async () => {
    const pageHeader = await scaffoldDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Scaffold Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display of Scaffold Details')
  })

  it('should have 4 inline actions', async () => {
    const actions = await firstValueFrom(component.headerActions$)
    const inlineActions = actions.filter((a) => a.show === 'always' && (!a.conditional || a.showCondition))
    expect(inlineActions).toHaveLength(4)

    const backAction = inlineActions.find((a) => a.labelKey === 'SCAFFOLD_DETAILS.GENERAL.BACK')
    expect(backAction).toBeTruthy()

    const moreAction = inlineActions.find((a) => a.icon === PrimeIcons.ELLIPSIS_V)
    expect(moreAction).toBeTruthy()
  })

  it('should dispatch navigateBackButtonClicked action on back button click', async () => {
    const doneFn = jest.fn()
    const actions = await firstValueFrom(component.headerActions$)
    const backAction = actions.find((a) => a.labelKey === 'SCAFFOLD_DETAILS.GENERAL.BACK')

    store.scannedActions$.pipe(ofType(scaffoldDetailsActions.navigateBackButtonClicked)).subscribe(() => {
      doneFn()
    })
    backAction?.actionCallback?.()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should dispatch editButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectScaffoldDetailsViewModel, {
      ...baseScaffoldDetailsViewModel,
      editMode: false
    })
    store.refreshState()
    const actions = await firstValueFrom(component.headerActions$)
    const editAction = actions.find((a) => a.labelKey === 'SCAFFOLD_DETAILS.GENERAL.EDIT')
    editAction?.actionCallback?.()

    expect(editAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(scaffoldDetailsActions.editButtonClicked())
  })

  it('should dispatch cancelButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    const actions = await firstValueFrom(component.headerActions$)
    const cancelAction = actions.find((a) => a.labelKey === 'SCAFFOLD_DETAILS.GENERAL.CANCEL')
    cancelAction?.actionCallback?.()

    expect(cancelAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(scaffoldDetailsActions.cancelButtonClicked({ dirty: false }))
  })

  it('should dispatch saveButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    // ACTION D11: Adjust form field names and values according to your implementation
    const scaffold = { id: '123' }
    const scaffoldForm = { name: 'title', systemPrompt: 'prompt', skills: [], tools: [] }

    store.overrideSelector(selectScaffoldDetailsViewModel, {
      ...baseScaffoldDetailsViewModel,
      editMode: true,
      details: scaffold
    })
    store.refreshState()

    component.formGroup.setValue(scaffoldForm)
    component.save()

    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(
      scaffoldDetailsActions.saveButtonClicked({ details: { ...scaffold, ...scaffoldForm } })
    )
  })

  it('should dispatch deleteButtonClicked action on delete button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectScaffoldDetailsViewModel, {
      ...baseScaffoldDetailsViewModel,
      editMode: false
    })
    store.refreshState()

    const actions = await firstValueFrom(component.headerActions$)
    const deleteAction = actions.find((a) => a.labelKey === 'SCAFFOLD_DETAILS.GENERAL.DELETE')
    deleteAction?.actionCallback?.()

    expect(deleteAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(scaffoldDetailsActions.deleteButtonClicked())
  })

  it('should dispatch no action on more button click', async () => {
    jest.spyOn(store, 'dispatch')
    const actions = await firstValueFrom(component.headerActions$)
    const moreAction = actions.find((a) => a.icon === PrimeIcons.ELLIPSIS_V)
    moreAction?.actionCallback?.()

    expect(moreAction).toBeTruthy()
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('should display item details in page header', async () => {
    const labels = [
      { label: 'SCAFFOLD_DETAILS.FORM.NAME', labelPipe: TranslatePipe, value: 'test' },
      { label: 'first', value: 'first value' },
      { label: 'second', value: 'second value' },
      { label: 'third', icon: PrimeIcons.PLUS },
      { label: 'fourth', value: 'fourth value', icon: PrimeIcons.QUESTION }
    ] as any[]
    component.objectDetails$ = of(labels)

    const emittedLabels = await firstValueFrom(component.objectDetails$)
    expect(emittedLabels).toHaveLength(5)

    const testDetailItem = emittedLabels.find((l) => l.label === 'SCAFFOLD_DETAILS.FORM.NAME')
    expect(testDetailItem?.value).toEqual('test')
    expect(testDetailItem?.icon).toBeUndefined()

    const firstDetailItem = emittedLabels.find((l) => l.label === 'first')
    expect(firstDetailItem?.value).toEqual('first value')
    expect(firstDetailItem?.icon).toBeUndefined()

    const secondDetailItem = emittedLabels.find((l) => l.label === 'second')
    expect(secondDetailItem?.value).toEqual('second value')
    expect(secondDetailItem?.icon).toBeUndefined()

    const thirdDetailItem = emittedLabels.find((l) => l.label === 'third')
    expect(thirdDetailItem?.value).toBeFalsy()
    expect(thirdDetailItem?.icon).toEqual(PrimeIcons.PLUS)

    const fourthDetailItem = emittedLabels.find((l) => l.label === 'fourth')
    expect(fourthDetailItem?.value).toEqual('fourth value')
    expect(fourthDetailItem?.icon).toEqual(PrimeIcons.QUESTION)
  })

  it('should mark as pristine and disable form when editMode is false', async () => {
    const markAsPristineSpy = jest.spyOn(component.formGroup, 'markAsPristine')
    const disableSpy = jest.spyOn(component.formGroup, 'disable')

    // ACTION D11: Adjust form field names and values according to your implementation
    const scaffoldForm = { name: 'title', systemPrompt: 'prompt', skills: [], tools: [] }
    const scaffold = { id: '123', ...scaffoldForm }

    store.overrideSelector(selectScaffoldDetailsViewModel, {
      ...baseScaffoldDetailsViewModel,
      editMode: false,
      details: scaffold
    })
    store.refreshState()

    expect(markAsPristineSpy).toHaveBeenCalledTimes(1)
    expect(disableSpy).toHaveBeenCalledTimes(1)
    expect(component.formGroup.pristine).toBe(true)
    expect(component.formGroup.disabled).toBe(true)
    expect(component.formGroup.getRawValue()).toEqual(scaffoldForm)
  })

  it('should default tools to an empty array when their control value is null', () => {
    jest.spyOn(store, 'dispatch')
    component.formGroup.get('tools')?.setValue(null)

    component.save()

    expect(store.dispatch).toHaveBeenCalledWith(
      scaffoldDetailsActions.saveButtonClicked({
        details: expect.objectContaining({
          tools: []
        })
      })
    )
  })

  it('should default tools to an empty array when the tools control is missing', () => {
    jest.spyOn(store, 'dispatch')
    component.formGroup.removeControl('tools')

    component.save()

    expect(store.dispatch).toHaveBeenCalledWith(
      scaffoldDetailsActions.saveButtonClicked({
        details: expect.objectContaining({
          tools: []
        })
      })
    )
  })
})
