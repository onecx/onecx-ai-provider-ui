import {
  Scaffold,
  ScaffoldPageResult,
  ScaffoldSourceEnum,
  Skill,
  SkillPageResult,
  SkillSourceEnum
} from '../shared/generated'

export const MOCK_SLILLS: Skill[] = [
  {
    id: '1',
    name: 'Skill 1',
    description: 'Description for Skill 1',
    instruction: 'Instructions for Skill 1',
    source: SkillSourceEnum.Global,
    modificationCount: 0
  },
  {
    id: '2',
    name: 'Skill 2',
    description: 'Description for Skill 2',
    instruction: 'Instructions for Skill 2',
    source: SkillSourceEnum.Tenant,
    modificationCount: 0
  },
  {
    id: '3',
    name: 'Skill 3',
    description: 'Description for Skill 3',
    instruction: 'Instructions for Skill 3',
    source: SkillSourceEnum.Global,
    modificationCount: 0
  }
]

export const MOCK_SCAFFOLDS: Scaffold[] = [
  {
    id: 'scaffold-1',
    name: 'Scaffold 1',
    systemPrompt: 'System prompt for Scaffold 1',
    sourceProduct: 'Product A',
    source: ScaffoldSourceEnum.Global,
    skills: [MOCK_SLILLS[0], MOCK_SLILLS[1]],
    modificationDate: '2024-06-01T12:00:00Z',
    modificationUser: 'User A',
    modificationCount: 0
  },
  {
    id: 'scaffold-2',
    name: 'Scaffold 2',
    systemPrompt: 'System prompt for Scaffold 2',
    sourceProduct: 'Product A',
    source: ScaffoldSourceEnum.Global,
    skills: [MOCK_SLILLS[2]],
    modificationDate: '2024-06-01T12:00:00Z',
    modificationUser: 'User A',
    modificationCount: 3
  },
  {
    id: 'scaffold-3',
    name: 'Scaffold 3',
    systemPrompt: 'System prompt for Scaffold 3',
    sourceProduct: 'Product A',
    source: ScaffoldSourceEnum.Global,
    skills: [MOCK_SLILLS[1]],
    modificationDate: '2024-06-01T12:00:00Z',
    modificationUser: 'User A',
    modificationCount: 0
  }
]


export function getMockScaffoldPageResult(): ScaffoldPageResult {
  return {
    stream: MOCK_SCAFFOLDS,
    size: MOCK_SCAFFOLDS.length,
    number: 0,
    totalElements: MOCK_SCAFFOLDS.length,
    totalPages: 1
  }
}

export function getMockScaffoldById(id: string | undefined): Scaffold {
  return MOCK_SCAFFOLDS.find((scaffold) => scaffold.id === id) ?? MOCK_SCAFFOLDS[0]
}

export function getMockSkillPageResult(): SkillPageResult {
  return {
    stream: MOCK_SLILLS,
    size: MOCK_SLILLS.length,
    number: 0,
    totalElements: MOCK_SLILLS.length,
    totalPages: 1
  }
}
