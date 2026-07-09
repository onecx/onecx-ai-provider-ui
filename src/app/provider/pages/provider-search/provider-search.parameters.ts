import { z } from 'zod'

export const ProviderSearchCriteriasSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  llmUrl: z.string().optional(),
  type: z.string().optional(),
  apiKey: z.string().optional(),
  authMode: z.string().optional(),
  pageNumber: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional()
})

export type ProviderSearchCriteria = z.infer<typeof ProviderSearchCriteriasSchema>