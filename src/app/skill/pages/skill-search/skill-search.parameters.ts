import { z, ZodTypeAny } from 'zod'
import { SkillSearchCriteria as GeneratedSkillSearchCriteria } from 'src/app/shared/generated'

export const skillSearchCriteriasSchema = z.object({
  name: z.string().optional()
} satisfies Partial<Record<keyof GeneratedSkillSearchCriteria, ZodTypeAny>>)

export type SkillSearchCriteria = z.infer<typeof skillSearchCriteriasSchema>
