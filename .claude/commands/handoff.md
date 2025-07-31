---
description: "Generate compact handoff summary for continuing work in new context"
allowed-tools: ["Read", "Bash", "Glob"]
---

# Session Handoff Summary

I'm ending this conversation and will continue in a new context. Please provide a **compact** handoff summary (10-20 lines) for the next Claude session.

## Guidelines

**Minimize Context Transfer:**
- Focus on essential information only
- Reference relevant files for detailed plans rather than duplicating content
- If extensive detail is needed, sucha as for unfinished, in-progress work, add these details in relevant files and reference those files appropriately.
- If step is complete, just state completion and reference plan location

**Essential Information:**
- What was completed this session
- Current repository/feature status  
- Immediate next steps (reference files for details) if known
- Key files to check first

## Output Format

```
## Session Handoff Summary

### Completed Work
- ✅ [Brief accomplishment description]

### Current Status  
- [Repository state, test status]
- [Feature completion status]

### Next Steps
- [Reference to plan location, e.g., "See scratchpad.md section X"]
- [Only immediate priorities]

### Files to Check First
1. [Most important file with reason]
2. [Secondary file if needed]

**Verification**: [Quick command to run to verify state]
```

**Keep it concise** - use files like scratchpad.md and CLAUDE.md to store detailed context that can be referenced by the next session.