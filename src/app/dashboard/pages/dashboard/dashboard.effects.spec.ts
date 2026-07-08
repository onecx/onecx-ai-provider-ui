import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions } from '@ngrx/effects'
import { provideMockActions } from '@ngrx/effects/testing'
import { Action, Store } from '@ngrx/store'
import { provideMockStore } from '@ngrx/store/testing'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { ReplaySubject } from 'rxjs'
import { take } from 'rxjs/operators'

import { DashboardActions } from './dashboard.actions'
import { DashboardEffects } from './dashboard.effects'

describe('DashboardEffects', () => {
  let actions$: ReplaySubject<Action>
  let effects: DashboardEffects
  let messageService: jest.Mocked<PortalMessageService>

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)

    messageService = {
      success: jest.fn(),
      error: jest.fn()
    } as unknown as jest.Mocked<PortalMessageService>

    await TestBed.configureTestingModule({
      providers: [
        {
          provide: DashboardEffects,
          useFactory: (actions: Actions, router: Router, store: Store, portalMessageService: PortalMessageService) =>
            new DashboardEffects(actions, {} as ActivatedRoute, router, store, portalMessageService),
          deps: [Actions, Router, Store, PortalMessageService]
        },
        provideMockStore(),
        provideMockActions(() => actions$),
        { provide: Router, useValue: {} },
        { provide: PortalMessageService, useValue: messageService }
      ]
    }).compileComponents()

    effects = TestBed.inject(DashboardEffects)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should display error message for configured error action', (done) => {
    effects.errorMessages = [{ action: DashboardActions.sampleAction(), key: 'DASHBOARD.ERROR' }]

    effects.displayError$.pipe(take(1)).subscribe(() => {
      expect(messageService.error).toHaveBeenCalledWith({ summaryKey: 'DASHBOARD.ERROR' })
      done()
    })

    actions$.next(DashboardActions.sampleAction())
  })

  it('should display success message for configured success action', (done) => {
    effects.successMessages = [{ action: DashboardActions.sampleAction(), key: 'DASHBOARD.SUCCESS' }]

    effects.displaySuccess$.pipe(take(1)).subscribe(() => {
      expect(messageService.success).toHaveBeenCalledWith({ summaryKey: 'DASHBOARD.SUCCESS' })
      done()
    })

    actions$.next(DashboardActions.sampleAction())
  })

  it('should not display messages when action is not configured', (done) => {
    effects.displayError$.pipe(take(1)).subscribe(() => {
      expect(messageService.error).not.toHaveBeenCalled()
      expect(messageService.success).not.toHaveBeenCalled()
      done()
    })

    actions$.next({ type: 'Unknown action' })
  })
})