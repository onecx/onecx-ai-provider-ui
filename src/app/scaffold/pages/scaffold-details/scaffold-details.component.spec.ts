import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { of } from 'rxjs'

import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
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
      (l as (event: { data: unknown; stopImmediatePropagation: () => void; stopPropagation: () => void }) => void)({
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
  let breadcrumbService: BreadcrumbService
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
      declarations: [ScaffoldDetailsComponent],
      imports: [
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
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    scaffoldDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, ScaffoldDetailsHarness)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct breadcrumbs', async () => {
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const pageHeader = await scaffoldDetails.getHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
    expect(await searchBreadcrumbItem?.getText()).toEqual('Details')
  })

  it('should display translated headers', async () => {
    const pageHeader = await scaffoldDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Scaffold Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display of Scaffold Details')
  })

  it('should have 4 inline actions', async () => {
    const pageHeader = await scaffoldDetails.getHeader()
    const inlineActions = await pageHeader.getInlineActionButtons()
    expect(inlineActions).toHaveLength(4)

    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    expect(backAction).toBeTruthy()

    const moreAction = await pageHeader.getInlineActionButtonByIcon(PrimeIcons.ELLIPSIS_V)
    expect(moreAction).toBeTruthy()
  })

  it('should dispatch navigateBackButtonClicked action on back button click', async () => {
    jest.spyOn(globalThis.history, 'back')
    const doneFn = jest.fn()

    const pageHeader = await scaffoldDetails.getHeader()
    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    store.scannedActions$.pipe(ofType(scaffoldDetailsActions.navigateBackButtonClicked)).subscribe(() => {
      doneFn()
    })
    await backAction?.click()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should dispatch editButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectScaffoldDetailsViewModel, {
      ...baseScaffoldDetailsViewModel,
      editMode: false
    })
    store.refreshState()
    const pageHeader = await scaffoldDetails.getHeader()
    const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
    await editAction?.click()

    expect(editAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(scaffoldDetailsActions.editButtonClicked())
  })

  it('should dispatch cancelButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    const pageHeader = await scaffoldDetails.getHeader()
    const cancelAction = await pageHeader.getInlineActionButtonByLabel('Cancel')
    await cancelAction?.click()

    expect(cancelAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(
      scaffoldDetailsActions.cancelButtonClicked({
        dirty: false
      })
    )
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

    const pageHeader = await scaffoldDetails.getHeader()
    const saveAction = await pageHeader.getInlineActionButtonByLabel('Save')
    await saveAction?.click()

    expect(saveAction).toBeTruthy()
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

    const pageHeader = await scaffoldDetails.getHeader()
    const deleteAction = await pageHeader.getInlineActionButtonByLabel('Delete')
    await deleteAction?.click()

    expect(deleteAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(scaffoldDetailsActions.deleteButtonClicked())
  })

  it('should dispatch no action on more button click', async () => {
    jest.spyOn(store, 'dispatch')

    const pageHeader = await scaffoldDetails.getHeader()
    const moreAction = await pageHeader.getInlineActionButtonByIcon(PrimeIcons.ELLIPSIS_V)
    await moreAction?.click()

    expect(moreAction).toBeTruthy()
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('should display item details in page header', async () => {
    component.objectDetails$ = of([
      {
        label: 'SCAFFOLD_DETAILS.FORM.NAME',
        labelPipe: TranslatePipe,
        value: 'test'
      },
      {
        label: 'first',
        value: 'first value'
      },
      {
        label: 'second',
        value: 'second value'
      },
      {
        label: 'third',
        icon: PrimeIcons.PLUS
      },
      {
        label: 'fourth',
        value: 'fourth value',
        icon: PrimeIcons.QUESTION
      }
    ])

    const pageHeader = await scaffoldDetails.getHeader()
    const objectDetails = await pageHeader.getObjectInfos()
    expect(objectDetails).toHaveLength(5)

    const label = TestBed.inject(TranslateService).instant('SCAFFOLD_DETAILS.FORM.NAME')
    const testDetailItem = await pageHeader.getObjectInfoByLabel(label)
    expect(await testDetailItem?.getLabel()).toEqual(label)
    expect(await testDetailItem?.getValue()).toEqual('test')
    expect(await testDetailItem?.getIcon()).toBeUndefined()

    const firstDetailItem = await pageHeader.getObjectInfoByLabel('first')
    expect(await firstDetailItem?.getLabel()).toEqual('first')
    expect(await firstDetailItem?.getValue()).toEqual('first value')
    expect(await firstDetailItem?.getIcon()).toBeUndefined()

    const secondDetailItem = await pageHeader.getObjectInfoByLabel('second')
    expect(await secondDetailItem?.getLabel()).toEqual('second')
    expect(await secondDetailItem?.getValue()).toEqual('second value')
    expect(await secondDetailItem?.getIcon()).toBeUndefined()

    const thirdDetailItem = await pageHeader.getObjectInfoByLabel('third')
    expect(await thirdDetailItem?.getLabel()).toEqual('third')
    expect(await thirdDetailItem?.getValue()).toEqual('')
    expect(await thirdDetailItem?.getIcon()).toEqual(PrimeIcons.PLUS)

    const fourthDetailItem = await pageHeader.getObjectInfoByLabel('fourth')
    expect(await fourthDetailItem?.getLabel()).toEqual('fourth')
    expect(await fourthDetailItem?.getValue()).toEqual('fourth value')
    expect(await fourthDetailItem?.getIcon()).toEqual(PrimeIcons.QUESTION)
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
})
