import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const allowedActions = new Set(['opened', 'synchronize', 'ready_for_review'])
const allowedAssociations = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])
const maxGuidanceLength = 4000

function validationError() {
  throw new Error('validation')
}

async function loadRequest(env) {
  const required = [
    'GITHUB_EVENT_NAME',
    'GITHUB_EVENT_PATH',
    'GITHUB_ACTOR',
    'GITHUB_REPOSITORY',
    'GITHUB_WORKSPACE',
    'AI_REVIEW_DISPATCH_REPOSITORY',
    'GH_TOKEN'
  ]
  if (required.some((key) => !env[key])) validationError()

  const sourceRepository = env.GITHUB_REPOSITORY
  const targetRepository = env.AI_REVIEW_DISPATCH_REPOSITORY
  const actor = env.GITHUB_ACTOR
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(sourceRepository)) validationError()
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(targetRepository)) validationError()
  if (!/^[A-Za-z0-9-]+$/.test(actor) || actor.endsWith('[bot]')) validationError()

  if (env.GITHUB_EVENT_NAME !== 'pull_request_target') validationError()
  let event
  try {
    event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'))
  } catch {
    validationError()
  }
  const pullRequest = event?.pull_request
  if (
    !allowedActions.has(event?.action) ||
    event?.sender?.type === 'Bot' ||
    event?.sender?.login?.toLowerCase() !== actor.toLowerCase() ||
    pullRequest?.draft !== false ||
    pullRequest?.user?.type === 'Bot' ||
    !allowedAssociations.has(pullRequest?.author_association) ||
    pullRequest?.base?.repo?.full_name?.toLowerCase() !== sourceRepository.toLowerCase() ||
    pullRequest?.head?.repo?.full_name?.toLowerCase() !== sourceRepository.toLowerCase() ||
    !Number.isSafeInteger(pullRequest?.number) ||
    pullRequest.number < 1
  ) {
    validationError()
  }

  const pullRequestUrl = pullRequest.html_url
  const expectedPath = `/${sourceRepository}/pull/${pullRequest.number}`
  let parsedUrl
  try {
    parsedUrl = new URL(pullRequestUrl)
  } catch {
    validationError()
  }
  if (
    parsedUrl.origin !== 'https://github.com' ||
    parsedUrl.username !== '' ||
    parsedUrl.password !== '' ||
    parsedUrl.search !== '' ||
    parsedUrl.hash !== '' ||
    parsedUrl.pathname.toLowerCase() !== expectedPath.toLowerCase()
  ) {
    validationError()
  }

  let additionalContext
  const guidancePath = path.join(env.GITHUB_WORKSPACE, '.github', 'ai-review.md')
  try {
    additionalContext = (await readFile(guidancePath, 'utf8')).trim()
  } catch (error) {
    if (error?.code !== 'ENOENT') validationError()
  }
  if (additionalContext) {
    // Match the downstream JavaScript string.length limit (UTF-16 code units).
    if (additionalContext.length > maxGuidanceLength) validationError()
  } else {
    additionalContext = undefined
  }

  return {
    actor,
    targetRepository,
    pullRequestUrl: parsedUrl.href,
    additionalContext
  }
}

function runGh(args, env) {
  const ghEnv = { ...env }
  delete ghEnv.AI_REVIEW_DISPATCH_REPOSITORY
  return spawnSync('gh', args, {
    encoding: 'utf8',
    env: {
      ...ghEnv,
      GH_PROMPT_DISABLED: '1',
      GH_NO_UPDATE_NOTIFIER: '1'
    },
    maxBuffer: 1024 * 1024,
    windowsHide: true
  })
}

function failed(result) {
  return !result || Boolean(result.error) || result.status !== 0 || result.signal !== null
}

function safelyRunGh(args, env) {
  try {
    return runGh(args, env)
  } catch {
    return undefined
  }
}

export async function dispatchReview(env = process.env) {
  let request
  try {
    request = await loadRequest(env)
  } catch {
    process.stderr.write('Review dispatch validation failed.\n')
    return 1
  }

  const auth = safelyRunGh(['api', 'user', '--jq', '.login'], env)
  if (failed(auth)) {
    process.stderr.write('Review dispatch authentication failed.\n')
    return 1
  }
  const authenticatedActor = auth.stdout?.trim()
  if (
    !/^[A-Za-z0-9-]+$/.test(authenticatedActor ?? '') ||
    authenticatedActor.toLowerCase() !== request.actor.toLowerCase()
  ) {
    process.stderr.write('Review dispatch authentication failed.\n')
    return 1
  }

  const args = [
    'workflow',
    'run',
    'hybrid-agent-pipeline.yml',
    '--repo',
    request.targetRepository,
    '--ref',
    'main',
    '-f',
    `pr_url=${request.pullRequestUrl}`,
    '-f',
    'profile=review-gh-pr',
    '-f',
    'workflow_config={"version":1}',
    '-f',
    'post_comments=true'
  ]
  if (request.additionalContext !== undefined) {
    args.push('-f', `additional_context=${request.additionalContext}`)
  }

  const dispatched = safelyRunGh(args, env)
  if (failed(dispatched)) {
    process.stderr.write('Review dispatch failed.\n')
    return 1
  }
  process.stdout.write('Review dispatch requested.\n')
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  dispatchReview().then((status) => {
    process.exitCode = status
  })
}
