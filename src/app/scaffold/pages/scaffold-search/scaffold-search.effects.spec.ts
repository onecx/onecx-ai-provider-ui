import { HttpEvent } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import {
  ColumnType,
  DataTableColumn,
  ExportDataService,
  PortalDialogService,
  RowListGridData
} from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { of, ReplaySubject, throwError } from 'rxjs'
import { take } from 'rxjs/operators'

import { Scaffold, ScaffoldPageResult, ScaffoldService, SkillPageResult, SkillService } from 'src/app/shared/generated'
import { scaffoldSearchActions } from './scaffold-search.actions'
import { ScaffoldSearchEffects } from './scaffold-search.effects'
import { ScaffoldSearchCriteria } from './scaffold-search.parameters'
import { initialState } from './scaffold-search.reducers'
import { scaffoldSearchSelectors, selectScaffoldSearchViewModel } from './scaffold-search.selectors'
import { ScaffoldSearchViewModel } from './scaffold-search.viewmodel'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')
  return {
    ...actual,
    filterForNavigatedTo: () => (source: unknown) => source,
    filterOutQueryParamsHaveNotChanged: () => (source: unknown) => source
  }
})

// ACTION S11: Change test data in the whole document
describe('ScaffoldSearchEffects', () => {
  let actions$: ReplaySubject<Action>
  let effects: ScaffoldSearchEffects
  let store: MockStore<Store>
  let router: jest.Mocked<Router>
  let route: ActivatedRoute
  let scaffoldService: jest.Mocked<ScaffoldService>
  let skillService: jest.Mocked<SkillService>
  let portalDialogService: jest.Mocked<PortalDialogService>
  let messageService: jest.Mocked<PortalMessageService>
  let exportDataService: jest.Mocked<ExportDataService>

  const mockCriteria: ScaffoldSearchCriteria = { name: 'test' }

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)

    scaffoldService = {
      createScaffold: jest.fn(),
      updateScaffoldById: jest.fn(),
      deleteScaffoldById: jest.fn(),
      findScaffoldByCriteria: jest.fn()
    } as unknown as jest.Mocked<ScaffoldService>

    skillService = {
      findSkillByCriteria: jest.fn()
    } as unknown as jest.Mocked<SkillService>

    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn(),
      events: of()
    } as unknown as jest.Mocked<Router>

    portalDialogService = {
      openDialog: jest.fn()
    } as unknown as jest.Mocked<PortalDialogService>

    messageService = {
      success: jest.fn(),
      error: jest.fn()
    } as unknown as jest.Mocked<PortalMessageService>

    exportDataService = {
      exportCsv: jest.fn()
    } as unknown as jest.Mocked<ExportDataService>

    route = {
      queryParams: of({}),
      snapshot: { queryParams: {} }
    } as unknown as ActivatedRoute

    await TestBed.configureTestingModule({
      providers: [
        ScaffoldSearchEffects,
        provideRouter([]),
        provideMockStore({
          initialState: { ScaffoldSearch: initialState }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: ScaffoldService, useValue: scaffoldService },
        { provide: SkillService, useValue: skillService },
        { provide: PortalDialogService, useValue: portalDialogService },
        { provide: PortalMessageService, useValue: messageService },
        { provide: ExportDataService, useValue: exportDataService }
      ]
    }).compileComponents()

    store = TestBed.inject(MockStore)
    effects = TestBed.inject(ScaffoldSearchEffects)
  })

  beforeEach(() => {
    jest.resetAllMocks()
    ;(router.parseUrl as jest.Mock).mockImplementation((url: string) => ({
      toString: () => (url ? url.split('?')[0].split('#')[0] : '/search'),
      queryParams: {},
      fragment: null
    }))
  })

  describe('syncParamsToUrl$', () => {
    beforeEach(() => {
      store.overrideSelector(scaffoldSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()
    })

    it('should navigate to update URL when criteria differs from query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of({ different: 'yes' })

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))
    })

    it('should not navigate when criteria matches query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of(mockCriteria)

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).not.toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))
    })

    it('should navigate when resetButtonClicked action is triggered', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of({ something: 'else' })

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.resetButtonClicked())
    })
  })

  describe('searchByUrl$ / performSearch', () => {
    beforeEach(() => {
      store.overrideSelector(scaffoldSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      scaffoldService.findScaffoldByCriteria.mockReturnValue(
        of({
          stream: [{ id: '1', name: 'Item 1' }],
          content: [{ id: '1', name: 'Item 1', imagePath: '' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        } as unknown as HttpEvent<ScaffoldPageResult>)
      )
    })

    it('should dispatch resultsLoadingFailed on search error', (done) => {
      const mockError = 'Search failed'
      scaffoldService.findScaffoldByCriteria.mockReturnValueOnce(throwError(() => mockError))

      effects
        .performSearch(mockCriteria)
        .pipe(take(1))
        .subscribe((action) => {
          expect(action.type).toEqual(scaffoldSearchActions.scaffoldSearchResultsLoadingFailed.type)
          expect(action).toEqual(scaffoldSearchActions.scaffoldSearchResultsLoadingFailed({ error: mockError }))
          done()
        })
    })

    it('should convert Date objects in search criteria before calling scaffoldService', (done) => {
      const criteriaWithDate = { ...mockCriteria, startDate: new Date('2023-01-01'), endDate: new Date('2023-12-31') }
      const searchSpy = jest.spyOn(scaffoldService, 'findScaffoldByCriteria')

      effects
        .performSearch(criteriaWithDate)
        .pipe(take(1))
        .subscribe(() => {
          expect(searchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              startDate: '2023-01-01T00:00:00.000Z',
              endDate: '2023-12-31T00:00:00.000Z'
            })
          )
          done()
        })
    })

    it('should use latest criteria from store and call performSearch on routerNavigatedAction', (done) => {
      const criteriaFromStore = { name: 'fromStore' }
      store.overrideSelector(scaffoldSearchSelectors.selectCriteria, criteriaFromStore)
      store.refreshState()

      const markerAction = scaffoldSearchActions.scaffoldSearchResultsLoadingFailed({ error: null })
      const performSearchSpy = jest.spyOn(effects, 'performSearch').mockReturnValue(of(markerAction))

      effects.searchByUrl$.pipe(take(1)).subscribe((action) => {
        expect(performSearchSpy).toHaveBeenCalledWith(criteriaFromStore)
        expect(action).toBe(markerAction)
        done()
      })

      actions$.next({ type: routerNavigatedAction.type })
    })
  })

  describe('exportData$', () => {
    const cases = [
      {
        desc: 'should handle export with empty displayed columns',
        viewModel: {
          results: [{ id: '1', name: 'Context 1', imagePath: '' }],
          resultComponentState: { displayedColumns: undefined }
        } as Partial<ScaffoldSearchViewModel>
      },
      {
        desc: 'should handle export with null resultComponentState',
        viewModel: {
          results: [{ id: '1', name: 'Context 1', imagePath: '' }],
          resultComponentState: null
        } as Partial<ScaffoldSearchViewModel>
      }
    ]

    cases.forEach(({ desc, viewModel }) => {
      it(desc, (done) => {
        store.overrideSelector(selectScaffoldSearchViewModel, viewModel as ScaffoldSearchViewModel)

        effects.exportData$.pipe(take(1)).subscribe(() => {
          expect(exportDataService.exportCsv).toHaveBeenCalledWith([], viewModel.results, 'export_scaffold.csv')
          done()
        })

        actions$.next(scaffoldSearchActions.exportButtonClicked())
      })
    })

    it('should export CSV with correct parameters when export button is clicked', (done) => {
      const mockColumns: DataTableColumn[] = [
        {
          columnType: ColumnType.STRING,
          id: 'source',
          nameKey: 'SCAFFOLD_SEARCH.RESULTS.SOURCE'
        }
      ]
      const mockResults: Partial<RowListGridData>[] = [
        { id: '1', name: 'Context 1' },
        { id: '2', name: 'Context 2' }
      ]
      const mockViewModel = { resultComponentState: { displayedColumns: mockColumns }, results: mockResults }
      store.overrideSelector(selectScaffoldSearchViewModel, mockViewModel as ScaffoldSearchViewModel)

      effects.exportData$.pipe(take(1)).subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(mockColumns, mockResults, 'export_scaffold.csv')
        done()
      })

      actions$.next(scaffoldSearchActions.exportButtonClicked())
    })

    it('should handle export with empty results', (done) => {
      const mockColumns: DataTableColumn[] = [
        {
          columnType: ColumnType.STRING,
          id: 'source',
          nameKey: 'SCAFFOLD_SEARCH.RESULTS.SOURCE'
        }
      ]
      const mockViewModel = {
        resultComponentState: { displayedColumns: mockColumns },
        results: [] as RowListGridData[]
      }
      store.overrideSelector(selectScaffoldSearchViewModel, mockViewModel as ScaffoldSearchViewModel)

      effects.exportData$.pipe(take(1)).subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(mockColumns, [], 'export_scaffold.csv')
        done()
      })

      actions$.next(scaffoldSearchActions.exportButtonClicked())
    })
  })

  describe('displayError$', () => {
    it('should display error message when ResultsLoadingFailed action is dispatched', (done) => {
      effects.displayError$.pipe(take(1)).subscribe(() => {
        expect(messageService.error).toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.scaffoldSearchResultsLoadingFailed({ error: 'Test error' }))
    })
  })

  describe('navigateToOrderDetailsPage$', () => {
    it('should navigate to details page with correct URL structure', (done) => {
      const testId = 'test-123'
      const navigateSpy = router
        ? jest.spyOn(router, 'navigate')
        : // eslint-disable-next-line @typescript-eslint/no-empty-function
          { mock: { calls: [] }, toHaveBeenCalledWith: () => {} }

      effects.navigateToOrderDetailsPage$.pipe(take(1)).subscribe(() => {
        if (router) {
          expect(navigateSpy).toHaveBeenCalledWith(['/search', 'details', testId])
        }
        done()
      })

      actions$.next(scaffoldSearchActions.detailsButtonClicked({ id: testId }))
    })

    it('should dynamically clear query params and fragment from URL on navigateToOrderDetailsPage$', (done) => {
      const testId = 'test-456'
      const mockUrlTree = {
        toString: jest.fn(() => '/search'),
        queryParams: { a: 1 },
        fragment: 'frag'
      }
      ;(router.parseUrl as jest.Mock).mockReturnValue(mockUrlTree)

      const emissions: { queryParams: unknown; fragment: unknown }[] = []
      emissions.push({ queryParams: { ...mockUrlTree.queryParams }, fragment: mockUrlTree.fragment })

      effects.navigateToOrderDetailsPage$.pipe(take(1)).subscribe(() => {
        emissions.push({ queryParams: { ...mockUrlTree.queryParams }, fragment: mockUrlTree.fragment })

        expect(emissions).toEqual([
          { queryParams: { a: 1 }, fragment: 'frag' },
          { queryParams: {}, fragment: null }
        ])
        done()
      })

      actions$.next(scaffoldSearchActions.detailsButtonClicked({ id: testId }))
    })
  })

  describe('loadSkills$', () => {
    it('should displatch scaffoldSkillsReceived with the loaded skills', (done) => {
      const mockSkills = [
        { id: 'skill-1', name: 'Skill 1' },
        { id: 'skill-2', name: 'Skill 2' }
      ]

      skillService.findSkillByCriteria.mockReturnValue(
        of({ stream: mockSkills } as unknown as HttpEvent<SkillPageResult>)
      )

      effects.loadSkills$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(scaffoldSearchActions.scaffoldSkillsReceived({ skills: mockSkills }))
        done()
      })

      actions$.next(scaffoldSearchActions.loadSkills())
    })
  })

  it('should default to an empty skills array when the result has no stream', (done) => {
    skillService.findSkillByCriteria.mockReturnValue(of({} as unknown as HttpEvent<SkillPageResult>))

    effects.loadSkills$.pipe(take(1)).subscribe((action) => {
      expect(action).toEqual(scaffoldSearchActions.scaffoldSkillsReceived({ skills: [] }))
      done()
    })

    actions$.next(scaffoldSearchActions.loadSkills())
  })

  it('should dispatch scaffoldSkillsLoadingFailed on error', (done) => {
    const mockError = 'Load skills failed'
    skillService.findSkillByCriteria.mockReturnValueOnce(throwError(() => mockError))

    effects.loadSkills$.pipe(take(1)).subscribe((action) => {
      expect(action).toEqual(scaffoldSearchActions.scaffoldSkillsLoadingFailed({ error: mockError }))
      done()
    })

    actions$.next(scaffoldSearchActions.loadSkills())
  })

  describe('refreshSearchAfterCreateUpdate$', () => {
    beforeEach(() => {
      store.overrideSelector(scaffoldSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      scaffoldService.findScaffoldByCriteria.mockReturnValue(
        of({
          stream: [{ id: '1', name: 'Item 1' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        } as unknown as HttpEvent<ScaffoldPageResult>)
      )
    })

    it('should perform search after createScaffoldSucceeded', (done) => {
      effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(scaffoldSearchActions.scaffoldSearchResultsReceived.type)
        done()
      })

      actions$.next(scaffoldSearchActions.createScaffoldSucceeded())
    })

    it('should perform search after updateScaffoldSucceeded', (done) => {
      effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(scaffoldSearchActions.scaffoldSearchResultsReceived.type)
        done()
      })

      actions$.next(scaffoldSearchActions.updateScaffoldSucceeded())
    })
  })

  describe('editButtonClicked$', () => {
    const item = { id: '1', name: 'Item 1' }
    const mockSkills = [{ id: 'skill-1', name: 'Skill 1' }]

    beforeEach(() => {
      store.overrideSelector(scaffoldSearchSelectors.selectResults, [item] as never)
      store.overrideSelector(scaffoldSearchSelectors.selectSkills, mockSkills as never)
      store.refreshState()
    })

    it('should dispatch updateScaffoldSucceeded when update succeeds', (done) => {
      const dialog = { button: 'primary', result: { ...item } }
      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      scaffoldService.updateScaffoldById.mockReturnValue(of({} as HttpEvent<Scaffold>))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(scaffoldSearchActions.updateScaffoldSucceeded.type)
        expect(messageService.success).toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.editScaffoldButtonClicked({ id: '1' }))
    })

    it('should dispatch updateScaffoldCancelled and not call the service when dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: null }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(scaffoldSearchActions.updateScaffoldCancelled.type)
        expect(scaffoldService.updateScaffoldById).not.toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.editScaffoldButtonClicked({ id: '1' }))
    })

    it('should dispatch updateScaffoldFailed when dialog confirms but returns no result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(scaffoldSearchActions.updateScaffoldFailed.type)
        expect(scaffoldService.updateScaffoldById).not.toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.editScaffoldButtonClicked({ id: '1' }))
    })

    it('should dispatch updateScaffoldFailed when the edited item has no id', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: { name: 'No id' } }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(scaffoldSearchActions.updateScaffoldFailed.type)
        expect(scaffoldService.updateScaffoldById).not.toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.editScaffoldButtonClicked({ id: '1' }))
    })

    it('should dispatch updateScaffoldFailed and show an error message when the API update call fails', (done) => {
      const dialog = { button: 'primary', result: { ...item } }
      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      scaffoldService.updateScaffoldById.mockReturnValue(throwError(() => 'Update failed'))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(scaffoldSearchActions.updateScaffoldFailed({ error: 'Update failed' }))
        expect(messageService.error).toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.editScaffoldButtonClicked({ id: '1' }))
    })
  })

  describe('createButtonClicked$', () => {
    const mockSkills = [{ id: 'skill-1', name: 'Skill 1' }]

    beforeEach(() => {
      store.overrideSelector(scaffoldSearchSelectors.selectSkills, mockSkills as never)
      store.refreshState()
    })

    it('should dispatch createScaffoldSucceeded when creation succeeds', (done) => {
      const dialog = { button: 'primary', result: { name: 'New scaffold' } }
      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      scaffoldService.createScaffold.mockReturnValue(of({} as HttpEvent<Scaffold>))

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(scaffoldSearchActions.createScaffoldSucceeded.type)
        expect(messageService.success).toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.createScaffoldButtonClicked())
    })

    it('should dispatch createScaffoldCancelled and not call the service when dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: { name: 'x' } }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(scaffoldSearchActions.createScaffoldCancelled.type)
        expect(scaffoldService.createScaffold).not.toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.createScaffoldButtonClicked())
    })

    it('should dispatch createScaffoldFailed when dialog confirms but returns no result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(scaffoldSearchActions.createScaffoldFailed.type)
        expect(scaffoldService.createScaffold).not.toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.createScaffoldButtonClicked())
    })

    it('should dispatch createScaffoldFailed and show an error message when the API create call fails', (done) => {
      const dialog = { button: 'primary', result: { name: 'New scaffold' } }
      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      scaffoldService.createScaffold.mockReturnValue(throwError(() => 'API Error'))

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(scaffoldSearchActions.createScaffoldFailed({ error: 'API Error' }))
        expect(messageService.error).toHaveBeenCalled()
        done()
      })

      actions$.next(scaffoldSearchActions.createScaffoldButtonClicked())
    })
  })

  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>
})
