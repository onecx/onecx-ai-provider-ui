import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslatePipe } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'
import { of, firstValueFrom } from 'rxjs'

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
  })

  beforeEach(async () => {
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
    fixture.detectChanges()
    skillDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, SkillDetailsHarness)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct breadcrumbs', () => {
    const breadcrumbSvc = component['breadcrumbService'] as BreadcrumbService
    jest.spyOn(breadcrumbSvc, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbSvc.setItems).toHaveBeenCalledWith([
      { titleKey: 'SKILL_DETAILS.BREADCRUMB', labelKey: 'SKILL_DETAILS.BREADCRUMB', routerLink: '/skill' }
    ])
  })

  it('should display translated headers', async () => {
    const pageHeader = await skillDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Skill Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display and edit skill details')
  })

  it('should show available header actions', async () => {
    const actions = await firstValueFrom(component.headerActions$)
    const inlineActions = actions.filter((a) => a.show === 'always' && (!a.conditional || a.showCondition))
    expect(inlineActions).toHaveLength(3)

    const backAction = inlineActions.find((a) => a.labelKey === 'SKILL_DETAILS.GENERAL.BACK')
    expect(backAction).toBeTruthy()

    const moreAction = inlineActions.find((a) => a.icon === PrimeIcons.ELLIPSIS_V)
    expect(moreAction).toBeUndefined()
  })

  it('should dispatch navigateBackButtonClicked action on back button click', async () => {
    const doneFn = jest.fn()
    const actions = await firstValueFrom(component.headerActions$)
    const backAction = actions.find((a) => a.labelKey === 'SKILL_DETAILS.GENERAL.BACK')

    store.scannedActions$.pipe(ofType(skillDetailsActions.navigateBackButtonClicked)).subscribe(() => {
      doneFn()
    })
    backAction?.actionCallback?.()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should dispatch editButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectSkillDetailsViewModel, {
      ...baseSkillDetailsViewModel,
      editMode: false
    })
    store.refreshState()
    const actions = await firstValueFrom(component.headerActions$)
    const editAction = actions.find((a) => a.labelKey === 'SKILL_DETAILS.GENERAL.EDIT')
    editAction?.actionCallback?.()

    expect(editAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(skillDetailsActions.editButtonClicked())
  })

  it('should dispatch cancelButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    const actions = await firstValueFrom(component.headerActions$)
    const cancelAction = actions.find((a) => a.labelKey === 'SKILL_DETAILS.GENERAL.CANCEL')
    cancelAction?.actionCallback?.()

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
    const skillForm = { name: 'title' }

    store.overrideSelector(selectSkillDetailsViewModel, {
      ...baseSkillDetailsViewModel,
      editMode: true,
      details: skill
    })
    store.refreshState()

    component.formGroup.patchValue(skillForm)
    component.save()

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

    const actions = await firstValueFrom(component.headerActions$)
    const deleteAction = actions.find((a) => a.labelKey === 'SKILL_DETAILS.GENERAL.DELETE')
    deleteAction?.actionCallback?.()

    expect(deleteAction).toBeTruthy()
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
    const labels = [
      { label: 'SKILL_DETAILS.FORM.CHANGE_ME', labelPipe: TranslatePipe, value: 'test' },
      { label: 'first', value: 'first value' },
      { label: 'second', value: 'second value' },
      { label: 'third', icon: PrimeIcons.PLUS },
      { label: 'fourth', value: 'fourth value', icon: PrimeIcons.QUESTION }
    ] as any[]
    component.objectDetails$ = of(labels)

    const emittedLabels = await firstValueFrom(component.objectDetails$)
    expect(emittedLabels).toHaveLength(5)

    const testDetailItem = emittedLabels.find((l) => l.label === 'SKILL_DETAILS.FORM.CHANGE_ME')
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
