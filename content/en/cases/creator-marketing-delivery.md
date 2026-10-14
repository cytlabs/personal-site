# Creator Marketing: Shared Criteria for Sourcing, Review and Shortlist Delivery

Project date: July 2026

Creator marketing usually starts with a client brief. Operations staff source creators, examine their profiles and content, then prepare a shortlist for the project manager. A client's description does not always translate directly into sourcing criteria, and platform labels alone are insufficient for judging business fit.

Without clarification, sourcing and review can use different criteria. Staff spend time preparing candidates only to discover a misunderstanding when the shortlist is reviewed. Feedback is scattered across conversations and shortlist versions, so the next round requires the requirements to be explained again.

I analyzed the workflow from requirements confirmation through sourcing, candidate review and shortlist feedback, and explored AI assistance for interpreting requirements and checking content. The central aim is for each role to work from confirmed criteria and for review results to inform the next search.

## Client confirmation starts the sourcing process

I made the handoff between client communication and operational work concrete through a creator sourcing guide. The project manager communicates with the client in the business group, while AI helps prepare a requirements document. After the manager checks it and the client confirms it, the guide goes to the project's operations staff.

```mermaid
flowchart TD
    A["Client brief and conversation"] --> B["Project manager clarifies requirements"]
    B --> C["AI organizes the requirements document"]
    C --> D["Project manager checks"]
    D --> E{"Client confirms"}
    E -->|Add or correct information| B
    E -->|Confirmed| F["Create the sourcing guide"]
    F --> G["Operations sources and submits creators"]
    G --> H["Agent assists review against the criteria"]
    H --> I{"Review outcome"}
    I -->|Fits| J["Update shortlist and add reasons"]
    I -->|Does not fit| K["Give specific reasons to operations"]
    I -->|Business judgment needed| L["Project manager decides"]
    K --> G
    L -->|More information| G
    L -->|Confirm inclusion| J
    J --> M["Business staff approve the client shortlist"]
    M --> N["Deliver shortlist and receive feedback"]
```

Confirmed requirements serve both sourcing and review. Operations knows what to submit, and reviewers have explicit criteria. The project manager handles ambiguous candidates and commercial judgments; business staff approve the shortlist sent to the client.

## Making rejection reasons useful to the next round

Accepted candidates retain their recommendation reasons. Rejected candidates also receive specific explanations. Operations can adjust the next submission, and the project manager can explain how the shortlist was selected.

I also organized the information needed for deduplication, previous assessments and feedback, linking the client, project, active brief, candidates, shortlist versions and responses.

```mermaid
flowchart TD
    A["Client feedback"] --> B["Link project, creator and shortlist version"]
    B --> C{"Does it change requirements"}
    C -->|No| D["Retain this creator's decision and reasons"]
    C -->|Yes| E["Manager and client confirm the change"]
    E --> F["Update the active sourcing guide"]
    D --> G["Next round of sourcing and review"]
    F --> G
    H["Existing candidates and review history"] --> G
```

Feedback returns to the object it concerns. Rejecting one creator is initially a decision about that candidate; the active criteria change only after a change in client requirements is confirmed. Operations and reviewers can therefore continue using the same requirements.

The delivered workflow connects client confirmation, operational sourcing and agent-assisted review, and defines the context retained with shortlists and feedback. Sourcing, review and shortlist revisions share a common basis, helping the project manager focus on clarification, business judgment and client delivery.

