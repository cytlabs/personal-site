Recently, I connected OpenViking to Codex and imported my old flomo notes and ChatGPT conversations.

My expectation was straightforward: when working with AI on projects, articles and problems, it should be able to use our earlier discussions and the experience I have accumulated. I do not want to repeat the background every time, or maintain a complicated note system just to help AI understand me.

This experience helped me distinguish two uses of OpenViking: remembering everyday conversations and organizing historical material into a knowledge base. Confusing them makes it easy to overestimate what will happen automatically after setup.

**Everyday memory should require little intervention.**

In Codex, the OpenViking memory plugin can recall relevant historical information, capture conversations and submit them for background extraction of long-term memories. Users should rarely need to say “remember this” or decide which file a fact belongs in.

The connection, plugin and lifecycle hooks must actually be enabled. Being able to call a tool does not prove automatic recall and capture are running. After installation, verify whether new information is saved, whether it can be retrieved later and whether the recalled material is relevant to the current task.

Once that works, everyday use should become simpler. Discuss requirements and continue working. Correct information that is wrong, outdated or should not be retained.

Automatic memory does not mean verbatim recall, nor does it guarantee that every answer will use all historical information. The system selects what is worth retaining and recalls relevant material later. Users can spend less time managing files while still checking whether their meaning was understood.

**Bulk imports need a separate processing plan.**

I imported 1,003 flomo notes and 263 ChatGPT conversations. The assistant converted each note into a separate file, preserved its date and provenance, and submitted the collection to OpenViking.

This made individual notes easy to trace. However, many notes contained only a sentence or a link. Treating them as independent files created many small processing units. Background semantic summarization and indexing took several hours.

Initially, I wondered why processing was still running. The more useful question to ask beforehand was how I intended to use the collection.

Fine-grained sources are useful when looking for a particular conversation or original passage. But if I want AI to draw on years of notes to evaluate a product idea or formulate a working method, ingesting the originals is only part of the job.

