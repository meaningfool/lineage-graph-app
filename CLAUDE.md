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

# DEVELOPMENT TIMEOUTS (use these during feature development):
pnpm test:e2e --project=chromium --timeout=10000 [test-file]  # 10-second timeout for dev work
pnpm test:e2e --project=chromium --headed --timeout=15000    # 15-second timeout for debugging
```

## Pre-Test Verification (MANDATORY)

Before running ANY E2E test, execute these smoke checks:

```bash
# 1. Check if servers are responding (5-second timeout)
curl -f --max-time 5 http://localhost:3001 > /dev/null || echo "❌ Web server not responding"
curl -f --max-time 5 http://localhost:3000/api/trpc || echo "❌ API server not responding"

# 2. If servers not responding, restart them
./scripts/ensure-dev-running.sh

# 3. Quick browser verification for UI changes
# Open http://localhost:3001 in browser and verify:
# - Page loads without console errors
# - Main graph is visible
# - Basic interactions work (click a node)
```

**RULE**: Never run E2E tests if smoke checks fail.

### Strategic Test Execution

**Pre-flight check before every test session:**
```bash
curl -f --max-time 5 http://localhost:3001 > /dev/null && echo "✅ Ready for testing"
```

**Run targeted tests during development:**
- **CSS/Styling changes**: Manual browser check FIRST, then targeted E2E
- **Component logic**: Unit tests + specific E2E test
- **New features**: Feature-specific test file only
- **Bug fixes**: Related test + regression test

**Examples:**
```bash
# Working on focus node styling? Check browser first, then:
pnpm test:e2e --project=chromium --timeout=10000 tests/e2e/view-lineage-button.spec.ts -g "Test 3"

# Working on selection logic? Run selection tests only:
pnpm test:e2e --project=chromium --timeout=10000 tests/e2e/node-selection-and-side-panel.spec.ts

# Multiple related features? Use pattern matching:
pnpm test:e2e --project=chromium --timeout=10000 --grep "lineage|selection"
```

**Run full test suite only when:**
- Preparing for commits/PRs
- After major refactoring
- Before releases
- Weekly/milestone checkpoints
- When unsure about cross-component impact

**Time-Boxing Rules:**
- **RED phase**: If test doesn't fail within 10 seconds, debug app directly
- **Development timeouts**: Always use `--timeout=10000` during feature work
- **Production timeouts**: Use default timeouts only for final verification

**Test Efficiency Rules:**
- **Never run all tests for minor changes** (CSS tweaks, text updates)
- **Always verify servers are running first** to avoid timeouts
- **Run related tests immediately** after implementation changes
- **Batch test runs** when working on multiple related features

## Test Failure Debugging Protocol

When ANY test fails with timeout or "element not found":

### STOP IMMEDIATELY - Do Not Continue Testing

```bash
# 1. Run failing test with visible browser (10-second timeout)
pnpm test:e2e --project=chromium --headed --timeout=10000 [failing-test]

# 2. If still timing out, check application directly
open http://localhost:3001  # Or visit in browser manually

