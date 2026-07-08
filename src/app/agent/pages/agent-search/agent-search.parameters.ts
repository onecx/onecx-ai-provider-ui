import { z } from 'zod'

export const agentSearchCriteriasSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  name: z.string().optional(),
  modelId: z.string().optional(),
  scaffoldId: z.string().optional(),
  runtimeConfigId: z.string().optional(),
  additionalPrompt: z.string().optional(),
  a2aEnabled: z.coerce.boolean().optional(),
  version: z.coerce.number().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  pageNumber: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional()
})

export type AgentSearchCriteria = z.infer<typeof agentSearchCriteriasSchema>
