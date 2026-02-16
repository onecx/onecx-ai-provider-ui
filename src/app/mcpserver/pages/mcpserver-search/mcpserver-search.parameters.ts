import { MCPServerSearchCriteria as _MCPServerSearchCriteria} from 'src/app/shared/generated'
import { z, ZodTypeAny } from 'zod'

export const mcpserverSearchCriteriasSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),  
  // ACTION S2: Please define the members for your mcpserverSearchCriteriasSchema here
  // https://onecx.github.io/docs/nx-plugins/current/general/getting_started/search/configure-search-criteria.html#action-2
} satisfies Partial<Record<keyof _MCPServerSearchCriteria, ZodTypeAny>>)

export type MCPServerSearchCriteria = z.infer<typeof mcpserverSearchCriteriasSchema>
