import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { CheckboxModule } from 'primeng/checkbox'
import { SelectModule } from 'primeng/select'
import { TableModule } from 'primeng/table'

import { AgentConfiguration, AgentConfigurationVersion } from 'src/app/shared/generated'
import { ConfigurationVersionDiffRow, diffConfigurationVersions } from './configuration-version-diff'

interface VersionOption {
  label: string
  value: string
}

@Component({
  selector: 'app-agent-configuration-version-compare',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, CheckboxModule, SelectModule, TableModule],
  templateUrl: './configuration-version-compare.component.html'
})
export class AgentConfigurationVersionCompareComponent implements OnChanges {
  @Input() versions: AgentConfigurationVersion[] = []
  @Input() details: Record<string, AgentConfiguration> = {}
  @Output() detailRequested = new EventEmitter<string>()

  leftId?: string
  rightId?: string
  showOnlyChanged = true
  rows: ConfigurationVersionDiffRow[] = []

  get options(): VersionOption[] {
    return this.versions
      .filter((version) => !!version.id)
      .map((version) => ({ label: version.name ?? version.id!, value: version.id! }))
  }

  get visibleRows(): ConfigurationVersionDiffRow[] {
    return this.showOnlyChanged ? this.rows.filter((row) => row.changed) : this.rows
  }

  get changedCount(): number {
    return this.rows.filter((row) => row.changed).length
  }

  ngOnChanges(): void {
    if (!this.leftId || !this.options.some((option) => option.value === this.leftId)) {
      this.leftId = this.options[1]?.value ?? this.options[0]?.value
    }
    if (!this.rightId || !this.options.some((option) => option.value === this.rightId)) {
      this.rightId = this.options[0]?.value
    }
    this.requestMissingDetails()
    this.recalculate()
  }

  onSelectionChange(): void {
    this.requestMissingDetails()
    this.recalculate()
  }

  private requestMissingDetails(): void {
    ;[this.leftId, this.rightId]
      .filter((id): id is string => !!id && !this.details[id])
      .forEach((id) => this.detailRequested.emit(id))
  }

  private recalculate(): void {
    const left = this.leftId ? this.details[this.leftId] : undefined
    const right = this.rightId ? this.details[this.rightId] : undefined
    this.rows = left && right ? diffConfigurationVersions(left, right) : []
  }
}
