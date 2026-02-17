# Git Workflow

Branch policy for this project:

- Push completed work to `main` in each affected repository.

When a child repository changes:

1. Commit and push the changed child repo to `origin/main`.
2. In the master repo, refresh submodule pointers:
   - `git submodule update --init --recursive --remote`
3. Commit and push updated submodule pointers from the master repo to `origin/main`.
