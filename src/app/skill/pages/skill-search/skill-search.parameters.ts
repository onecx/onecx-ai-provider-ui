import { SkillSearchCriteria as GeneratedSkillSearchCriteria } from 'src/app/shared/generated'
import { z, ZodTypeAny } from 'zod'

export const skillSearchCriteriasSchema = z.object({
  name: z.string().optional()
} satisfies Partial<Record<keyof GeneratedSkillSearchCriteria, ZodTypeAny>>)

export type SkillSearchCriteria = z.infer<typeof skillSearchCriteriasSchema>
