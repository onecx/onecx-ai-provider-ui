import { of, throwError } from 'rxjs'

import {
  AgentMcpToolRule,
  DangerLevel,
  DiscoveredToolInfo,
  ToolPermission,
  ToolService
} from 'src/app/shared/generated'

import { AgentToolRulesComponent } from './tool-rules.component'

describe('AgentToolRulesComponent', () => {
  let component: AgentToolRulesComponent
  let toolService: jest.Mocked<ToolService>

  beforeEach(() => {
    toolService = {
      getDiscoveredTools: jest.fn(),
      createAgentMcpToolRule: jest.fn(),
      updateAgentMcpToolRule: jest.fn(),
      deleteAgentMcpToolRule: jest.fn()
    } as unknown as jest.Mocked<ToolService>
    component = new AgentToolRulesComponent(toolService)
  })

  describe('ngOnChanges', () => {
    it('calls refresh when both agentId and toolId are set', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.getDiscoveredTools.mockReturnValue(of({ tools: [] }) as any)
      const spy = jest.spyOn(component, 'refresh')

      component.ngOnChanges()

      expect(spy).toHaveBeenCalled()
    })

    it('does not call refresh when agentId is missing', () => {
      component.toolId = 'tool-1'
      const spy = jest.spyOn(component, 'refresh')

      component.ngOnChanges()

      expect(spy).not.toHaveBeenCalled()
    })

    it('does not call refresh when toolId is missing', () => {
      component.agentId = 'agent-1'
      const spy = jest.spyOn(component, 'refresh')

      component.ngOnChanges()

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('does nothing when agentId is missing', () => {
      component.toolId = 'tool-1'
      component.refresh()
      expect(toolService.getDiscoveredTools).not.toHaveBeenCalled()
    })

    it('does nothing when toolId is missing', () => {
      component.agentId = 'agent-1'
      component.refresh()
      expect(toolService.getDiscoveredTools).not.toHaveBeenCalled()
    })

    it('populates rows from discovered tools', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      const tools: DiscoveredToolInfo[] = [
        {
          name: 'search_docs',
          description: 'Search docs',
          annotations: { readOnlyHint: true },
          autoDangerLevel: DangerLevel.Safe,
          existingRule: { id: 'rule-1', modificationCount: 0, allowed: ToolPermission.Allow },
          orphaned: false
        },
        {
          name: 'delete_all',
          description: 'Delete everything',
          autoDangerLevel: DangerLevel.Dangerous,
          orphaned: true
        }
      ]
      toolService.getDiscoveredTools.mockReturnValue(of({ tools }) as any)

      component.refresh()

      expect(component.rows).toHaveLength(2)
      expect(component.rows[0]).toEqual({
        name: 'search_docs',
        description: 'Search docs',
        annotations: { readOnlyHint: true },
        autoDangerLevel: DangerLevel.Safe,
        allowed: ToolPermission.Allow,
        existingRule: { id: 'rule-1', modificationCount: 0, allowed: ToolPermission.Allow },
        orphaned: false,
        dirty: false,
        saving: false
      })
      expect(component.rows[1].allowed).toBe(ToolPermission.Deny)
      expect(component.rows[1].orphaned).toBe(true)
      expect(component.discoveryError).toBe(false)
    })

    it('handles null tools array', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.getDiscoveredTools.mockReturnValue(of({ tools: null }) as any)

      component.refresh()

      expect(component.rows).toHaveLength(0)
    })

    it('defaults tool name to empty string when null', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      const tools: DiscoveredToolInfo[] = [
        {
          name: null as any,
          description: 'No name',
          autoDangerLevel: DangerLevel.Safe,
          orphaned: false
        }
      ]
      toolService.getDiscoveredTools.mockReturnValue(of({ tools }) as any)

      component.refresh()

      expect(component.rows[0].name).toBe('')
    })

    it('defaults orphaned to false when undefined', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      const tools: DiscoveredToolInfo[] = [
        {
          name: 'tool',
          description: 'desc',
          autoDangerLevel: DangerLevel.Safe,
          orphaned: undefined as any
        }
      ]
      toolService.getDiscoveredTools.mockReturnValue(of({ tools }) as any)

      component.refresh()

      expect(component.rows[0].orphaned).toBe(false)
    })

    it('defaults allowed to Deny when existingRule has null allowed', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      const tools: DiscoveredToolInfo[] = [
        {
          name: 'tool',
          description: 'desc',
          autoDangerLevel: DangerLevel.Safe,
          existingRule: { id: 'rule-1', modificationCount: 0, allowed: null as any },
          orphaned: false
        }
      ]
      toolService.getDiscoveredTools.mockReturnValue(of({ tools }) as any)

      component.refresh()

      expect(component.rows[0].allowed).toBe(ToolPermission.Deny)
    })

    it('sets discoveryError on error', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.getDiscoveredTools.mockReturnValue(throwError(() => new Error('network')) as any)

      component.refresh()

      expect(component.discoveryError).toBe(true)
      expect(component.rows).toHaveLength(0)
    })

    it('sets loading to false after success', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.getDiscoveredTools.mockReturnValue(of({ tools: [] }) as any)

      component.refresh()

      expect(component.loading).toBe(false)
    })

    it('sets loading to false after error', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.getDiscoveredTools.mockReturnValue(throwError(() => new Error('network')) as any)

      component.refresh()

      expect(component.loading).toBe(false)
    })
  })

  describe('onPermissionChange', () => {
    it('sets dirty flag on the row', () => {
      const row = { name: 'test', allowed: ToolPermission.Allow, orphaned: false, dirty: false, saving: false }
      component.onPermissionChange(row)
      expect(row.dirty).toBe(true)
    })
  })

  describe('save', () => {
    it('does nothing when agentId is missing', () => {
      component.toolId = 'tool-1'
      const row = { name: 'test', allowed: ToolPermission.Allow, orphaned: false, dirty: true, saving: false }
      component.save(row)
      expect(toolService.createAgentMcpToolRule).not.toHaveBeenCalled()
    })

    it('does nothing when toolId is missing', () => {
      component.agentId = 'agent-1'
      const row = { name: 'test', allowed: ToolPermission.Allow, orphaned: false, dirty: true, saving: false }
      component.save(row)
      expect(toolService.createAgentMcpToolRule).not.toHaveBeenCalled()
    })

    it('creates rule when no existingRule', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.createAgentMcpToolRule.mockReturnValue(of({}) as any)
      toolService.getDiscoveredTools.mockReturnValue(of({ tools: [] }) as any)
      const row = {
        name: 'search_docs',
        description: 'Search',
        allowed: ToolPermission.Allow,
        orphaned: false,
        dirty: true,
        saving: false
      }

      component.save(row)

      expect(toolService.createAgentMcpToolRule).toHaveBeenCalledWith('agent-1', 'tool-1', {
        toolName: 'search_docs',
        toolDescription: 'Search',
        allowed: ToolPermission.Allow
      })
      expect(row.dirty).toBe(false)
      expect(row.saving).toBe(false)
    })

    it('updates rule when existingRule is present', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.updateAgentMcpToolRule.mockReturnValue(of({}) as any)
      toolService.getDiscoveredTools.mockReturnValue(of({ tools: [] }) as any)
      const existingRule: AgentMcpToolRule = { id: 'rule-1', modificationCount: 2, allowed: ToolPermission.Deny }
      const row = {
        name: 'search_docs',
        description: 'Search',
        allowed: ToolPermission.Allow,
        existingRule,
        orphaned: false,
        dirty: true,
        saving: false
      }

      component.save(row)

      expect(toolService.updateAgentMcpToolRule).toHaveBeenCalledWith('agent-1', 'tool-1', 'rule-1', {
        modificationCount: 2,
        allowed: ToolPermission.Allow
      })
      expect(row.dirty).toBe(false)
      expect(row.saving).toBe(false)
    })

    it('updates rule with empty string when existingRule id is undefined', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.updateAgentMcpToolRule.mockReturnValue(of({}) as any)
      toolService.getDiscoveredTools.mockReturnValue(of({ tools: [] }) as any)
      const existingRule: AgentMcpToolRule = { id: undefined, modificationCount: 1, allowed: ToolPermission.Deny }
      const row = {
        name: 'search_docs',
        description: 'Search',
        allowed: ToolPermission.Allow,
        existingRule,
        orphaned: false,
        dirty: true,
        saving: false
      }

      component.save(row)

      expect(toolService.updateAgentMcpToolRule).toHaveBeenCalledWith('agent-1', 'tool-1', '', {
        modificationCount: 1,
        allowed: ToolPermission.Allow
      })
    })

    it('updates rule with 0 when modificationCount is undefined', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.updateAgentMcpToolRule.mockReturnValue(of({}) as any)
      toolService.getDiscoveredTools.mockReturnValue(of({ tools: [] }) as any)
      const existingRule: AgentMcpToolRule = {
        id: 'rule-1',
        modificationCount: undefined,
        allowed: ToolPermission.Deny
      }
      const row = {
        name: 'search_docs',
        description: 'Search',
        allowed: ToolPermission.Allow,
        existingRule,
        orphaned: false,
        dirty: true,
        saving: false
      }

      component.save(row)

      expect(toolService.updateAgentMcpToolRule).toHaveBeenCalledWith('agent-1', 'tool-1', 'rule-1', {
        modificationCount: 0,
        allowed: ToolPermission.Allow
      })
    })

    it('sets saving to false on error', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.createAgentMcpToolRule.mockReturnValue(throwError(() => new Error('fail')) as any)
      const row = {
        name: 'search_docs',
        allowed: ToolPermission.Allow,
        orphaned: false,
        dirty: true,
        saving: false
      }

      component.save(row)

      expect(row.saving).toBe(false)
    })
  })

  describe('deleteRule', () => {
    it('does nothing when agentId is missing', () => {
      component.toolId = 'tool-1'
      const row = {
        name: 'test',
        allowed: ToolPermission.Deny,
        existingRule: { id: 'rule-1' },
        orphaned: false,
        dirty: false,
        saving: false
      }
      component.deleteRule(row)
      expect(toolService.deleteAgentMcpToolRule).not.toHaveBeenCalled()
    })

    it('does nothing when existingRule has no id', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      const row = {
        name: 'test',
        allowed: ToolPermission.Deny,
        existingRule: { id: undefined },
        orphaned: false,
        dirty: false,
        saving: false
      }
      component.deleteRule(row)
      expect(toolService.deleteAgentMcpToolRule).not.toHaveBeenCalled()
    })

    it('does nothing when toolId is missing', () => {
      component.agentId = 'agent-1'
      const row = {
        name: 'test',
        allowed: ToolPermission.Deny,
        existingRule: { id: 'rule-1' },
        orphaned: false,
        dirty: false,
        saving: false
      }
      component.deleteRule(row)
      expect(toolService.deleteAgentMcpToolRule).not.toHaveBeenCalled()
    })

    it('does nothing when existingRule is undefined', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      const row = {
        name: 'test',
        allowed: ToolPermission.Deny,
        orphaned: false,
        dirty: false,
        saving: false
      }
      component.deleteRule(row)
      expect(toolService.deleteAgentMcpToolRule).not.toHaveBeenCalled()
    })

    it('calls deleteAgentMcpToolRule and refreshes on success', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.deleteAgentMcpToolRule.mockReturnValue(of(undefined) as any)
      toolService.getDiscoveredTools.mockReturnValue(of({ tools: [] }) as any)
      const row = {
        name: 'test',
        allowed: ToolPermission.Deny,
        existingRule: { id: 'rule-1' },
        orphaned: false,
        dirty: false,
        saving: false
      }

      component.deleteRule(row)

      expect(toolService.deleteAgentMcpToolRule).toHaveBeenCalledWith('agent-1', 'tool-1', 'rule-1')
      expect(row.saving).toBe(false)
    })

    it('sets saving to false on error', () => {
      component.agentId = 'agent-1'
      component.toolId = 'tool-1'
      toolService.deleteAgentMcpToolRule.mockReturnValue(throwError(() => new Error('fail')) as any)
      const row = {
        name: 'test',
        allowed: ToolPermission.Deny,
        existingRule: { id: 'rule-1' },
        orphaned: false,
        dirty: false,
        saving: false
      }

      component.deleteRule(row)

      expect(row.saving).toBe(false)
    })
  })

  describe('dangerSeverity', () => {
    it('returns success for Safe', () => {
      expect(component.dangerSeverity(DangerLevel.Safe)).toBe('success')
    })

    it('returns warn for Warning', () => {
      expect(component.dangerSeverity(DangerLevel.Warning)).toBe('warn')
    })

    it('returns danger for Dangerous', () => {
      expect(component.dangerSeverity(DangerLevel.Dangerous)).toBe('danger')
    })

    it('returns secondary for undefined', () => {
      expect(component.dangerSeverity(undefined)).toBe('secondary')
    })
  })

  describe('annotationBadges', () => {
    it('returns empty array for no annotations', () => {
      expect(
        component.annotationBadges({
          name: 'test',
          allowed: ToolPermission.Deny,
          orphaned: false,
          dirty: false,
          saving: false
        })
      ).toEqual([])
    })

    it('returns read-only badge', () => {
      expect(
        component.annotationBadges({
          name: 'test',
          allowed: ToolPermission.Deny,
          annotations: { readOnlyHint: true },
          orphaned: false,
          dirty: false,
          saving: false
        })
      ).toEqual(['TOOL_RULES.ANNOTATIONS.READ_ONLY'])
    })

    it('returns destructive badge', () => {
      expect(
        component.annotationBadges({
          name: 'test',
          allowed: ToolPermission.Deny,
          annotations: { destructiveHint: true },
          orphaned: false,
          dirty: false,
          saving: false
        })
      ).toEqual(['TOOL_RULES.ANNOTATIONS.DESTRUCTIVE'])
    })

    it('returns idempotent badge', () => {
      expect(
        component.annotationBadges({
          name: 'test',
          allowed: ToolPermission.Deny,
          annotations: { idempotentHint: true },
          orphaned: false,
          dirty: false,
          saving: false
        })
      ).toEqual(['TOOL_RULES.ANNOTATIONS.IDEMPOTENT'])
    })

    it('returns open-world badge', () => {
      expect(
        component.annotationBadges({
          name: 'test',
          allowed: ToolPermission.Deny,
          annotations: { openWorldHint: true },
          orphaned: false,
          dirty: false,
          saving: false
        })
      ).toEqual(['TOOL_RULES.ANNOTATIONS.OPEN_WORLD'])
    })

    it('returns all badges when all hints are true', () => {
      expect(
        component.annotationBadges({
          name: 'test',
          allowed: ToolPermission.Deny,
          annotations: { readOnlyHint: true, destructiveHint: true, idempotentHint: true, openWorldHint: true },
          orphaned: false,
          dirty: false,
          saving: false
        })
      ).toEqual([
        'TOOL_RULES.ANNOTATIONS.READ_ONLY',
        'TOOL_RULES.ANNOTATIONS.DESTRUCTIVE',
        'TOOL_RULES.ANNOTATIONS.IDEMPOTENT',
        'TOOL_RULES.ANNOTATIONS.OPEN_WORLD'
      ])
    })

    it('does not return badges for false hints', () => {
      expect(
        component.annotationBadges({
          name: 'test',
          allowed: ToolPermission.Deny,
          annotations: { readOnlyHint: false, destructiveHint: false },
          orphaned: false,
          dirty: false,
          saving: false
        })
      ).toEqual([])
    })
  })

  describe('permissionOptions', () => {
    it('has three options', () => {
      expect(component.permissionOptions).toHaveLength(3)
    })

    it('includes Allow, Deny, and AlwaysAsk', () => {
      const values = component.permissionOptions.map((o) => o.value)
      expect(values).toContain(ToolPermission.Allow)
      expect(values).toContain(ToolPermission.Deny)
      expect(values).toContain(ToolPermission.AlwaysAsk)
    })
  })
})
