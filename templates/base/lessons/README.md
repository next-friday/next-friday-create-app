# Lessons

After an incident, write a post-mortem in `lessons/<incident>.md`: what happened, the class of defect, the cause, and what changes so it does not happen again.

Before you diagnose a finding or look for a defect's cause, read `lessons/` for an earlier incident of the same class, and start from what it found.

The fix's failing test is the incident's regression case: name it in the post-mortem. A lesson that changes how an agent behaves also becomes an `AGENTS.md` correction under **Things Claude gets wrong** when it repeats a mistake.
