import { AfterViewInit, Directive, ElementRef, Input, OnChanges } from '@angular/core'

// PrimeNG 19.1.4 does not forward host aria-describedby to its focusable combobox
// and exposes neither ariaDescribedBy nor pt/passThrough inputs (only naming APIs).
// https://github.com/primefaces/primeng/blob/19.1.4/packages/primeng/src/select/select.ts#L154-L178
// Remove this bridge when the installed Select has a public description/attribute API
// targeting that combobox; ariaLabel/ariaLabelledBy change its name, not its description.
@Directive({
  selector: 'p-select[appDescribedBy]',
  standalone: true
})
export class PrimeSelectDescribedByDirective implements AfterViewInit, OnChanges {
  @Input() appDescribedBy: string | null = null

  constructor(private readonly element: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.updateDescription()
  }

  ngOnChanges(): void {
    this.updateDescription()
  }

  private updateDescription(): void {
    const combobox = this.element.nativeElement.querySelector('[role="combobox"]')
    if (!combobox) {
      return
    }
    if (this.appDescribedBy) {
      combobox.setAttribute('aria-describedby', this.appDescribedBy)
    } else {
      combobox.removeAttribute('aria-describedby')
    }
  }
}
