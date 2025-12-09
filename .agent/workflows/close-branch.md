---
description: Close the current feature branch, run regression tests, and merge to main.
---

1. **Prerequisites Check**
   - Ensure all changes are committed in the current branch.
   - Ensure you are in the root of the workspace.

2. **Regression Testing**
   - Run the full E2E test suite to ensure no regressions.
   ```bash
   npm run test:e2e
   ```
   - **CRITICAL**: If any test fails, STOP. Fix the regressions before proceeding.

3. **Prepare Merge Commit Message**
   - Locate the `learnings.md` file in the active feature folder (e.g., `specs/NN-feature/learnings.md`).
   - If it exists and has content, extract the bullet points.
   - Construct the merge commit message following this format:
     ```
     Merge branch 'feat/your-feature-name'

     LEARNINGS:
     * [Insight from learnings.md]
     * [Insight from learnings.md]
     ```
   - If `learnings.md` is empty or missing, just use the default merge message.

4. **Merge to Main**
   - Switch to the main branch.
   ```bash
   git checkout main
   ```
   - Merge the feature branch using `--no-ff` (Standard Merge).
   ```bash
   git merge --no-ff feat/your-feature-name
   ```
   - *Note*: If asked for a commit message, paste the message prepared in Step 3.

5. **Post-Merge Cleanup**
   - **DO NOT** delete the feature branch. Keep it for history as per policy.
   - You may clean up local artifacts if needed, but preserve the `specs/` folder in the repo.

6. **Notification**
   - Notify the user that the branch has been merged and regressions checked.
