import { ScaffoldSearchCriteria as APIScaffoldSearchCriteria } from 'src/app/shared/generated'
import { z, ZodTypeAny } from 'zod'

export const scaffoldSearchCriteriasSchema = z.object({
  name: z.string().optional(),
  sourceProduct: z.string().optional()
} satisfies Partial<Record<keyof APIScaffoldSearchCriteria, ZodTypeAny>>)

export type ScaffoldSearchCriteria = z.infer<typeof scaffoldSearchCriteriasSchema>
