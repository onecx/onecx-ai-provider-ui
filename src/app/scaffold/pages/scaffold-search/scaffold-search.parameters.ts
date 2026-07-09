import { z } from 'zod'

export const scaffoldSearchCriteriasSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  name: z.string().optional(),
  systemPromt: z.string().optional(),
  sourceProduct: z.string().optional(),

  pageNumber: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional()
})

export type ScaffoldSearchCriteria = z.infer<typeof scaffoldSearchCriteriasSchema>
