People writing their first AI skill often make a longer, more complete prompt. They put background, principles, steps, templates and examples into `SKILL.md` and expect stable agent behavior.

Initially that improves structure and reuse. Later the methodology grows, multiple tasks blur boundaries and complex requests make agents skip steps. The result knows a lot but behaves inconsistently.

I encountered this while designing FDE skills. I initially created `ai-transformation-precheck` for clients' pre-engagement diagnosis and `fde-customer-discovery` for interviews, pain analysis and MVP scoping.

The split by user seemed reasonable, but both asked about goals, workflows, pain and AI opportunities. Their users differed; their stages did not.

Revisiting Superpowers suggested a better principle: **split skills by work stage and failure mode, not user identity.**

Superpowers presents a software-development methodology built on composable skills, including `brainstorming`, `writing-plans`, `test-driven-development`, `systematic-debugging`, `requesting-code-review` and `verification-before-completion`. Each handles a stage and a typical mistake.

This article uses my FDE design process to explore maintainable, composable skills that constrain behavior.

## Skills constrain behavior rather than merely store knowledge

Putting interview methods, cases, pain criteria and MVP templates in one skill increases knowledge without ensuring correct action at critical points.

Common FDE failures include treating “we want an agent” as a real requirement, choosing tools before mapping work, asking only generic pain questions, assuming feasibility without checking data or permissions, proposing automation without review boundaries and scoping an MVP too large for one or two weeks.

These are process failures, not merely missing knowledge. Useful constraints are:

```text
Do not propose technology before reconstructing the workflow.
Do not recommend an MVP before checking inputs, outputs, data and human review.
A requested system name is not itself a need; investigate the business problem.
```

Superpowers skills similarly prevent coding before tests, random debugging and unverified completion claims. Their value lies in boundaries where agents are likely to take shortcuts.

## Split by stage rather than role

Client-side and FDE-side skills face the same chain:

```text
Intake -> interview -> workflow mapping -> pain analysis
-> AI opportunity assessment -> MVP scoping -> solution brief
```

A role-based split eventually duplicates the entire chain in different language. A stage-based split is clearer:

| Stage | Skill | Artifact |
|---|---|---|
| Intake | `fde-intake` | Pre-engagement communication pack |
| Interview | `fde-discovery-interview` | Objectives, questions and follow-ups |
| Workflow | `fde-workflow-mapping` | Roles, tools, steps, inputs, outputs and blockers |
| Pain | `fde-pain-analysis` | Requests, underlying pain and business impact |
| Opportunities | `fde-ai-opportunity-assessment` | Opportunity matrix and suitability |
| MVP | `fde-mvp-scoping` | Complete small workflow, boundaries and reviews |
| Brief | `fde-solution-brief` | Client-readable proposal |

Clients can use mapping; FDEs can use intake. Skills attach to stages and outputs, not identities. Similarly, `brainstorming` cares whether design is underway, and `writing-plans` cares whether a specification exists—not who the user is.

## Give each skill an explicit failure mode

Ask where an agent is likely to go wrong without the skill, not merely what help it provides.

Workflow mapping should prevent summarizing opinions instead of reconstructing steps, vague “low efficiency” pain statements, missing roles and inputs, mixing facts with assumptions and jumping to AI solutions.

```text
No workflow, no technical proposal.
Identify triggers, roles, tools, steps, inputs, outputs and blockers.
When information is missing, list gaps and follow-up questions; do not invent a process.
```

This is stronger than simply asking the agent to organize a workflow.

## Outputs should be artifacts the next stage can use

Generic analysis is hard to compose. A mapping artifact might be:

```text
Trigger -> roles -> current tools -> steps -> inputs -> outputs -> blockers
```

Pain analysis then asks which steps take time, create errors, depend on experience or affect outcomes, and whose work suffers most.

Opportunity assessment examines input clarity, output definition, data access, human review and controllable risk. Only then does MVP scoping define:

```text
Input -> AI/automation -> human review -> output -> business feedback
```

Every stage produces a handoff rather than another broad essay.

## Descriptions should state triggers, not summarize workflows

Superpowers' `writing-skills` emphasizes describing when a skill applies. A workflow summary in the description can tempt agents to believe they understand it without reading the body.

A broad description that says it handles interviews, mapping, pain, opportunities and MVPs combines too many stages. A better description is:

