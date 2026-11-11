# onecx-ai-provider-ui
OneCX AI Provider UI

## Automated pull request reviews

Eligible pull requests can request an asynchronous AI review. The workflow skips drafts, forks, and bot activity. Reviews are advisory and do not block merges.

To enable dispatch, configure the Actions secret `AI_REVIEW_DISPATCH_REPOSITORY` with the authorized review destination. The organization Vault JWT role must allow access to the existing `github_token_onecx` token at `secret/data/users/<actor>/tokens`. That actor's PAT must match the original event actor and have Actions write permission to dispatch the review workflow in the destination repository.

Optional trusted-base review guidance can be added in `.github/ai-review.md`. It supplements the standard review instructions and must remain within 4,000 UTF-16 code units. The workflow uses trusted base-branch code and does not check out or execute pull request code.
