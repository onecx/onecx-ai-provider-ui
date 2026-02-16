import { ProviderSearchCriteria as APIProviderSearchCriteria } from 'src/app/shared/generated'
import { z, ZodTypeAny } from 'zod'

export const ProviderSearchCriteriasSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  llmUrl: z.string().optional(),
  type: z.string().optional(),
  modelName: z.string().optional(),
  id: z.number().optional(),
} satisfies Partial<Record<keyof APIProviderSearchCriteria, ZodTypeAny>>)

export type ProviderSearchCriteria = z.infer<typeof ProviderSearchCriteriasSchema>