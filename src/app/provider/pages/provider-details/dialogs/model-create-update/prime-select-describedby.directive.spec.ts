import { Component, ElementRef } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { SelectModule } from 'primeng/select'
import { PrimeSelectDescribedByDirective } from './prime-select-describedby.directive'

@Component({
  standalone: true,
  imports: [SelectModule, PrimeSelectDescribedByDirective],
  template: `
    <p-select inputId="host_only" [attr.aria-describedby]="description" />
    <p-select inputId="bridged" [appDescribedBy]="description" />
  `
})
class SelectDescriptionTestComponent {
  description: string | null = 'model_config_legacy_warning'
}

describe('PrimeSelectDescribedByDirective', () => {
  it('describes the actual focusable PrimeNG combobox, unlike a host attribute', () => {
    TestBed.configureTestingModule({ imports: [SelectDescriptionTestComponent] })
    const fixture = TestBed.createComponent(SelectDescriptionTestComponent)

    fixture.detectChanges()

    const element: HTMLElement = fixture.nativeElement
    const hostOnly = element.querySelector('p-select')
    const unbridged = element.querySelector('#host_only[role="combobox"]')
    const bridged = element.querySelector('#bridged[role="combobox"]')
    expect(hostOnly?.getAttribute('aria-describedby')).toBe('model_config_legacy_warning')
    expect(unbridged).not.toBeNull()
    expect(unbridged?.hasAttribute('aria-describedby')).toBe(false)
    expect(bridged).not.toBeNull()
    expect(bridged?.getAttribute('tabindex')).toBe('0')
    expect(bridged?.getAttribute('aria-describedby')).toBe('model_config_legacy_warning')
  })

  it('updates, removes and restores descriptions through Angular input changes', () => {
    TestBed.configureTestingModule({ imports: [SelectDescriptionTestComponent] })
    const fixture = TestBed.createComponent(SelectDescriptionTestComponent)
    fixture.componentInstance.description = null
    fixture.detectChanges()
    const combobox: HTMLElement = fixture.nativeElement.querySelector('#bridged[role="combobox"]')

    expect(combobox.hasAttribute('aria-describedby')).toBe(false)
    for (const description of ['first_warning', 'first_warning second_warning', null, 'restored_warning', '']) {
      fixture.componentInstance.description = description
      fixture.detectChanges()

      expect(combobox.getAttribute('aria-describedby')).toBe(description || null)
    }
  })

  it('sets the description on the PrimeNG combobox', () => {
    const host = document.createElement('p-select')
    const combobox = document.createElement('div')
    combobox.setAttribute('role', 'combobox')
    host.appendChild(combobox)
    const directive = new PrimeSelectDescribedByDirective(new ElementRef(host))
    directive.appDescribedBy = 'model_config_legacy_warning'

    directive.ngAfterViewInit()

    expect(combobox.getAttribute('aria-describedby')).toBe('model_config_legacy_warning')
  })

  it('does nothing when the PrimeNG combobox is not yet rendered', () => {
    const directive = new PrimeSelectDescribedByDirective(new ElementRef(document.createElement('p-select')))
    directive.appDescribedBy = 'model_config_legacy_warning'

    expect(() => directive.ngAfterViewInit()).not.toThrow()
  })

  it('removes stale descriptions when no alert is present', () => {
    const host = document.createElement('p-select')
    const combobox = document.createElement('div')
    combobox.setAttribute('role', 'combobox')
    combobox.setAttribute('aria-describedby', 'model_config_legacy_warning')
    host.appendChild(combobox)
    const directive = new PrimeSelectDescribedByDirective(new ElementRef(host))
    directive.appDescribedBy = null

    directive.ngAfterViewInit()

    expect(combobox.hasAttribute('aria-describedby')).toBe(false)
  })
})
