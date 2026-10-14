While building a creator-marketing delivery agent, I encountered a small but representative exchange. The agent asked whether to continue the Huawei Mate 90 launch campaign; the user said yes. It then asked whether to create a project or continue an existing one and requested `customer_id` and `project_id`.

That was poor behavior. The user had already confirmed continuation, and the system had query tools, yet the agent repeated the question and pushed internal-ID lookup onto the user.

An immediate response might be adding “Do not ask for these IDs” to the prompt. But the deeper design question is:

> When a model can plan and act, how should we design its surrounding environment?

## Missing information does not automatically mean asking the user

Forms ask users to fill empty fields. An agent should do more than behave like a talking form. First classify missing information:

1. Already present in the conversation.
2. Stored in business context.
3. Available through read-only tools.
4. Reliably derivable from facts.
5. A business judgement only the user can make.

Try these sources in order. Ask only when the first four cannot resolve the issue or ambiguity needs human judgement.

Internal IDs are system state. Clear client names, project names or context should trigger lookup. Creator requirements, target markets and whether reach or conversion matters are business decisions that tools cannot make for clients.

The rule should be:

```text
When information is missing, identify its source first.
Resolve context and tool-accessible information independently.
Ask users for business decisions that cannot be obtained otherwise.
```

This distinguishes a capable agent from a form wearing a chat interface.

## Tools are hands and feet; the model is the brain

Detailed skills can prescribe every query, question and output. They work while users follow the expected sequence, but real users may start with a project, product, multiple requirements or simply “continue that one.” A rigid script can make the model ignore context to obey the process.

> Tools are the agent's hands and feet; the model is its brain; skills supply a capability map, business knowledge and boundaries.

Tools expose actions, skills explain the domain and the harness supplies observation, action and feedback. The model should choose calls and sequence from the goal.

Skills remain useful for defining the business problem, objects, completion standards, facts that cannot be invented, risky or costly operations and domain knowledge. They should not replace all planning with fixed conversational scripts.

## The real design object is the agent harness

A harness is not one prompt or tool. It is the runtime environment that turns model responses into sustained agent work.

| Capability | Purpose |
|---|---|
| Context assembly | Supply messages, client, project and relevant rules |
| Tool discovery | Expose readable and changeable business objects |
| Agent loop | Execute calls and return results for further reasoning |
| Sessions and state | Retain threads, context and intermediate outputs |
| Permissions and confirmation | Pause before writes, costs or risky actions |
| Sandbox | Restrict files, networks and systems technically |
| Error feedback | Distinguish retry, failure, partial success and human judgement |
| Tracing and evaluation | Assess tool choices and whether the goal was met |

```text
Goal -> observe context and capabilities -> plan the next action
-> call tool -> environment validates and executes -> real result
-> continue, finish or surface a blocker
```

The model chooses the next action; the harness makes real state, execution and constraints available.

## Why Codex resembles a general-purpose agent

Its versatility comes less from one enormous skill than from a complete harness: workspace context, terminal and file operations, Git, web and MCP tools, returned results, persistent `AGENTS.md` guidance, progressively loaded skills, plugins, sandbox limits, approval policies and verifiable test and command feedback.

```text
Codex = general model + agent harness + actionable environment + domain extensions
```

Skills are one extension layer. They should not carry all planning, state, permissions and orchestration. Putting everything into a skill simulates a harness with prompts: instructions grow, behavior stiffens and boundaries depend on the model remembering them.

## Tools should serve user goals rather than expose internal APIs directly

Raw endpoints such as `GET /projects`, `GET /projects/:id` and `POST /projects` require the model to understand implementation details.

Business-oriented tools are clearer:

```text
resolve_project
get_current_requirements
preview_customer_update
search_creators
record_creator_review
confirm_shortlist
```

`resolve_project` can take a name, brand or conversational clue and return one match, several business-readable choices, no match or a categorized query failure with retry information. Users need not supply internal IDs, and models need not construct database queries.

Tools should declare input and output structures, read/write behavior, external effects, costs, permissions, retry behavior and required confirmation.

Non-negotiable constraints belong in tools and services. Writes can default to previews; repeated requests need idempotency; paid queries require confirmation state; invalid state transitions are rejected; prohibited contact exports are never exposed.

Good design makes correct actions easy and incorrect actions impossible at the system boundary, rather than repeatedly asking models not to err.

## Must agent development use LangGraph?

No. LangGraph is a low-level orchestration runtime suited to persistent long-running work, checkpoints, fixed branches, human pauses, deterministic multi-agent handoffs and mixtures of agent and conventional workflow steps.

These solve orchestration complexity, not business judgement automatically.

A product that understands goals, queries projects, gathers business decisions, searches creators and waits for review may only need a general model, light harness, structured tools, thin skill and reliable API.

Premature orchestration can freeze unstable business processes into nodes and edges. Teams maintain graphs instead of improving tools, context and evaluation.

Consider workflow engines when tasks pause for hours or days, require approvals at fixed points, must recover at precise checkpoints, have complex parallel branches or compensation, or use stable specialist-agent handoffs.

Finding creators for a campaign rarely needs that machinery alone. Batch outreach after shortlist confirmation, waiting for replies, timeout retries, manual intervention and ongoing state updates may need it.

## An architecture for business agents

For creator-marketing delivery, I currently favor:

```text
Feishu / ChatGPT / Codex
        |
Lightweight harness
- identity and tenancy
- sessions and context
- model/tool loop
- cost and write confirmation
- logs, tracing and evaluation
        |
Business tools / MCP
- resolve_customer
- resolve_project
- get_current_requirements
- save_current_requirements
- search_creators
- add_candidates
- record_creator_review
- confirm_shortlist
        |
Yalaya API + NoxInfluencer
        |
Business database and external data
```

The model understands goals and combines actions. The harness owns context, looping, confirmation and execution state. Tools expose capabilities. APIs enforce truth, permissions, idempotency and state. Skills supply knowledge, outcomes and boundaries. Evaluations detect regressions in real conversations.

CLI remains useful for debugging, administration and early adapters. Production benefits from stable structured tools above CLI or APIs rather than unconstrained shell-command assembly.

## From designing a process to designing an environment

Traditional design specifies each click and page. With model planning, ask instead:

1. Which real states can the model observe?
2. Which clear, composable capabilities can it use?
3. Which information can it obtain, and which decisions belong to users?
4. Which boundaries does the system enforce?
5. Is feedback after actions clear enough?
6. Can failure be retried, recovered or escalated correctly?
7. How do real-scenario evaluations establish correctness?

> Rather than remotely controlling the model through longer prompts, provide clear capabilities, real state, complete feedback and reliable boundaries so it can plan.

AI is the brain, tools the hands and feet, the harness the nervous system and working space, and skills the domain knowledge and capability map. Clear responsibilities let an agent become a business collaborator rather than a scripted chatbot.

## References

- [OpenAI: Codex Best Practices](https://learn.chatgpt.com/guides/best-practices)
- [OpenAI: Define tools](https://developers.openai.com/plugins/plan/tools)
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)
- [OpenAI: Codex App Server](https://learn.chatgpt.com/docs/app-server)
- [OpenAI: Sandbox](https://learn.chatgpt.com/docs/sandboxing)
- [LangGraph Overview](https://langchain-ai.github.io/langgraph/index.html)
