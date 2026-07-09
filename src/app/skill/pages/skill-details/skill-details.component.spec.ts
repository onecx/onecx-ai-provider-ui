import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { of } from 'rxjs'

import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'

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
import { skillDetailsActions } from './skill-details.actions'
import { SkillDetailsComponent } from './skill-details.component'
import { SkillDetailsHarness } from './skill-details.harness'
import { initialState } from './skill-details.reducers'
import { selectSkillDetailsViewModel } from './skill-details.selectors'
import { SkillDetailsViewModel } from './skill-details.viewmodel'

describe('SkillDetailsComponent', () => {
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

  let component: SkillDetailsComponent
  let fixture: ComponentFixture<SkillDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
  let skillDetails: SkillDetailsHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseSkillDetailsViewModel: SkillDetailsViewModel = {
    details: undefined,
    detailsLoadingIndicator: false,
    detailsLoaded: true,
    backNavigationPossible: true,
    editMode: true,
    isSubmitting: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SkillDetailsComponent,
        AngularAcceleratorModule,
        PortalPageComponent,
        LetDirective,
        ReactiveFormsModule,
        NoopAnimationsModule,
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
          initialState: { skill: { details: initialState } }
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
      'SKILL#CREATE',
      'SKILL#EDIT',
      'SKILL#DELETE',
      'SKILL#IMPORT',
      'SKILL#EXPORT',
      'SKILL#VIEW',
      'SKILL#SEARCH'
    ])

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectSkillDetailsViewModel, baseSkillDetailsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(SkillDetailsComponent)
    component = fixture.componentInstance
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    skillDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, SkillDetailsHarness)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct breadcrumbs', async () => {
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    const pageHeader = await skillDetails.getHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
    expect(await searchBreadcrumbItem?.getText()).toEqual('Details')
  })

  it('should display translated headers', async () => {
    const pageHeader = await skillDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Skill Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display and edit skill details')
  })

  it('should show available header actions', async () => {
    const pageHeader = await skillDetails.getHeader()
    const inlineActions = await pageHeader.getInlineActionButtons()
    expect(inlineActions.length).toBe(3)

    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    expect(backAction).toBeTruthy()

    const moreAction = await pageHeader.getInlineActionButtonByIcon(PrimeIcons.ELLIPSIS_V)
    expect(moreAction).toBeNull()
  })

  it('should dispatch navigateBackButtonClicked action on back button click', async () => {
    jest.spyOn(window.history, 'back')
    const doneFn = jest.fn()

    const pageHeader = await skillDetails.getHeader()
    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    store.scannedActions$.pipe(ofType(skillDetailsActions.navigateBackButtonClicked)).subscribe(() => {
      doneFn()
    })
    await backAction?.click()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should dispatch editButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectSkillDetailsViewModel, {
      ...baseSkillDetailsViewModel,
      editMode: false
    })
    store.refreshState()
    const pageHeader = await skillDetails.getHeader()
    const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
    await editAction?.click()

    expect(editAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(skillDetailsActions.editButtonClicked())
  })

  it('should dispatch cancelButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    const pageHeader = await skillDetails.getHeader()
    const cancelAction = await pageHeader.getInlineActionButtonByLabel('Cancel')
    await cancelAction?.click()

    expect(cancelAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(
      skillDetailsActions.cancelButtonClicked({
        dirty: false
      })
    )
  })

  it('should dispatch saveButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    const skill = { id: '123' }
    const skillForm = {
      name: 'title'
    }

    store.overrideSelector(selectSkillDetailsViewModel, {
      ...baseSkillDetailsViewModel,
      editMode: true,
      details: skill
    })
    store.refreshState()

    component.formGroup.patchValue(skillForm)

    const pageHeader = await skillDetails.getHeader()
    const saveAction = await pageHeader.getInlineActionButtonByLabel('Save')
    await saveAction?.click()

    expect(saveAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: skillDetailsActions.saveButtonClicked.type,
        details: expect.objectContaining({
          id: '123',
          name: 'title'
        })
      })
    )
  })

  it('should dispatch deleteButtonClicked action on delete button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectSkillDetailsViewModel, {
      ...baseSkillDetailsViewModel,
      editMode: false
    })
    store.refreshState()

    const pageHeader = await skillDetails.getHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()
    const deleteAction = await pageHeader.getOverFlowMenuItem('Delete')
    await deleteAction?.selectItem()

    expect(deleteAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(skillDetailsActions.deleteButtonClicked())
  })

  it('should dispatch no action on more button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectSkillDetailsViewModel, {
      ...baseSkillDetailsViewModel,
      editMode: false
    })
    store.refreshState()

    const pageHeader = await skillDetails.getHeader()
    const moreAction = await pageHeader.getOverflowActionMenuButton()
    await moreAction?.click()

    expect(moreAction).toBeTruthy()
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('should display item details in page header', async () => {
    component.objectDetails$ = of([
      {
        label: 'SKILL_DETAILS.FORM.CHANGE_ME',
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

    const pageHeader = await skillDetails.getHeader()
    const objectDetails = await pageHeader.getObjectInfos()
    expect(objectDetails.length).toBe(5)

    const label = TestBed.inject(TranslateService).instant('SKILL_DETAILS.FORM.CHANGE_ME')
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

    const skillForm = {
      name: 'title',
      description: undefined,
      instruction: undefined
    }
    const skill = { id: '123', ...skillForm }

    store.overrideSelector(selectSkillDetailsViewModel, {
      ...baseSkillDetailsViewModel,
      editMode: false,
      details: skill
    })
    store.refreshState()

    expect(markAsPristineSpy).toHaveBeenCalledTimes(1)
    expect(disableSpy).toHaveBeenCalledTimes(1)
    expect(component.formGroup.pristine).toBe(true)
    expect(component.formGroup.disabled).toBe(true)
    expect(component.formGroup.getRawValue()).toEqual(skillForm)
  })
})
