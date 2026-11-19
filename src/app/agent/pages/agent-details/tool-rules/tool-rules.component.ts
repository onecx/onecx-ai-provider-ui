import { CommonModule } from '@angular/common'
import { Component, Input, OnChanges } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { finalize, forkJoin, Observable, of, tap } from 'rxjs'
import { ButtonModule } from 'primeng/button'
import { CheckboxModule } from 'primeng/checkbox'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ConfirmationService } from 'primeng/api'
import { SelectModule } from 'primeng/select'
import { TableModule } from 'primeng/table'
import { TagModule } from 'primeng/tag'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import {
  AgentService,
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
  requiredPermission?: string
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
    CheckboxModule,
    ConfirmDialogModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule
  ],
  providers: [ConfirmationService],
  templateUrl: './tool-rules.component.html'
})
export class AgentToolRulesComponent implements OnChanges {
  @Input() agentId?: string
  @Input() toolId?: string

  rows: AgentToolRuleRow[] = []
  selectedRows: AgentToolRuleRow[] = []
  bulkPermission: ToolPermission | null = null
  bulkSaving = false
  loading = false
  discoveryError = false

  readonly permissionOptions = [
    { label: 'TOOL_RULES.DENY', value: ToolPermission.Deny },
    { label: 'TOOL_RULES.ALWAYS_ASK', value: ToolPermission.AlwaysAsk },
    { label: 'TOOL_RULES.ALWAYS_ALLOW', value: ToolPermission.AlwaysAllow }
  ]

  constructor(
    private readonly toolService: ToolService,
    private readonly agentService: AgentService,
    private readonly messageService: PortalMessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly translateService: TranslateService
  ) {}

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
    this.selectedRows = []
    this.bulkPermission = null
    // Capture the toolId at request time so a stale response from a previous
    // tool can be discarded if toolId changed while the request was in flight.
    const requestedToolId = this.toolId
    this.toolService
      .getDiscoveredTools(this.toolId, this.agentId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          if (requestedToolId !== this.toolId) {
            return
          }
          this.rows = (result.tools ?? []).map((tool) => ({
            name: tool.name ?? '',
            description: tool.description,
            annotations: tool.annotations,
            autoDangerLevel: tool.autoDangerLevel,
            allowed: tool.existingRule?.allowed ?? ToolPermission.Deny,
            existingRule: tool.existingRule,
            orphaned: tool.orphaned ?? false,
            requiredPermission: tool.requiredPermission,
            dirty: false,
            saving: false
          }))
        },
        error: () => {
          if (requestedToolId !== this.toolId) {
            return
          }
          this.discoveryError = true
          this.rows = []
        }
      })
  }

  onPermissionChange(row: AgentToolRuleRow): void {
    row.dirty = true
  }

  isRowSelected(row: AgentToolRuleRow): boolean {
    return this.selectedRows.includes(row)
  }

  toggleRowSelection(row: AgentToolRuleRow, selected: boolean): void {
    if (selected) {
      if (!this.isRowSelected(row)) {
        this.selectedRows = [...this.selectedRows, row]
      }
      return
    }
    this.selectedRows = this.selectedRows.filter((selectedRow) => selectedRow !== row)
  }

  get allRowsSelected(): boolean {
    return this.rows.length > 0 && this.selectedRows.length === this.rows.length
  }

  toggleSelectAll(selected: boolean): void {
    this.selectedRows = selected ? [...this.rows] : []
  }

  save(row: AgentToolRuleRow): void {
    if (!this.agentId || !this.toolId) {
      return
    }
    row.saving = true
    this.saveRows([row])
      .pipe(
        tap(() => (row.dirty = false)),
        finalize(() => (row.saving = false))
      )
      .subscribe({
        next: () => {
          this.refresh()
        },
        error: () => {
          this.messageService.error({ summaryKey: 'TOOL_RULES.ERROR.SAVE' })
        }
      })
  }

  applyBulkPermission(): void {
    if (!this.agentId || !this.toolId || !this.bulkPermission || this.selectedRows.length === 0) {
      return
    }

    const selectedPermission = this.bulkPermission
    const rows = [...this.selectedRows]
    this.bulkSaving = true
    rows.forEach((row) => {
      row.allowed = selectedPermission
      row.dirty = true
      row.saving = true
    })

    this.saveRows(rows)
      .pipe(finalize(() => (this.bulkSaving = false)))
      .subscribe({
        next: () => {
          rows.forEach((row) => {
            row.dirty = false
            row.saving = false
          })
          this.selectedRows = []
          this.bulkPermission = null
          this.refresh()
        },
        error: () => {
          rows.forEach((row) => (row.saving = false))
          this.messageService.error({ summaryKey: 'TOOL_RULES.ERROR.BULK' })
        }
      })
  }

  private saveRows(rows: AgentToolRuleRow[]): Observable<unknown[]> {
    if (!this.agentId || !this.toolId) {
      return of([])
    }

    const requests: Observable<unknown>[] = []
    const newRows = rows.filter((row) => !row.existingRule)
    const existingRows = rows.filter((row) => row.existingRule?.id)

    if (newRows.length > 0) {
      requests.push(
        this.agentService.createAgentMcpToolRule(
          this.agentId,
          this.toolId,
          newRows.map((row) => ({
            toolName: row.name,
            toolDescription: row.description,
            allowed: row.allowed
          }))
        )
      )
    }
    if (existingRows.length > 0) {
      requests.push(
        this.agentService.updateAgentMcpToolRule(
          this.agentId,
          this.toolId,
          existingRows.map((row) => ({
            id: row.existingRule!.id!,
            modificationCount: row.existingRule?.modificationCount ?? 0,
            allowed: row.allowed
          }))
        )
      )
    }

    return forkJoin(requests)
  }

  deleteRule(row: AgentToolRuleRow): void {
    if (!this.agentId || !this.toolId || !row.existingRule?.id) {
      return
    }
    const agentId = this.agentId
    const toolId = this.toolId
    const ruleId = row.existingRule.id
    this.confirmationService.confirm({
      message: this.translateService.instant('TOOL_RULES.CONFIRM_DELETE_MESSAGE'),
      header: this.translateService.instant('TOOL_RULES.CONFIRM_DELETE_HEADER'),
      acceptLabel: this.translateService.instant('TOOL_RULES.CONFIRM_DELETE_ACCEPT'),
      rejectLabel: this.translateService.instant('TOOL_RULES.CONFIRM_DELETE_REJECT'),
      icon: 'pi pi-exclamation-triangle',
      key: 'confirmDeleteRule',
      accept: () => {
        row.saving = true
        this.agentService
          .deleteAgentMcpToolRule(agentId, toolId, ruleId)
          .pipe(finalize(() => (row.saving = false)))
          .subscribe({
            next: () => this.refresh(),
            error: () => {
              this.messageService.error({ summaryKey: 'TOOL_RULES.ERROR.DELETE' })
            }
          })
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
