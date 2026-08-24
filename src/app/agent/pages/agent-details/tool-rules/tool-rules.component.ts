import { CommonModule } from '@angular/common'
import { Component, Input, OnChanges } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { finalize } from 'rxjs'
import { ButtonModule } from 'primeng/button'
import { SelectModule } from 'primeng/select'
import { TableModule } from 'primeng/table'
import { TagModule } from 'primeng/tag'
import { TooltipModule } from 'primeng/tooltip'

import {
  AgentMcpToolRule,
  DangerLevel,
  DiscoveredToolAnnotations,
  ToolPermission,
  ToolService
} from 'src/app/shared/generated'

interface AgentToolRuleRow {
  name: string
  description?: string
  annotations?: DiscoveredToolAnnotations
  autoDangerLevel?: DangerLevel
  allowed: ToolPermission
  existingRule?: AgentMcpToolRule
  orphaned: boolean
  dirty: boolean
  saving: boolean
}

@Component({
  selector: 'app-agent-tool-rules',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ButtonModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './tool-rules.component.html'
})
export class AgentToolRulesComponent implements OnChanges {
  @Input() agentId?: string
  @Input() toolId?: string

  rows: AgentToolRuleRow[] = []
  loading = false
  discoveryError = false

  readonly permissionOptions = [
    { label: 'TOOL_RULES.ALLOW', value: ToolPermission.Allow },
    { label: 'TOOL_RULES.DENY', value: ToolPermission.Deny },
    { label: 'TOOL_RULES.ALWAYS_ASK', value: ToolPermission.AlwaysAsk }
  ]

  constructor(private readonly toolService: ToolService) {}

  ngOnChanges(): void {
    if (this.agentId && this.toolId) {
      this.refresh()
    }
  }

  refresh(): void {
    if (!this.agentId || !this.toolId) {
      return
    }
    this.loading = true
    this.discoveryError = false
    this.toolService
      .getDiscoveredTools(this.toolId, this.agentId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.rows = (result.tools ?? []).map((tool) => ({
            name: tool.name ?? '',
            description: tool.description,
            annotations: tool.annotations,
            autoDangerLevel: tool.autoDangerLevel,
            allowed: tool.existingRule?.allowed ?? ToolPermission.Deny,
            existingRule: tool.existingRule,
            orphaned: tool.orphaned ?? false,
            dirty: false,
            saving: false
          }))
        },
        error: () => {
          this.discoveryError = true
          this.rows = []
        }
      })
  }

  onPermissionChange(row: AgentToolRuleRow): void {
    row.dirty = true
  }

  save(row: AgentToolRuleRow): void {
    if (!this.agentId || !this.toolId) {
      return
    }
    row.saving = true
    const request = row.existingRule
      ? this.toolService.updateAgentMcpToolRule(this.agentId, this.toolId, row.existingRule.id ?? '', {
          modificationCount: row.existingRule.modificationCount ?? 0,
          allowed: row.allowed
        })
      : this.toolService.createAgentMcpToolRule(this.agentId, this.toolId, {
          toolName: row.name,
          toolDescription: row.description,
          allowed: row.allowed
        })
    request.pipe(finalize(() => (row.saving = false))).subscribe({
      next: () => {
        row.dirty = false
        this.refresh()
      },
      error: () => {
        row.saving = false
      }
    })
  }

  deleteRule(row: AgentToolRuleRow): void {
    if (!this.agentId || !this.toolId || !row.existingRule?.id) {
      return
    }
    row.saving = true
    this.toolService
      .deleteAgentMcpToolRule(this.agentId, this.toolId, row.existingRule.id)
      .pipe(finalize(() => (row.saving = false)))
      .subscribe({
        next: () => this.refresh(),
        error: () => {
          row.saving = false
        }
      })
  }

  dangerSeverity(level?: DangerLevel): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (level) {
      case DangerLevel.Safe:
        return 'success'
      case DangerLevel.Warning:
        return 'warn'
      case DangerLevel.Dangerous:
        return 'danger'
      default:
        return 'secondary'
    }
  }

  annotationBadges(row: AgentToolRuleRow): string[] {
    const badges: string[] = []
    if (row.annotations?.readOnlyHint) badges.push('TOOL_RULES.ANNOTATIONS.READ_ONLY')
    if (row.annotations?.destructiveHint) badges.push('TOOL_RULES.ANNOTATIONS.DESTRUCTIVE')
    if (row.annotations?.idempotentHint) badges.push('TOOL_RULES.ANNOTATIONS.IDEMPOTENT')
    if (row.annotations?.openWorldHint) badges.push('TOOL_RULES.ANNOTATIONS.OPEN_WORLD')
    return badges
  }
}
