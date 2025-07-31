# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A data lineage visualization application built with Next.js, TypeScript, and tRPC. The app helps users understand how data flows through directed acyclic graphs (DAGs) from source data through computed values to final metrics.

## Architecture

### Monorepo Structure
- **Root**: pnpm workspace with shared configuration
- **apps/web**: Frontend Next.js app (port 3001) with React, ReactFlow, TailwindCSS
- **apps/server**: Backend tRPC API server (port 3000) with Drizzle ORM
- **packages/**: Shared utilities (when needed)

### Core Technologies
- **Frontend**: Next.js 15, React 19, ReactFlow for graph visualization, TailwindCSS + shadcn/ui
- **Backend**: tRPC for type-safe APIs, Drizzle ORM with SQLite/Turso
- **Graph Engine**: graphology library with dagre for layout algorithms
- **Testing**: Vitest with Testing Library for component testing
- **Code Quality**: Biome for linting/formatting, husky for git hooks

### Key Components
- **LineageGraph** (`apps/web/src/utils/lineagegraph.ts`): Core graph abstraction using graphology
- **Custom ReactFlow nodes** (`apps/web/src/components/lineage-graph.tsx`): Visualization components
- **Graph layout utilities** (`apps/web/src/utils/graph-layout.ts`): Dagre-based positioning

## Development Commands

### Essential Commands (from root)
```bash
pnpm dev                    # Start both web and server
pnpm dev:web               # Start web app only (port 3001)
pnpm dev:server           # Start server only (port 3000)
pnpm build                # Build all apps
pnpm check-types          # TypeScript validation
pnpm check                # Run Biome linting/formatting
```

### Database Commands
```bash
pnpm db:push              # Push schema changes
pnpm db:studio           # Open Drizzle Studio
pnpm db:generate         # Generate migrations
pnpm db:migrate          # Run migrations
```

### Testing Commands (from apps/web/)
```bash
pnpm test                 # Run tests in watch mode
pnpm test:run            # Run tests once
pnpm test:ui             # Open Vitest UI
pnpm test:coverage       # Run with coverage
```

### E2E Testing Commands (from root)
```bash
pnpm test:e2e --project=chromium [test-file]    # Standard E2E test command (ALWAYS use chromium)
pnpm test:e2e --project=chromium --headed       # Run with visible browser for debugging
```

### Strategic Test Execution
**Run targeted tests during development:**
- **Component changes**: Run tests for that specific component only
- **Feature work**: Run tests related to the feature being developed
- **Bug fixes**: Run tests that cover the bug area + regression tests

**Examples:**
```bash
# Working on node selection? Run only selection tests
pnpm test:e2e --project=chromium tests/e2e/node-selection-and-side-panel.spec.ts

# Working on graph layout? Run only layout-related tests  
pnpm test:e2e --project=chromium tests/e2e/graph-layout.spec.ts

# Working on multiple components? Run specific test pattern
pnpm test:e2e --project=chromium --grep "selection|layout"
```

**Run full test suite only when:**
- Preparing for commits/PRs
- After major refactoring
- Before releases
- Weekly/milestone checkpoints
- When unsure about cross-component impact

**Test Efficiency Rules:**
- **Never run all tests for minor changes** (CSS tweaks, text updates)
- **Always verify servers are running first** to avoid timeouts
- **Run related tests immediately** after implementation changes
- **Batch test runs** when working on multiple related features

## Development Rules

### TDD Workflow (MANDATORY)
This project follows strict TDD workflow from `.cursor/rules/001-tdd-workflow.md`:

1. **DESIGN**: Define signatures, outline tests, trim scope, get user approval
2. **RED**: Write failing tests, get approval to commit tests
3. **COMMIT TESTS**: Separate commit for tests only (use `test:` prefix)
4. **GREEN**: Implement minimal solution, get approval to commit
5. **COMMIT IMPLEMENTATION**: Separate commit for implementation (use `feat:` prefix)

**Enhanced Guidelines:**
- Always separate test commits from implementation commits for clear development history
- Focus on behavioral testing over implementation details
- When testing UI interactions, test minimal necessary proof (e.g., class presence, not specific values)
- Each RED-GREEN cycle should be committed separately
- Never proceed to next phase without explicit user permission
- **Wait for explicit approval before commits**: Always ask "commit?" and wait for user confirmation
- **Use correct commit types**: "feat:" for new features, "refactor:" for improvements to existing functionality, "test:" for test-only commits
- **Iterative test refinement**: In RED phase, be prepared to iterate on test design based on user feedback before moving to GREEN phase

**Refactoring Adaptation:**
- **Still follow RED-GREEN cycle**: Even when refactoring, update tests first to see them fail, then implement
- **RED phase for refactoring**: Update test expectations to match intended new behavior, verify tests fail
- **GREEN phase for refactoring**: Implement the refactoring to make the updated tests pass
- **Single refactoring commit**: After completing RED-GREEN cycle, commit both test and implementation changes together when they're tightly coupled
- **Criteria for combined commit**: When tests are verifying structure that's being intentionally modified (e.g., moving UI elements between components)
- **Verification**: Always ensure tests fail during RED phase to confirm they're actually testing the new behavior
- **Still get approval**: Always ask for user confirmation before refactoring commits

### Testing Approach

#### Testing Strategy Guidelines

This project uses a **Hybrid Testing Strategy** combining Unit and E2E tests:

**Unit Tests (Fast, Isolated)**
- Pure functions and utilities
- Simple component logic (no ReactFlow)
- State management and hooks
- Data transformation logic

**E2E Tests (Comprehensive, User-focused)**
- ReactFlow interactions and workflows
- Complete user journeys
- Visual behavior and integration
- Cross-component interactions

**Decision Framework**
- **Does it involve ReactFlow?** → E2E test
- **Is it a pure function?** → Unit test
- **Does it test user workflow?** → E2E test
- **Is it simple component logic?** → Unit test

#### Core Testing Principles
- **Use Testing Library queries exclusively**: `screen.getByTestId()`, `within().getAllByTestId()`
- **Never use `querySelector()`** or DOM traversal (JSDOM incompatible)
- **Test user-visible behavior and outcomes**, not internal mechanics or implementation details
- **Update existing tests** when user-facing behavior intentionally changes
- **Use specific test IDs** for predictable testing scenarios (e.g., `node-new-users`)
- **Minimal proof testing**: When testing CSS classes, verify presence (e.g., `transition-transform`) not specific values
- Use regex patterns for dynamic test IDs: `/^property-/`
- **Test naming convention**: Use `Test N: Descriptive Name` format for easy reference in discussions and debugging

#### Data-Driven Testing Strategy
- **Import source data directly**: `import targetLineageData from 'path/to/data.json'`
- **Use data properties dynamically**: `targetLineageData.nodes.length` instead of hardcoded counts
- **Read from actual data sources**: `targetLineageData.nodes.map(node => node.label)` for expected values
- **Avoid magic numbers**: Replace hardcoded values with data-derived values
- **Dynamic test generation**: Use available data to determine test scenarios (e.g., edge type options)

#### E2E Test Organization Patterns
- **Workflow-based grouping**: Organize tests by complete user journeys, not technical boundaries
- **Consolidate expensive operations**: Group tests that require similar setup (page loads, graph generation)
- **Meaningful test density**: Each test should validate multiple related behaviors
- **Library evolution safety**: Use flexible assertions (`.toBeGreaterThan(1)`) for evolving dependencies
- **Eliminate test duplication**: Remove comprehensive workflow tests that duplicate individual test functionality
- **Unique test value**: Ensure each test validates distinct behavior - avoid redundant coverage
- **Test suite refinement**: Regularly review test suites to remove duplicates and consolidate related functionality

**Test Evolution Strategy:**
- **Adapt existing tests** rather than only adding new ones when features change
- **Recognize when feature changes require test updates**, not just additions
- **When refactoring components**: Update test expectations to match new behavior
- **Mock maintenance awareness**: Question if mocks duplicate internal component logic
- **Test failure debugging**: When refactoring, verify tests actually test the new behavior (not cached old behavior in mocks)

### Feature Development Process
- **Plan complex features** in scratchpad.md with clear iterations before starting
- **Break features into small, independently testable increments**
- **Each iteration should deliver clear user value** and be fully tested
- Remove scratchpad.md after feature completion to keep repository clean
- Use iterative TDD approach: small cycles with frequent commits
- **UX refinement cycles**: After GREEN phase, expect additional refactoring requests for styling, spacing, and user experience improvements
- **Session continuity**: When continuing from previous conversations, read scratchpad.md and verify tests still pass before proceeding

### Test Suite Refactoring Methodology
When reorganizing or optimizing existing tests:

1. **Comprehensive Coverage Analysis**:
   - Review all existing test files systematically
   - Use Git history to identify any lost test functionality
   - Document current test coverage before making changes

2. **Strategic Planning**:
   - Plan reorganization strategy in scratchpad.md
   - Identify expensive operations that can be consolidated
   - Group tests by user workflows rather than technical boundaries

3. **Sequential File Review Process**:
   - Display complete test code for user review: "Here are all the tests from [file]"
   - Process user feedback systematically, point by point
   - Implement changes incrementally with immediate verification
   - Run tests after each significant modification

4. **Data-Driven Evolution**:
   - Convert hardcoded test values to data-driven approaches
   - Import source data directly into test files
   - Use dynamic assertions based on actual data properties

5. **Coverage Verification**:
   - Ensure no test functionality is lost during reorganization
   - Verify all browsers pass updated test suite
   - Document the reorganization benefits and test count changes

### Commit Strategy
- **Structure commits**: Infrastructure, refactoring, setup (commit separately)
- **Feature commits**: New functionality, bug fixes (commit after structure)
- **Test commits**: Always separate from implementation commits
- Follow Kent Beck's principle: "Make the change easy, then make the easy change"

#### Commit Message Best Practices
- **Use specific commit types**: `feat:`, `refactor:`, `test:`, `docs:`, `fix:`
- **Include quantified improvements**: "Reduce 9 tests to 6", "33% test reduction"
- **Document what was preserved**: "Maintain full functionality coverage"
- **Highlight benefits achieved**: "Enhanced assertions", "Data-driven approach"
- **Structure multi-section commits**: Use `## Section Headers` for complex changes

### Pre-Commit Verification (MANDATORY)
Before any commit, perform user acceptance testing using Playwright:
1. **Start the development server**: Run `./scripts/ensure-dev-running.sh` to automatically check and start servers
2. **Visual verification**: Use Playwright to navigate to http://localhost:3001 and capture screenshots
3. **Check for regressions**: Verify that:
   - The application loads without errors
   - Main components are visible and properly rendered
   - No console errors appear
   - Basic interactions work (navigation, clicking nodes, etc.)
4. **Document findings**: If any issues are found, fix them before committing
5. **Only proceed with commit** after successful user verification

This manual UAT step ensures code changes don't break the user experience and maintains application quality.

### Browser Testing Automation
When accessing localhost with Playwright:
1. **Always run first**: `./scripts/ensure-dev-running.sh`
2. This script will:
   - Check if servers are running
   - Start them if needed
   - Wait for them to be ready
   - Report the status
3. Only proceed with browser testing after the script confirms servers are ready

### Development Server Issue Handling
When tests fail with server connectivity issues (e.g., `net::ERR_ABORTED`, timeouts):

**NEVER:**
- Run `curl -I http://localhost:3001` and wait for 2-minute timeout
- Retry the same failing test command multiple times
- Let Playwright tests hang waiting for unresponsive servers

**CORRECT APPROACH:**
1. **Immediate server restart**: `pkill -f "next dev"; pnpm dev` (background process)
2. **Single browser testing**: Always use `--project=chromium` for consistency
3. **Standard test command**: `pnpm test:e2e --project=chromium [test-file]`
4. **Quick verification**: If servers don't start in 30 seconds, investigate port conflicts or process issues
5. **No timeout extensions**: Don't add `--timeout=60000` - fix the root cause instead

## Collaboration Patterns

### Effective Review and Approval Cycles
When working with complex changes or multiple files:

1. **Sequential File Review Pattern**:
   ```
   "Let's review X file" → Display complete code → User provides feedback → 
   Implement changes → Verify with tests → "Next file" → Repeat
   ```

2. **Complete Code Display**: Always show full test/code blocks for comprehensive user review
3. **Systematic Feedback Processing**: Address each user concern individually and methodically
4. **Immediate Verification**: Run tests after each significant change to ensure functionality
5. **Explicit Approval Seeking**: Always ask for permission before major changes or commits

### Communication Best Practices
- **Be specific about what you're showing**: "Here are all 6 tests from [filename]"
- **Process feedback point by point**: Address each concern individually
- **Confirm understanding**: Repeat back user requirements to ensure alignment
- **Show results immediately**: Run tests and display outcomes after changes
- **Ask for explicit next steps**: "Ready to move to next file?" or "Should we commit?"

### Session Continuity Patterns
- **Use scratchpad.md** for complex planning and cross-session handoffs
- **Document decisions and rationale** for future reference
- **Verify test status** before proceeding with previous work
- **Reference Git history** to understand previous implementations

## Code Conventions

### Graph Data Flow
- **Edge semantics**: A → B means "A is derived from B"
- **Node roles**: OUTPUT (metrics), STEP (transformations), INPUT (source data)
- **Validation**: All graphs must be acyclic (validated by graphology-dag)

### Component Patterns
- React components use modern patterns (hooks, functional components)
- tRPC procedures for type-safe API communication
- Zod schemas for runtime validation
- Custom ReactFlow nodes with handles and properties display

## Common Tasks

### Adding New Graph Features
1. Extend `LineageGraph` class in `apps/web/src/utils/lineagegraph.ts`
2. Add corresponding tests following TDD workflow
3. Update ReactFlow components if UI changes needed
4. Consider layout implications in `graph-layout.ts`

### API Development
1. Add tRPC procedures in `apps/server/src/routers/`
2. Update client-side queries in web app
3. Ensure type safety end-to-end

### Database Changes
1. Modify schema in `apps/server/src/db/`
2. Generate and run migrations
3. Update tRPC procedures as needed