# 3. Check server logs for errors
tail -n 50 /tmp/dev-server.log | grep -E "(Error|error|ERROR)"
```

### Root Cause Categories:
- **App broken**: Fix application first, then return to TDD
- **Server down**: Run `./scripts/ensure-dev-running.sh`
- **Test logic error**: Update test selectors/expectations
- **Infinite loops**: Check console, kill processes, restart servers

**NEVER** run multiple failing tests in sequence without debugging.

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

**Enhanced TDD Debugging Rules:**
- **RED phase timeout**: If test doesn't fail within 10 seconds, stop and debug application
- **Application verification**: Before writing tests, manually verify feature works in browser
- **Test verification**: Use `--headed --timeout=10000` for immediate visual feedback
- **Never batch debug**: Fix one failing test completely before running others

**Refactoring Adaptation:**
- **Still follow RED-GREEN cycle**: Even when refactoring, update tests first to see them fail, then implement
- **RED phase for refactoring**: Update test expectations to match intended new behavior, verify tests fail
- **GREEN phase for refactoring**: Implement the refactoring to make the updated tests pass
- **Single refactoring commit**: After completing RED-GREEN cycle, commit both test and implementation changes together when they're tightly coupled
- **Criteria for combined commit**: When tests are verifying structure that's being intentionally modified (e.g., moving UI elements between components)
- **Verification**: Always ensure tests fail during RED phase to confirm they're actually testing the new behavior
- **Still get approval**: Always ask for user confirmation before refactoring commits

#### Critical Phase Transition Rules (MANDATORY)

**Planning-to-Implementation Checkpoint:**
- **NEVER begin implementation** immediately after completing a plan
- **ALWAYS stop after planning** and explicitly ask: "May I proceed with implementation?"
- **Wait for explicit user approval** before starting any RED-GREEN-REFACTOR cycles
- **Planning completion ≠ implementation permission**

**Micro-Iteration Workflow:**
- **Commit after every phase**: RED → commit, GREEN → commit, REFACTOR → commit
- **Ask permission for major phases**: "Ready to start Phase 2?" not just individual steps
- **Scratchpad strategy**: Use separate `.md` files for complex refactoring plans
- **Working software guarantee**: Every micro-iteration must end with working application

**Approval Patterns:**
- **Explicit permission required for**: Starting implementation, beginning new phases, making commits
- **Implicit continuation allowed for**: Individual RED-GREEN-REFACTOR steps within approved phase
- **Always clarify scope**: "I'll complete Phase 1 (all micro-iterations 1.1-1.4)" vs. "I'll do just 1.1A"

**Session Continuity:**
- **Read scratchpad files** at session start to understand current state
- **Verify test status** before continuing previous work
- **Document phase completion** in scratchpad for handoffs

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

#### Advanced Testing Patterns

**Positive Behavior Testing (MANDATORY):**
- **Focus on what system should do**, not what it shouldn't do
- **Avoid "absence testing"**: Don't test that removed features are gone
- **Test user capabilities**: "User can select ID column" not "Auto-generation notice not shown"
- **Exception**: Critical business rules where "shouldn't" is the requirement

**Temporary Removal Tests (for refactoring only):**
- **Pattern**: Create → Verify → Delete after confirmation
- **Usage**: Only when removing features that could cause confusion
- **Process**: 
  1. Add temporary test checking removal
  2. Implement removal
  3. Run test to verify removal worked
  4. **Immediately delete test** after verification
- **Never keep**: These tests in permanent test suite

**Test Environment Setup:**
- **React Global Fix**: Add `global.React = React` in test-setup.ts for component testing
- **Accessibility Warnings**: Expected for Dialog components, safe to ignore in tests
- **Isolation**: Each test should work independently

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

#### Research-Plan-Implement Flow (MANDATORY)
When starting new features, always follow this sequence:

1. **RESEARCH PHASE**: Before any planning, research existing solutions
   - Use WebSearch to find current libraries, patterns, and best practices
   - Focus on actively maintained solutions (check recent updates, download stats)
   - Research UI/UX patterns for similar features
   - Identify technical constraints and integration points

2. **USER-CENTRIC PLANNING**: Plan iterations from user perspective
   - Define each iteration by "User sees" and "User can" statements
   - Ensure every iteration delivers visible user value
   - Keep detailed planning only for immediate next steps (first 3-4 iterations)
   - Document the plan in scratchpad.md as a living document

3. **ITERATIVE IMPLEMENTATION**: Build incrementally with TDD
   - Each iteration should be small enough to complete in one session
   - Always start with the simplest possible user interaction (e.g., just a button)
   - Build complexity gradually, maintaining working software at every step

#### Feature Planning Guidelines
- **Plan complex features** in scratchpad.md with clear iterations before starting
- **Break features into small, independently testable increments**
- **Each iteration should deliver clear user value** and be fully tested
- **User-centric iteration design**: Each phase explicitly states what the user sees and can do
- **Flexible planning depth**: Detailed RED/GREEN phases only for immediate next steps
- **Acknowledge discovery**: Plan structure should account for learning during implementation
- Remove scratchpad.md after feature completion to keep repository clean
- Use iterative TDD approach: small cycles with frequent commits
- **UX refinement cycles**: After GREEN phase, expect additional refactoring requests for styling, spacing, and user experience improvements
- **Session continuity**: When continuing from previous conversations, read scratchpad.md and verify tests still pass before proceeding

#### Iteration Structure Template
For each iteration, define:
```
### Phase N: [Feature Name]
**User sees**: [What's visible to the user]
**User can**: [What interactions are possible]
**Feedback**: [What responses/validation they get]
```

#### Research Documentation
When researching solutions, document:
- Library maintenance status (last updated, download stats)
- Integration compatibility with existing stack
- UI/UX patterns from established tools
- Alternative approaches and trade-offs

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

#### Enhanced Micro-Commit Workflow
- **Commit after every TDD phase**: RED → commit, GREEN → commit, REFACTOR → commit
- **Descriptive commit messages**: Include context, reasoning, and current state
- **Phase identification**: Clear RED/GREEN/REFACTOR labels in commit messages
- **Test status documentation**: Always mention if tests pass/fail and why

#### Commit Message Patterns
```bash
# RED Phase Example
"RED Phase 1.1A: Add failing tests for required Node ID column selector

- Added tests for Node ID column selector visibility with required indicator
- Added test for continue button disabled when Node ID not selected  
- Fixed React global setup in test-setup.ts for component testing
- Tests correctly fail as Node ID selector doesn't exist yet"

# GREEN Phase Example  
"GREEN Phase 1.1B: Add Node ID column selector to UI

- Updated ColumnMapping interface to include nodeId field
- Added Node ID dropdown with required indicator and aria-required attribute
- Updated validation logic to require Node ID selection
- Updated validation error message to include Node ID field
- All tests now passing for required Node ID column selector"
```

#### Commit Strategy Types
- **Structure commits**: Infrastructure, refactoring, setup (commit separately)
- **Feature commits**: New functionality, bug fixes (commit after structure)
- **Test commits**: Always separate from implementation commits when possible
- **Phase commits**: RED-GREEN-REFACTOR micro-commits for complex changes
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

### Development Server Management

**Server Persistence Issues:**
- Background processes started with `&` or `nohup` often get terminated between Claude interactions
- Each Bash command runs in a new shell session, losing process context
- System/IDE cleanup may kill orphaned Node processes

**RECOMMENDED APPROACH for Server Management:**

1. **For Development Work** (when user needs localhost access):
   ```bash
   # Use terminal multiplexer approach (more reliable)
   screen -dmS dev-servers bash -c 'pnpm dev'
   # Or use disown to detach from shell
   pnpm dev > /tmp/dev-server.log 2>&1 & disown
   ```

2. **For E2E Testing** (servers managed by test runner):
   - E2E tests don't require manual server management
   - Playwright runs in isolated browser contexts
   - Use `pnpm test:e2e --project=chromium [test-file]` directly

3. **Quick Server Health Check:**
   ```bash
   lsof -i :3001 | grep LISTEN && lsof -i :3000 | grep LISTEN && echo "✅ Both servers running"
   ```

### Server Health Monitoring
```bash
# Quick health check (add to workflow)
lsof -i :3001 | grep LISTEN && lsof -i :3000 | grep LISTEN && echo "✅ Both servers running"

# If servers unresponsive, force restart:
kill -9 $(lsof -t -i:3001) $(lsof -t -i:3000); sleep 2; pnpm dev > /tmp/dev-server.log 2>&1 & disown
```

**NEVER:**
- Assume servers persist between command invocations
- Run `curl` with long timeouts to check server status
- Start servers with simple `&` backgrounding for user access

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

#### Adaptive Planning Communication
**When user provides feedback on approach:**
- Acknowledge the specific issues raised
- Demonstrate understanding by refactoring the approach
- Show the revised plan that addresses their concerns
- Confirm the new direction before proceeding

**Research Presentation Pattern:**
- Present findings from web research first
- Explain why specific libraries/approaches were recommended
- Show trade-offs and alternatives considered
- Connect research findings to implementation choices

### Session Continuity Patterns
- **Use scratchpad.md** for complex planning and cross-session handoffs
- **Document decisions and rationale** for future reference
- **Verify test status** before proceeding with previous work
- **Reference Git history** to understand previous implementations

#### Scratchpad.md Usage Pattern
**When to create/update scratchpad.md:**
- Beginning any complex feature development
- When user requests refactoring of development approach
- For cross-session feature continuity
- When research findings need to inform planning

**Structure for effective scratchpad.md:**
- **High-Level Development Flow**: User-centric phase overview
- **Detailed Implementation Plan**: RED/GREEN phases for immediate next steps only
- **Technical Architecture Notes**: Library choices, integration points
- **Next Steps**: What comes after current detailed phases
- **Notes for Development**: Key constraints and patterns

**Living Document Approach:**
- Update scratchpad.md as discoveries are made during implementation
- Refactor planning based on user feedback
- Keep immediate steps detailed, future steps high-level
- Remove after feature completion to maintain clean repository

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