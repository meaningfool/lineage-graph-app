# Test-Driven Development (TDD) Workflow

## Core Principles

### Behavioral Testing Focus
- Tests describe **user behavior** and expected outcomes
- Tests serve as **living specifications** for the application
- Focus on **end-to-end** scenarios rather than unit-level details
- Tests confirm that features work as expected from user perspective

### Frugality Principle
- Only implement what is strictly necessary to make tests pass
- Avoid over-engineering and premature optimization
- Keep solutions simple and focused

### Red-Green-Refactor Cycle
1. **Red**: Write a failing test that describes desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code structure while keeping tests green

## Commit Strategy

### Structure vs. Feature Separation
Following Kent Beck's principle: **"Make the change easy, then make the easy change"**

#### Structure Commits
- Infrastructure changes
- Refactoring for better design
- Setup and configuration
- Code organization improvements

#### Feature Commits
- New functionality implementation
- Bug fixes
- Business logic changes

#### Workflow Rules
1. **Never bundle** structural changes with feature implementation
2. **Structure first**: When structure changes are needed, commit them separately
3. **Make change easy**: Refactor existing code to make new features easier
4. **Then make easy change**: Implement features after structure is optimized

## Development Process

### 1. Identify Next Iteration
- Determine the smallest, most valuable improvement
- Focus on one user behavior at a time
- Consider user value and technical dependencies

### 2. Write Tests First
- Describe expectations using tests
- Ensure tests fails initially (Red phase)
- Focus on **what** the user should see/experience, not **how** it's implemented

### 3. Implement Minimal Solution
- Write the simplest code to make test pass (Green phase)
- Avoid over-engineering
- Focus only on making the current test pass

### 4. Refactor (When Needed)
- Improve code structure while keeping tests green
- Separate structure commits from feature commits
- Maintain clean, readable code
