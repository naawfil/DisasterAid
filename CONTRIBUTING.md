# Working on DisasterAid

Five-ish people on one repo needs a little discipline. This is all of it.

## Branches

```
main       always deployable, only receives merges from develop
develop    integration branch, everyone branches from here
feature/*  one branch per feature, deleted after merge
fix/*      bug fixes
```

Branch names use the feature number from the backlog:

```
feature/01-aid-request-form
feature/05-shelter-occupancy
fix/12-dispatch-negative-stock
```

## Commits

`type(scope): summary` — types are `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

```
feat(auth): add role-based authorize middleware
fix(users): stop the last admin from being demoted
docs(readme): add local setup steps
```

Write the summary in the imperative: "add", not "added".

## Pull requests

1. Pull the latest `develop` and rebase your branch on it.
2. Push and open a PR into `develop`.
3. Title: `Part N — feature name`. Body: what changed, how to test it, screenshots for UI.
4. One teammate reviews. The author does not merge their own PR.
5. Squash-merge, then delete the branch.

## Splitting work without collisions

Each part has independent slices — take one slice each rather than one file each.
A slice is model + repository + service + controller + route + page for a single
feature, so two people rarely open the same file.

Shared files (`src/routes/index.js`, `src/constants/`, `app.css`) are the usual
conflict spots. Keep edits there small and merge them early.

## Definition of done

- [ ] Works against a fresh database
- [ ] Server-side validation on every input
- [ ] `authorize()` on every route that isn't meant to be public
- [ ] No secrets committed — `.env` stays local
- [ ] README or docs updated if the API changed
