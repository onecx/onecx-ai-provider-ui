import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { firstValueFrom, Observable, of } from 'rxjs'

import { LabelResolver } from './label.resolver'

describe('LabelResolver', () => {
  const translateService = {
    get: jest.fn()
  } as unknown as TranslateService
  const routerState = {} as RouterStateSnapshot
  let resolver: LabelResolver

  beforeEach(() => {
    jest.clearAllMocks()
    resolver = new LabelResolver(translateService)
  })

  it('translates the breadcrumb key', async () => {
    translateService.get = jest.fn().mockReturnValue(of('Translated label'))
    const route = {
      data: { breadcrumb: 'AGENT_DETAILS.HEADER' },
      routeConfig: { path: 'details/:id' }
    } as unknown as ActivatedRouteSnapshot

    const result = resolver.resolve(route, routerState)

    expect(await firstValueFrom(result as Observable<string>)).toBe('Translated label')
    expect(translateService.get).toHaveBeenCalledWith('AGENT_DETAILS.HEADER')
  })

  it('uses the route path when no breadcrumb key is defined', () => {
    const route = {
      data: {},
      routeConfig: { path: 'details/:id' }
    } as unknown as ActivatedRouteSnapshot

    expect(resolver.resolve(route, routerState)).toBe('details/:id')
    expect(translateService.get).not.toHaveBeenCalled()
  })

  it('returns an empty string when no breadcrumb key or route path is defined', () => {
    const route = {
      data: {},
      routeConfig: {}
    } as unknown as ActivatedRouteSnapshot

    expect(resolver.resolve(route, routerState)).toBe('')
    expect(translateService.get).not.toHaveBeenCalled()
  })
})
