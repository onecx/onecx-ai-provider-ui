import { readFileSync } from 'fs'
import { resolve } from 'path'

const projectRoot = resolve(__dirname, '../../../../..')

describe('publish configuration permission consistency', () => {
  const componentSource = readFileSync(resolve(__dirname, 'agent-details.component.ts'), 'utf8')
  const openApiSpec = readFileSync(resolve(projectRoot, 'src/assets/api/openapi-bff.yaml'), 'utf8')

  it('UI checks AGENT#PUBLISH_CONFIGURATION', () => {
    expect(componentSource).toContain("permission: 'AGENT#PUBLISH_CONFIGURATION'")
  })

  it('BFF OpenAPI declares publish-configuration for the agents resource', () => {
    expect(openApiSpec).toMatch(/permissions:\s*\n\s*agents:\s*\n\s*- publish-configuration/)
  })
})
