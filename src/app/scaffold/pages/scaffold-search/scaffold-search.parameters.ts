import { z } from 'zod'

export const scaffoldSearchCriteriasSchema = z.object({
  name: z.string().optional(),
  sourceProduct: z.string().optional(),
  pageNumber: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional()
})

export type ScaffoldSearchCriteria = z.infer<typeof scaffoldSearchCriteriasSchema>
