import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable, map } from 'rxjs'

@Injectable()
export class LabelResolver implements Resolve<string> {
  constructor(private readonly translate: TranslateService) {}

  resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): string | Observable<string> | Promise<string> {
    return route.data['breadcrumb']
      ? this.translate.get(route.data['breadcrumb']).pipe(map((translation) => translation.toString()))
      : (route.routeConfig?.path ?? '')
  }
}
