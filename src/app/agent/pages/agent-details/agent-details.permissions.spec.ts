import { readFileSync } from 'fs'
import { resolve } from 'path'

const projectRoot = resolve(__dirname, '../../../../..')

describe('publish configuration permission consistency', () => {
  const componentSource = readFileSync(resolve(__dirname, 'agent-details.component.ts'), 'utf8')
  const openApiSpec = readFileSync(resolve(projectRoot, 'src/assets/api/openapi-bff.yaml'), 'utf8')

  it('UI gates publish with AGENT#EDIT (BFF write)', () => {
    expect(componentSource).toContain("permission: 'AGENT#EDIT'")
    expect(componentSource).not.toContain("'AGENT#PUBLISH_CONFIGURATION'")
  })

  it('BFF OpenAPI requires write for the configuration version endpoints', () => {
    expect(openApiSpec).toMatch(/permissions:\s*\n\s*agents:\s*\n\s*- write/)
    expect(openApiSpec).not.toContain('publish-configuration')
  })
})
