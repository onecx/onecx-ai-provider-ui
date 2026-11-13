import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'

const script = fileURLToPath(new URL('./ai-review-dispatch.mjs', import.meta.url))

test('workflow gates trusted pull requests before Vault and checks out only the base', async () => {
  const workflow = await readFile(new URL('../workflows/ai-review.yml', import.meta.url), 'utf8')
  const gateIndex = workflow.indexOf('    if: >-')
  const vaultIndex = workflow.indexOf('      - name: Load dispatch token')

  assert.match(workflow, /pull_request_target:\n\s+types:\n\s+- opened\n\s+- synchronize\n\s+- ready_for_review/)
  assert.ok(gateIndex >= 0 && gateIndex < vaultIndex)
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/)
  assert.match(workflow, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/)
  assert.match(workflow, /github\.event\.pull_request\.author_association/)
  assert.match(workflow, /github\.event\.sender\.login == github\.actor/)
  assert.match(workflow, /github\.event\.sender\.type != 'Bot'/)
  assert.match(workflow, /!endsWith\(github\.actor, '\[bot\]'\)/)
  assert.match(workflow, /exportEnv: false/)
  assert.match(workflow, /secret\/data\/users\/\$\{\{ github\.actor \}\}\/tokens github_token_onecx/)
  assert.match(workflow, /GH_TOKEN: \$\{\{ steps\.vault\.outputs\.GH_TOKEN_ONECX \}\}/)
  assert.doesNotMatch(workflow, /github\.triggering_actor|pull_request\.head\.sha/)
})

async function fixture(
  t,
  {
    eventName = 'pull_request_target',
    action = 'opened',
    actor = 'maintainer',
    senderLogin = actor,
    association = 'MEMBER',
    draft = false,
    authorType = 'User',
    headRepository = 'example/consumer',
    target = 'private/destination',
    authenticatedUser = actor,
    guidance,
    guidanceError = false,
    ghMode = 'success'
  } = {}
) {
  const root = await mkdtemp(path.join(process.cwd(), '.review-dispatch-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const bin = path.join(root, 'bin')
  await mkdir(bin)
  const eventPath = path.join(root, 'event.json')
  const event = {
    action,
    sender: { login: senderLogin, type: actor.endsWith('[bot]') ? 'Bot' : 'User' },
    pull_request: {
      number: 42,
      html_url: 'https://github.com/example/consumer/pull/42',
      draft,
      user: { type: authorType },
      author_association: association,
      base: { repo: { full_name: 'example/consumer' }, sha: 'base-sha' },
      head: { repo: headRepository ? { full_name: headRepository } : null }
    }
  }
  await writeFile(eventPath, JSON.stringify(event))
  if (guidance !== undefined) {
    const checkout = path.join(root, 'checkout')
    await mkdir(path.join(checkout, '.github'), { recursive: true })
    if (guidanceError) {
      await mkdir(path.join(checkout, '.github', 'ai-review.md'))
    } else {
      await writeFile(path.join(checkout, '.github', 'ai-review.md'), guidance)
    }
  }
  const logPath = path.join(root, 'gh-args.jsonl')
  const gh = path.join(bin, 'gh')
  if (ghMode !== 'missing-gh') {
    await writeFile(
      gh,
      `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify(process.argv.slice(2)) + "\\n");
const args = process.argv.slice(2);
if (args[0] === "api") {
  if (process.env.FAKE_GH_MODE === "auth-failure") {
    process.stdout.write("raw auth stdout " + process.env.GH_TOKEN);
    process.stderr.write("raw auth stderr private/destination");
    process.exit(1);
  }
  process.stdout.write(process.env.FAKE_GH_USER + "\\n");
  process.stderr.write("private/destination auth diagnostic");
  process.exit(0);
}
if (process.env.FAKE_GH_MODE === "dispatch-failure") {
  process.stdout.write("raw dispatch stdout " + process.env.GH_TOKEN);
  process.stderr.write("raw dispatch stderr private/destination");
  process.exit(1);
}
process.stdout.write("raw success stdout " + process.env.GH_TOKEN + " private/destination");
process.stderr.write("raw success stderr private/destination");
`
    )
    await chmod(gh, 0o755)
  }
  const args =
    ghMode === 'throw-auth'
      ? [
          '--input-type=module',
          '-e',
          `import { dispatchReview } from ${JSON.stringify(pathToFileURL(script).href)};
const testEnvironment = { ...process.env, GH_TOKEN: 'bad\\u0000token' };
process.exitCode = await dispatchReview(testEnvironment);`
        ]
      : [script]
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: ghMode === 'missing-gh' ? bin : `${bin}${path.delimiter}${process.env.PATH}`,
      GITHUB_EVENT_NAME: eventName,
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_ACTOR: actor,
      GITHUB_REPOSITORY: 'example/consumer',
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_WORKSPACE: path.join(root, 'checkout'),
      AI_REVIEW_DISPATCH_REPOSITORY: target,
      GH_TOKEN: 'pat-secret-value',
      FAKE_GH_USER: authenticatedUser,
      FAKE_GH_MODE: ghMode,
      FAKE_GH_LOG: logPath
    }
  })
  let calls = []
  try {
    calls = (await readFile(logPath, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
  } catch {
    // A gate may reject the event before invoking gh.
  }
  return { result, calls, target }
}

function assertSanitized(output, target) {
  for (const secret of ['pat-secret-value', target, 'raw auth', 'raw dispatch', 'raw success', 'private/destination']) {
    assert.equal(output.includes(secret), false, `diagnostics exposed ${secret}`)
  }
}

test('dispatches the default review without guidance and suppresses gh output', async (t) => {
  const { result, calls, target } = await fixture(t)

  assert.equal(result.status, 0, result.stderr)
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[0], ['api', 'user', '--jq', '.login'])
  assert.deepEqual(calls[1], [
    'workflow',
    'run',
    'hybrid-agent-pipeline.yml',
    '--repo',
    target,
    '--ref',
    'main',
    '-f',
    'pr_url=https://github.com/example/consumer/pull/42',
    '-f',
    'profile=review-gh-pr',
    '-f',
    'workflow_config={"version":1}',
    '-f',
    'post_comments=true'
  ])
  assertSanitized(result.stdout + result.stderr, target)
})

