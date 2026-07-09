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
import { AutoCompleteModule } from 'primeng/autocomplete'
import { ButtonModule } from 'primeng/button'
import { MultiSelectModule } from 'primeng/multiselect'
import { SelectModule } from 'primeng/select'
import { TabViewModule } from 'primeng/tabview'
import { AgentFilterKeyEnum, AgentGroupService } from 'src/app/shared/generated'

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
import { agentDetailsActions } from './agent-details.actions'
import { AgentDetailsComponent } from './agent-details.component'
import { AgentDetailsHarness } from './agent-details.harness'
import { initialState } from './agent-details.reducers'
import { selectAgentDetailsViewModel } from './agent-details.selectors'
import { AgentDetailsViewModel } from './agent-details.viewmodel'

describe('AgentDetailsComponent', () => {
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
    listeners.forEach((l) =>
      (l as (event: { data: unknown; stopImmediatePropagation: () => void; stopPropagation: () => void }) => void)({
        data: m,
        stopImmediatePropagation: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
        stopPropagation: () => {} // eslint-disable-line @typescript-eslint/no-empty-function
      })
    )
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  let component: AgentDetailsComponent
  let fixture: ComponentFixture<AgentDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
  let agentDetails: AgentDetailsHarness
  const agentGroupService = {
    findAgentGroupByCriteria: jest.fn(),
    createAgentGroup: jest.fn()
  }

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseAgentDetailsViewModel: AgentDetailsViewModel = {
    details: undefined,
    detailsLoadingIndicator: false,
    providers: [],
    providersLoadingIndicator: false,
    providersLoaded: true,
    models: [],
    modelsLoadingIndicator: false,
    modelsLoaded: true,
    scaffolds: [],
    scaffoldsLoadingIndicator: false,
    scaffoldsLoaded: true,
    tools: [],
    toolsLoadingIndicator: false,
    toolsLoaded: true,
    groups: [],
    groupsLoadingIndicator: false,
    groupsLoaded: true,
    detailsLoaded: true,
    backNavigationPossible: true,
    editMode: true,
    isSubmitting: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgentDetailsComponent],
      imports: [
        AngularAcceleratorModule,
        PortalPageComponent,
        LetDirective,
        TabViewModule,
        SelectModule,
        MultiSelectModule,
        AutoCompleteModule,
        ButtonModule,
        ReactiveFormsModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PermissionService,
        provideMockStore({
          initialState: { agent: { details: initialState } }
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
        },
        { provide: AgentGroupService, useValue: agentGroupService }
      ]
    }).compileComponents()

    const userServiceMock = TestBed.inject(UserServiceMock)
    userServiceMock.permissionsTopic$.publish([
      'AGENT#CREATE',
      'AGENT#EDIT',
      'AGENT#DELETE',
      'AGENT#IMPORT',
      'AGENT#EXPORT',
      'AGENT#VIEW',
      'AGENT#SEARCH'
    ])

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectAgentDetailsViewModel, baseAgentDetailsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(AgentDetailsComponent)
    component = fixture.componentInstance
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    agentDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, AgentDetailsHarness)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct breadcrumbs', async () => {
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const pageHeader = await agentDetails.getHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
    expect(await searchBreadcrumbItem?.getText()).toEqual('Details')
  })

  it('should display translated headers', async () => {
    const pageHeader = await agentDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Agent Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display and edit Agent details')
  })

  it('should have 4 inline actions', async () => {
    const pageHeader = await agentDetails.getHeader()
    const inlineActions = await pageHeader.getInlineActionButtons()
    expect(inlineActions).toHaveLength(3)

    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    expect(backAction).toBeTruthy()
  })

  it('should dispatch navigateBackButtonClicked action on back button click', async () => {
    jest.spyOn(window.history, 'back')
    const doneFn = jest.fn()

    const pageHeader = await agentDetails.getHeader()
    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    store.scannedActions$.pipe(ofType(agentDetailsActions.navigateBackButtonClicked)).subscribe(() => {
      doneFn()
    })
    await backAction?.click()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should dispatch editButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      editMode: false
    })
    store.refreshState()
    const pageHeader = await agentDetails.getHeader()
    const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
    await editAction?.click()

    expect(editAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(agentDetailsActions.editButtonClicked())
  })

  it('should dispatch cancelButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    const pageHeader = await agentDetails.getHeader()
    const cancelAction = await pageHeader.getInlineActionButtonByLabel('Cancel')
    await cancelAction?.click()

    expect(cancelAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(
      agentDetailsActions.cancelButtonClicked({
        dirty: false
      })
    )
  })

  it('should dispatch saveButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    // ACTION D11: Adjust form field names and values according to your implementation
    const agent = { id: '123' }
    const agentForm = {
      name: 'title',
      description: 'description',
      additionalPrompt: 'prompt',
      provider: null,
      model: null,
      scaffold: null,
      tools: [],
      groups: [],
      newGroupName: null,
      filters: []
    }

    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      editMode: true,
      details: agent
    })
    store.refreshState()

    component.formGroup.setValue(agentForm)

    const pageHeader = await agentDetails.getHeader()
    const saveAction = await pageHeader.getInlineActionButtonByLabel('Save')
    await saveAction?.click()

    expect(saveAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(
      agentDetailsActions.saveButtonClicked({
        details: {
          id: '123',
          name: 'title',
          description: 'description',
          additionalPrompt: 'prompt',
          model: undefined,
          scaffold: undefined,
          tools: [],
          groups: [],
          filter: undefined
        }
      })
    )
  })

  it('should dispatch deleteButtonClicked action on delete button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      editMode: false
    })
    store.refreshState()

    const pageHeader = await agentDetails.getHeader()
    const deleteAction = await pageHeader.getInlineActionButtonByLabel('Delete')
    await deleteAction?.click()

    expect(deleteAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(agentDetailsActions.deleteButtonClicked())
  })

  it('should not render more action button', async () => {
    const pageHeader = await agentDetails.getHeader()
    const moreAction = await pageHeader.getInlineActionButtonByIcon(PrimeIcons.ELLIPSIS_V)
    expect(moreAction).toBeNull()
  })

  it('should display item details in page header', async () => {
    component.objectDetails$ = of([
      {
        label: 'AGENT_DETAILS.FORM.CHANGE_ME',
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

    const pageHeader = await agentDetails.getHeader()
    const objectDetails = await pageHeader.getObjectInfos()
    expect(objectDetails).toHaveLength(5)

    const label = TestBed.inject(TranslateService).instant('AGENT_DETAILS.FORM.CHANGE_ME')
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
    const agent = {
      id: '123',
      name: 'title',
      description: 'description',
      model: { id: 'model-1' },
      scaffold: { id: 'scaffold-1' },
      filter: { key: AgentFilterKeyEnum.AppId, value: 'my-app' },
      modificationCount: 7,
      additionalPrompt: 'prompt',
      status: 'LIVE' as any
    }

    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      editMode: false,
      details: agent
    })
    store.refreshState()

    expect(markAsPristineSpy).toHaveBeenCalledTimes(1)
    expect(disableSpy).toHaveBeenCalledTimes(1)
    expect(component.formGroup.pristine).toBe(true)
    expect(component.formGroup.disabled).toBe(true)
    expect(component.formGroup.getRawValue()).toEqual(
      expect.objectContaining({
        name: 'title',
        description: 'description',
        additionalPrompt: 'prompt',
        provider: null,
        model: { id: 'model-1' },
        scaffold: { id: 'scaffold-1' },
        tools: [],
        groups: [],
        newGroupName: null
      })
    )

    const translatedVersionLabel = TestBed.inject(TranslateService).instant('AGENT_DETAILS.FORM.VERSION')
    const pageHeader = await agentDetails.getHeader()
    const versionDetailItem = await pageHeader.getObjectInfoByLabel(translatedVersionLabel)
    expect(await versionDetailItem?.getValue()).toEqual('7')
  })
})
