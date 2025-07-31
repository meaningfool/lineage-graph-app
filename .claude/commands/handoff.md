---
description: "Generate comprehensive handoff summary for continuing work in new context"
allowed-tools: ["Read", "Bash", "Glob"]
---

# Session Handoff Summary

I'm ending this conversation and will continue in a new context. Please provide a comprehensive handoff summary for the next Claude session.

## Required Information

### 1. What We Accomplished
- Completed tasks and features implemented
- Changes made to codebase
- Issues resolved and decisions made

### 2. Where We Left Off
- Current development phase (TDD stage, iteration, etc.)
- Pending work and immediate next steps
- Status of any ongoing features

### 3. Critical Context
- Important user preferences established
- Workflow adaptations made during session  
- Key decisions that affect future work
- Special patterns or approaches adopted

### 4. Technical State
- Modified files and their current status
- Test suite status and coverage
- Any technical debt or issues discovered
- Dependencies or configuration changes

### 5. Next Session Guidance
- Files to check first for context restoration
- Commands to run for verification
- Priority tasks for immediate continuation
- Scratchpad.md status and feature planning

## Output Format
Structure the handoff as:

```
## Session Handoff Summary

### Completed Work
- [Specific accomplishments]

### Current Status  
- [Development phase and file states]

### Next Steps
- [Immediate priorities and continuation strategy]

### Critical Context
- [User preferences, workflow patterns, decisions]

### Files to Check First
- [Key files and documentation to review]

### Technical Notes
- [Test status, dependencies, special considerations]
```

Make this detailed enough that the next Claude can seamlessly continue our work without losing important context or requiring re-explanations of established patterns.