test('dispatches multiline Unicode guidance at the 4000 UTF-16 code-unit boundary', async (t) => {
  const guidance = `${'😀'.repeat(1000)}\n${'界'.repeat(1999)}`
  assert.equal(guidance.length, 4000)
  const { result, calls } = await fixture(t, { guidance })

  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(calls[1].slice(-2), ['-f', `additional_context=${guidance.trim()}`])
})

test("rejects guidance that exceeds the workflow's JavaScript character limit", async (t) => {
  const { result, calls } = await fixture(t, { guidance: '😀'.repeat(2001) })

  assert.notEqual(result.status, 0)
  assert.deepEqual(calls, [])
  assert.match(result.stderr, /validation failed/i)
})

test('fails safely when trusted guidance cannot be read', async (t) => {
  const { result, calls } = await fixture(t, { guidance: '', guidanceError: true })

  assert.notEqual(result.status, 0)
  assert.deepEqual(calls, [])
  assert.match(result.stderr, /validation failed/i)
})

test('rejects a PAT whose authenticated actor differs from the original event actor', async (t) => {
  const { result, calls, target } = await fixture(t, { authenticatedUser: 'different-user' })

  assert.notEqual(result.status, 0)
  assert.equal(calls.length, 1)
  assert.match(result.stderr, /authentication failed/i)
  assert.equal(`${result.stdout}${result.stderr}`.includes('different-user'), false)
  assertSanitized(result.stdout + result.stderr, target)
})

test('fails safely when the dispatch destination is missing', async (t) => {
  const { result, calls } = await fixture(t, { target: '' })

  assert.notEqual(result.status, 0)
  assert.deepEqual(calls, [])
  assert.match(result.stderr, /validation failed/i)
})

test('rejects untrusted events, drafts, forks, and bot actors before gh', async (t) => {
  const cases = [
    { eventName: 'pull_request' },
    { action: 'closed' },
    { draft: true },
    { headRepository: 'contributor/fork' },
    { headRepository: null },
    { association: 'FIRST_TIME_CONTRIBUTOR' },
    { actor: 'automation[bot]' },
    { authorType: 'Bot' },
    { senderLogin: 'different-actor' }
  ]
  for (const options of cases) {
    await t.test(JSON.stringify(options), async (t) => {
      const { result, calls } = await fixture(t, options)
      assert.notEqual(result.status, 0)
      assert.deepEqual(calls, [])
      assert.match(result.stderr, /validation failed/i)
    })
  }
})

test('sanitizes authentication failures from gh', async (t) => {
  const { result, calls, target } = await fixture(t, { ghMode: 'auth-failure' })

  assert.notEqual(result.status, 0)
  assert.equal(calls.length, 1)
  assert.match(result.stderr, /authentication failed/i)
  assertSanitized(result.stdout + result.stderr, target)
})

test('handles a thrown gh spawn as a generic authentication failure', async (t) => {
  const { result, calls, target } = await fixture(t, { ghMode: 'throw-auth' })

  assert.equal(result.status, 1)
  assert.deepEqual(calls, [])
  assert.match(result.stderr, /authentication failed/i)
  assertSanitized(result.stdout + result.stderr, target)
})

test('handles a missing gh executable as a generic authentication failure', async (t) => {
  const { result, calls, target } = await fixture(t, { ghMode: 'missing-gh' })

  assert.equal(result.status, 1)
  assert.deepEqual(calls, [])
  assert.match(result.stderr, /authentication failed/i)
  assertSanitized(result.stdout + result.stderr, target)
})

test('sanitizes dispatch failures from gh', async (t) => {
  const { result, calls, target } = await fixture(t, { ghMode: 'dispatch-failure' })

  assert.notEqual(result.status, 0)
  assert.equal(calls.length, 2)
  assert.match(result.stderr, /dispatch failed/i)
  assertSanitized(result.stdout + result.stderr, target)
})
