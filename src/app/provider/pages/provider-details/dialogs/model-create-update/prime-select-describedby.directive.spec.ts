import { ElementRef } from '@angular/core'
import { PrimeSelectDescribedByDirective } from './prime-select-describedby.directive'

describe('PrimeSelectDescribedByDirective', () => {
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
