import { ConfigurationSearchCriteria as _ConfigurationSearchCriteria } from 'src/app/shared/generated'
import { z, ZodTypeAny } from 'zod'

export const configurationSearchCriteriasSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
} satisfies Partial<Record<keyof _ConfigurationSearchCriteria, ZodTypeAny>>)

export type ConfigurationSearchCriteria = z.infer<typeof configurationSearchCriteriasSchema>
