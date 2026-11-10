import { AfterViewInit, Directive, ElementRef, Input, OnChanges } from '@angular/core'

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
