Recently, while building an AI recruiting workspace, I kept returning to one question: if AI can already read and write code, run commands and execute tests, why do I still have to drive every step of a software project myself?

A common workflow goes like this: I ask Codex to implement a feature; it finishes and stops. I inspect the result, point out problems, and ask it to fix them. Then I decide what to build next.

AI does much of the coding, but the planning, scheduling, context transfer and quality control still sit with me. As the project grows, I become a project manager constantly assigning work to an assistant.

That is not quite the collaboration I want. I want to delegate a complete outcome and let AI keep making progress within agreed boundaries: plan, implement, test, fix and integrate. It should handle what it can, record decisions that truly need me, and deliver them together at the end.

This sounds like “let AI keep running,” but I have come to see that **continuous execution is not the same as autonomous delivery**.

## From one request to an executable engineering system

Suppose I simply tell an AI: “Build this recruiting system from the PRD, and handle any problems yourself.”

It might generate a great deal of code. But a PRD often explains what we want without fully specifying module boundaries, API contracts, exceptional cases and acceptance criteria.

When one model interprets requirements, makes architectural decisions, writes code and judges success, it can implement a system based on its own interpretation and then use that same interpretation to declare success.

So I separate the development foundation into four layers:

| Layer | Question it answers | Main contents |
| --- | --- | --- |
| PRD | Why are we building this, and what should it do? | User scenarios, goals, feature boundaries |
| Spec / Contract | How should the system behave? | Data models, interfaces, states, rules, failures |
| Task | What are we implementing in this run? | Goal, dependencies, scope, deliverables |
| Test | How do we know it works? | Unit, integration and end-to-end checks |

These documents live in Git, so every new coding session can retrieve the same project facts.

I also use Architecture Decision Records (ADRs) to explain choices we have already made. In our recruiting product, for example, LangGraph handles business AI workflows, Temporal manages long-running operational workflows, and browser automation is a replaceable way to access an external channel.

A new agent may suggest an improvement, but it should not silently overturn an approved architecture just because another implementation looks easier.

## Break down tasks, but not into a mere to-do list

Task decomposition is essential, but a checklist alone is not enough.

“Build the talent database” may sound like a task to a person, yet it is still ambiguous to a coding agent. Which fields are required? How does deduplication work? Is pagination needed? Can one candidate belong to several projects? Where do resumes come from? What are the retention and deletion rules?

I want tasks small enough to be **implemented and verified independently, with results that other tasks can reuse**.

For example, a task to implement candidate–project matching should specify its inputs, outputs, dependencies, out-of-scope changes and acceptance criteria. One candidate may match multiple projects, and each project's conclusion and evidence must be stored separately. An AI verdict of “suitable” needs traceable evidence rather than a similarity score alone.

Dependencies should be explicit. If the database contract has not been settled, several agents should not invent incompatible candidate schemas. But UI components, documentation and independent tests may be developed in parallel.

I organize work into **milestones → features → verifiable tasks**. That makes both the execution order and the definition of “done” clearer.

## One task, one fresh agent session

Keeping one AI conversation alive for an entire project may appear convenient, but it gradually mixes unrelated context.

A single session may move from database design to browser automation, UI layout and deployment troubleshooting. Old experiments, temporary assumptions and obsolete discussions then compete with the information needed for the current task.

I prefer a new coding session for each task.

Instead of inheriting the full conversation, each session reads:

- The project's goals and architectural constraints.
- The current task's specification, contracts and dependencies.
- The actual repository and Git history.
- Relevant tests and a concise handover from a previous failed attempt.

This does not mean pasting an entire PRD into every prompt. The better approach is a small task-specific context pack, with other information retrieved when needed.

**For software development, what matters is not remembering every conversation. It is being able to retrieve settled facts.**

## Let tests drive the next step, not the agent's own declaration

Reducing human intervention requires a better definition of completion.

Code being written does not mean a feature is finished. A page loading does not necessarily mean it works. And an agent saying “implemented” is not evidence.

Before closing a task, I want the relevant checks to run: type checking, linting, unit tests, API contract checks and, where appropriate, end-to-end tests. When an external integration is unavailable, an explicitly labeled offline test is still useful—but a passing mock test is not proof that the real channel works.

The basic loop is:

```text
Read task and relevant specifications
    ↓
Inspect existing code and dependencies
    ↓
Implement → run tests → fix
    ↓
Acceptance checks pass?
    ├─ Yes → record evidence, commit, take next task
    └─ No  → keep fixing, or record the blocker
```

Ideally, some verification comes from an independent test or review mechanism rather than the same agent grading its own work.

Tests also need to reproduce real failure modes. If a message-sending operation is retried after a network failure, the same candidate must not receive it twice. Checking whether the code contains a function named `retry` is not enough; the failure and recovery need to be exercised.

## A blocker should not stop the whole project

The last thing I want is for AI to stop the entire project at task three because a dependency cannot be installed, then wait for me to tell it what to do next.

A more useful system records task states such as `pending`, `running`, `completed` and `blocked`, along with the error, logs and verified results.

When one task is blocked, the controller looks for independent work. If live browser access to a recruiting platform is unavailable, it can still build project management, the talent database, matching rules and the UI.

Autonomy also does not mean unlimited authority. I distinguish ordinary coding and testing that can proceed independently, integrations that require later human acceptance, and higher-risk actions—sending real candidates messages, changing production credentials or performing destructive data operations—that require explicit approval in advance.

The more capable the agent, the more important it becomes to enforce boundaries through tools, file-system permissions and external-action controls, not just the words “please be careful.”

## The controller should keep running, not one endless conversation

My approach is not to open one Codex session and demand that it work for dozens of hours.

It is to build an external execution controller: select a task whose dependencies are complete, start a fresh Codex session, wait for its result, run acceptance checks, update task state and choose what to do next.

The task list, Git commits, test reports and execution logs are stored in the project directory. If the controller restarts, it can recover from those records rather than relying on one chat transcript.

It also needs stopping conditions: all work is complete, no independent task remains, an action requires human authorization, or a failure cannot be safely recovered.

That turns AI “autonomy” into an observable, pausable and recoverable engineering process—not just an ambitious prompt.

## The final deliverable should be a report, not a long chat log

When I check on a project, I do not want to read dozens of agent sessions first.

I want to know what I can actually use, which tests passed, which integrations were only simulated, what remains blocked and which decisions truly require me.

A proper handoff should include runnable code and a demo URL, test evidence, known issues, an organized human-review list, Git commits and deployment instructions.

I have recently begun putting this approach into practice for an AI recruiting workspace: a separate project directory, a dependency-aware task list, a fresh Codex session for each development task and a controller that records results and dispatches subsequent work. That experiment is still in progress. Sandbox permissions, environment dependencies and incomplete task coverage have already shown me why execution controls and acceptance checks are not optional.

None of this guarantees that AI will build every feature correctly on the first attempt. But it does distinguish three very different states: “the agent is working,” “the agent believes it is done,” and “the system has passed verification.”

## I want to stop being the manual scheduler

Previously, a person defined the goal, AI carried out the work, and the person still had to explain context, assign each next task, detect omissions and inspect results.

If goals, context, working methods, permissions and acceptance standards become part of a stable engineering system, the person no longer needs to act as its manual scheduler all day.

I still need to decide which problem a product should solve, which trade-offs are worth making, and whether to accept the final result. In between those decisions, much of the clear, repeatable and testable work should gradually be delegated to AI.

**I am not trying to create an agent that never stops. I am trying to build a development system that keeps delivering within constraints and can explain what went wrong.**