```yaml
description: Use when turning customer descriptions, notes, or interview records into a structured business workflow before pain analysis, AI opportunity assessment, or MVP scoping.
```

The description answers when to load the skill; the body explains what to do afterward.

## Keep the main skill small and methodology in references

As methods evolve, a layered structure helps:

```text
fde-workflow-mapping/
├── SKILL.md
└── references/
    ├── methodology.md
    ├── output-formats.md
    ├── examples.md
    └── eval-scenarios.md
```

The main file holds stable goals, triggers, exclusions, rules, process, outputs and quality checks. References hold changing methodology, templates, cases, counterexamples and evaluations.

Updating methods then usually changes references rather than rewriting behavioral control. The main skill controls behavior; references add knowledge.

## Maintain skills through evaluations, not impressions

Skills should be tested like code. Ask whether an agent still fails under realistic pressure, not only whether the instructions seem clear.

```markdown
## Eval: pressure for fully automated support

### Input
A client asks for AI to answer every customer question without people.

### Expected behavior
- Do not promise complete automation directly.
- Ask about question types, knowledge, historical tickets and escalation.
- Consider reply suggestions, classification or knowledge retrieval first.
- Specify questions requiring human review.
- Explain why full automation should not be the initial priority.
```

Another example:

```markdown
## Eval: a requested sales agent

### Input
A client wants an agent to chat, write proposals and close deals automatically.

### Expected behavior
- Do not treat the agent label as the requirement.
- Map leads, qualification, follow-up, proposals, quotes, contracts and handoffs.
- Identify suitable assistance and higher-risk actions.
- Consider summaries, client information and draft proposals before autonomous sales.
```

Run these again after changes. If the agent returns to promising automation directly, the skill has regressed.

## A focused FDE skill example

This simplified example shows a stage-based structure rather than a complete implementation:

````markdown
---
name: fde-workflow-mapping
description: Use when turning customer descriptions, notes, or interview records into a structured business workflow before pain analysis, AI opportunity assessment, or MVP scoping.
---

# FDE Workflow Mapping

## Objective
Reconstruct business workflows from scattered descriptions for pain analysis, AI assessment and MVP scoping.

## Use when
- Business descriptions, meeting notes, interviews or departmental scenarios are available.
- The user needs to understand how work currently runs.
- Further pain or automation analysis is planned.

## Do not use when
- No business context exists: use `fde-intake` first.
- Only interview preparation is needed: use `fde-discovery-interview`.
- A clear workflow already exists and AI suitability is the question: use `fde-ai-opportunity-assessment`.

## Rules
- Do not propose technology before mapping the workflow.
- Do not treat requested system names as needs.
- Identify triggers, roles, tools, steps, inputs, outputs and blockers.
- List information gaps and follow-ups instead of inventing facts.

## Process
1. Extract known facts.
2. Separate facts, assumptions, proposed solutions and gaps.
3. Reconstruct the current workflow.
4. Mark frequent, repetitive, slow, error-prone and experience-dependent steps.
5. List questions needing confirmation.

## Output
Trigger -> roles -> current tools -> steps -> inputs -> outputs -> blockers

## Checks
- Clear trigger?
- Roles identified?
- Current tools and data sources listed?
- Inputs and outputs defined?
- Blockers and gaps explicit?
- Premature technical proposals avoided?
````

This skill does one thing: reconstruct work from business descriptions. Its narrow scope supports reliability.

## Six questions for skill design

1. Which work stage does it address?
2. What mistake is most likely without it?
3. What are the inputs and output artifact?
4. When should it not be used?
5. Which steps require rules rather than suggestions?
6. Which evaluations detect regression?

I now see a skill as a reusable behavioral protocol, not a longer prompt. It helps agents act correctly more consistently on complex work.

For FDE, the sequence is understanding the business, mapping work, identifying pain, assessing AI, scoping an MVP and expressing the solution. The order itself is methodology.

## References

- Superpowers: https://github.com/obra/superpowers
- Superpowers skills: https://github.com/obra/superpowers/tree/main/skills
- Current FDE examples: `fde-intake`, `fde-discovery-interview`, `fde-workflow-mapping`, `fde-pain-analysis`, `fde-ai-opportunity-assessment`, `fde-mvp-scoping`, `fde-solution-brief`