OpenViking performs semantic processing, generates directory abstracts and overviews, and lets an agent load detailed content. These capabilities help locate and understand material, but do not by themselves establish that cross-source knowledge has been synthesized. The [official context-layer documentation](https://docs.openviking.ai/en/concepts/03-context-layers) explains the different roles of abstracts, overviews and details.

For example, ten notes might discuss learning goals, attention, practical output and reflection. Each can have an accurate summary. Turning them into a method for learning through real problems still requires comparison, integration, judgment and a statement of where the method applies.

A ChatGPT conversation also contains different kinds of evidence: the user's questions, the assistant's suggestions and decisions confirmed later. Sharing one transcript does not turn a suggestion into an action the user took.

**File size is a tradeoff; merging is not the goal.**

At one point, I described one file per note as excessively fragmented. That judgment also needed qualification.

Small files are not inherently bad for retrieval. A short, self-contained entry with a clear subject may be easy to find. OpenViking can directly match records at different context levels without requiring the user to browse every directory. The [official retrieval documentation](https://docs.openviking.ai/en/concepts/07-retrieval) describes this behavior.

The risks worth checking are missing context, repeated claims occupying several results, related information scattered across entries, and fragments that cannot support a complete understanding. File count alone cannot establish that these problems exist.

Conversely, putting a thousand notes into one large file does not automatically improve the knowledge base. Mixing unrelated material can obscure its subjects.

I now prefer a relatively complete idea or question as the organizing unit. Full articles and cases can remain independent. Related short notes can be grouped appropriately. Link-only bookmarks should clearly state their limits; their titles do not justify inventing the missing content.

Original archives can remain as backups. The knowledge used day to day does not need to mirror the export's file structure.

**Identify content that should not be sent for summarization.**

Further investigation exposed a more specific problem than file granularity. One historical conversation of roughly 2.2 MB contained about 1.43 million characters in long encoded strings, along with several `data:image/` embedded image payloads. Preprocessing had preserved them directly, and some encoded content was subsequently split into fragments and included in semantic summaries and the retrieval index.

The system processed the material, but some outputs merely described an uninterpretable sequence of characters. Those outputs used model calls and introduced retrieval noise. Successful task completion and acceptable content quality therefore require separate checks. This is one confirmed source of unnecessary work; it does not establish that the encoded payloads caused all the processing time.

A better approach is to identify valid embedded images, extract them as attachments and retain traceable references in the text. Payloads that cannot be decoded should keep their original evidence and an explicit explanation. A long string alone is not a sufficient reason to delete content, and normal prose, code and speaker attribution must be preserved.

Progress estimation also needed correction. Parsing long conversations creates additional nodes as processing continues, so the total queue size changes. I initially interpreted the current node ratio as evidence that the whole import was nearly finished. It was not a fixed completion percentage and could not reliably predict the remaining time.

When checked on October 27, 2026, both the flomo and ChatGPT import tasks had finished. Their processing queues were empty, with no failures reported. At that point, the encoded-content noise had not yet been cleaned up, and topic-based knowledge organization had not been run.

The remediation plan is to inventory the affected sources and derived nodes, create cleaned copies preserving the text, message relationships and attachment references, validate them in a controlled scope, and then replace the corresponding old content and index records. Adding a clean copy alone would leave the old noise searchable. Other successfully ingested material does not need a full reimport.

That remediation has since been completed: back up the original content and vectors, validate the cleaned copy in an isolated account, and replace the production content and old index records. All 379 message IDs in the affected conversation were preserved, eight complete image attachments were extracted, and no long encoded strings remained in the validated package. The original conversation uses full-text vector indexing; topic pages receive their own semantic summaries, reducing repeated summarization of historical code fragments.

The preprocessing entry point now checks for encoded payloads and unusual long strings, stopping the import for review when they appear. Another configuration issue was that model and embedding concurrency had both been explicitly set to two, rather than using the installed version's defaults. Both limits have been changed to four and verified. That does not establish that throughput has doubled.

**Official organization guidance still needs to be executed.**

OpenViking's official `llm-wiki` Skill provides rules for this work: identify entities, concepts and relationships, integrate evidence into durable knowledge pages, and maintain citations, disagreements and a navigation index.

One important rule is that a source does not automatically warrant its own knowledge page. Unless source-level summaries are explicitly requested, organize the knowledge itself rather than paraphrasing every input file.

The actual subjects should emerge from the evidence. When multiple sources address the same question, update the same canonical page. Split out independently useful subjects. Describe something as a method only when it contains prerequisites, steps and a verifiable outcome; scattered reflections should not be presented as established practice.

Installing the Skill makes those instructions available. It does not automatically start organizing all historical material when ingestion finishes. The task, trigger and update workflow still need to be arranged.

This was the central distinction in my experience: everyday conversational memory has a plugin mechanism, while organizing a bulk collection into connected knowledge requires a separate, explicitly executed workflow.

**Next time, I would validate a sample before processing everything.**

Starting again, I would select representative short notes, long documents and conversations, perform light preprocessing, and test them with real questions.

I would check more than whether a source can be found: does retrieval omit relevant material, does the answer distinguish historical views from current facts, are provenance and limitations preserved, and is processing cost reasonable? Where cross-source organization is needed, I would run Wiki compilation and compare the practical results before and after.

The model comparison also taught me that better evidence coverage on a small sample does not establish suitable throughput for bulk processing. Quality, long inputs, concurrency and throughput should be evaluated against the real workload.

The collection has now been ingested and indexed, and the identified source of encoded-content noise has been repaired. Following the official `llm-wiki` content rules, the assistant has organized two sample topics, problem-driven learning and demand and solution validation, and verified their retrieval with practical questions. These pages were authored by the assistant and saved in OpenViking. The native Compile runtime is not configured, so this is not automatic compilation of the full collection, nor do two sample pages mean all the material has been organized.

My desired workflow leaves routine maintenance to the assistant: capture new conversations, process material worth keeping and integrate relevant knowledge into existing pages. Users should focus on accurate understanding and useful results rather than continually rearranging folders.

I now evaluate OpenViking through two questions: can it accurately recall earlier discussions when needed, and can the material I have accumulated help complete the work in front of me? The first tests memory; the second tests knowledge organization.
