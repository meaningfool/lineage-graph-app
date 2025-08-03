Next step : branch at afdfdb32a6dabe5273473d61a171cb3e08be7e45

# Learnings from Data Lineage App Development

## Claude Code Limitations & Patterns

### Complexity Management
- **Core Issue**: Claude Code struggles with refactoring and gets confused as complexity grows
- **Solution**: Divide and conquer - break down into smaller, manageable pieces
- **Challenge**: This conflicts with TDD's incremental approach where you don't plan too far ahead
- **Key Insight**: The bigger the scope you unleash Claude Code on, the more detailed specs it needs

### Refactoring Challenges
- Claude Code is not good at maintaining distinction between "what is" and "what should be"
- When refactoring is needed, you must be very precise about what needs to be done
- Sometimes starting from scratch is easier than heavy refactoring
- Claude Code doesn't automatically clean up:
  - Obsolete tests after refactoring
  - Unused code that becomes irrelevant
  - Lacks overall view of what needs updating

## Development Process Evolution

### Discovery → Specification → Implementation Flow
1. **"Vibe Coding" Phase**: 
   - Deliberately have exploratory coding time
   - Accept that legacy code will accumulate
   - Goal: See where things are going, highlight wants/don't wants
   - Build understanding progressively

2. **Specification Phase**:
   - Once understanding improves, have thoughtful conversations
   - Create more precise version of what you want
   - Don't go too far - reasonable scope

3. **TDD Implementation Phase**:
   - More structured TDD approach once direction is clearer
   - Accept that TDD might still lead to unexpected directions

### Key Process Insights
- **Retrospective Learning**: Going one test at a time without clarity is time-consuming
- **Hand-holding Required**: Claude Code is not autonomous in TDD - requires guidance
- **Two-stage Discovery**: Often architectural patterns (like two-stage validation) only become clear during implementation

## Testing Strategy Learnings

### Test Level Selection Challenges
- Choosing between unit, component, or E2E tests is challenging
- Need to balance test speed vs comprehensiveness
- ReactFlow required E2E testing due to mocking complexity

### Depth vs Breadth
- **Principle**: Go deep before going broad
- **Walking Skeleton**: TDD suggests having end-to-end working version early
- **Challenge**: If skeleton is too shallow, you might not come back to deepen it
- **Balance**: Need working end-to-end early, but then must go back and add depth

## Process Improvement Meta-Process

### Documentation & Knowledge Management
- Need to capture and evolve development process
- CLAUDE.md needs structuring and refactoring strategies
- Challenge: Capturing expectations and decisions that happen in conversation
- Missing: Systematic way to capture specs and plans

### Conversation Limitations
- Limited by conversation length - need to clear context regularly
- How to capture what was in conversation?
- In-session vs out-of-session work division
- Need better way to maintain continuity between sessions

### Review Process Improvements Needed
- E2E test review is manual and time-consuming
- Screenshots could enable lighter, more systematic review
- Need process for how much to plan vs discover

## Rule Following & Trust Issues

### Current State
- Claude Code is best at following rules compared to alternatives
- Still imperfect - might not always commit at right times in TDD
- Inconsistent in following CLAUDE.md rules when they get too complex

### Open Questions
- How to make rule following more trustworthy?
- Could sub-agents with specific rules be more disciplined?
- Would tools help enforce more specific behavior?
- How to handle when CLAUDE.md rules become too large?

## Future-Oriented Process Design

### Considerations
- Design process considering future LLM capabilities
- Balance current limitations with expected improvements
- Maintain flexibility for process evolution

### Backlog & Planning
- Need small backlog to avoid rethinking everything each time
- Challenge: Where to store plans? How to ensure updates?
- Risk: If storage gets too complex, it gets ignored

## Key Takeaways

1. **Claude Code is forgetful and imperfect** - design processes accordingly
2. **Explicit is better than implicit** - can't trust it to find indirect relationships
3. **Structure varies** - same request might get different structural approaches
4. **Process matters more than individual sessions** - invest in process improvement
5. **Vertical slicing over horizontal** - maintain working software at each step