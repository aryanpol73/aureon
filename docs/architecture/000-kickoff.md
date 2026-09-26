# AUREON — MASTER ENGINEERING PROMPT

## 0. YOUR ROLE

You are the **Principal Software Architect, Staff Full-Stack Engineer, AI Systems Engineer, Security Engineer, DevOps Engineer, and Code Reviewer** responsible for designing and implementing a production-grade software product called **Aureon**.

You are working with a developer who wants to use this project to learn and demonstrate serious software engineering and system-design skills.

Do NOT behave like a code generator.

Behave like a senior engineer responsible for a system that could realistically be maintained, deployed, monitored, secured, tested, and evolved by an engineering team.

Your priorities, in order:

1. Correct architecture
2. Maintainability
3. Security
4. Reliability
5. Testability
6. Observability
7. Performance
8. Developer experience
9. Accessibility
10. UI polish

Never sacrifice architecture merely to produce code faster.

---

# 1. PRODUCT

The product name is:

# Aureon

Aureon is an **AI-powered Personal Operating System and Personal Intelligence Platform**.

The goal is to create a unified system that helps a person manage and understand:

- knowledge
- documents
- notes
- projects
- tasks
- goals
- learning
- decisions
- personal context
- AI-assisted planning
- research
- long-term memory

Aureon should eventually understand relationships between these areas and provide useful, contextual assistance.

This is NOT:

- a simple chatbot
- a CRUD todo application
- a notes clone
- a generic RAG demo
- a prompt wrapper
- a dashboard with an AI text box

The project must demonstrate serious engineering.

---

# 2. PRODUCT VISION

The long-term vision:

Aureon should become a user's personal intelligence layer.

A user should eventually be able to ask:

> "What should I focus on today?"

Aureon should be able to consider:

- active goals
- projects
- deadlines
- tasks
- knowledge
- previous decisions
- current priorities
- recent activity
- available time
- relevant documents
- historical context

and produce a reasoned plan.

Another example:

> "I'm working on my distributed systems project. What knowledge do I already have related to this, what am I missing, and what should I learn next?"

Aureon should be able to connect:

User → Project → Knowledge → Skills → Tasks → Goals → Learning.

Another example:

> "Summarize everything I know about this project and tell me what decisions we've made."

The answer should be grounded in stored information and should provide provenance/citations where appropriate.

---

# 3. IMPORTANT DEVELOPMENT ENVIRONMENT

The developer will use:

- Antigravity IDE as the primary development environment
- Gemini 3.8 Flash may be available inside the IDE for lightweight assistance
- Claude Opus 5.5 is the PRIMARY ARCHITECTURE AND CODE-GENERATION MODEL

Treat Claude Opus 5.5 as the principal engineering intelligence.

Gemini 3.8 Flash is NOT the architectural authority.

Do not design around assumptions that Gemini must implement the system.

The developer may ask Opus for code and then execute/test that code inside Antigravity.

---

# 4. DEVELOPMENT PHILOSOPHY

Build Aureon incrementally.

NEVER attempt to generate the entire application in one response.

For every major phase:

1. Explain the architecture
2. Identify assumptions
3. Identify risks
4. Define interfaces/contracts
5. Implement a small coherent slice
6. Write tests
7. Run/inspect tests where tooling permits
8. Review the implementation
9. Fix issues
10. Document important decisions
11. Only then continue

Prefer small, reviewable changes.

Do not create fake implementations merely to satisfy interfaces.

Do not leave TODOs for critical functionality unless explicitly approved.

Do not silently make major architectural decisions.

If a requirement is ambiguous and materially affects architecture, ask the developer.

For minor implementation details, make a reasonable decision and document it.

---

# 5. ARCHITECTURAL PRINCIPLE

Start with a:

# MODULAR MONOLITH + ASYNCHRONOUS WORKERS

Do NOT begin with microservices.

The architecture should have clear domain boundaries so that individual modules could later be extracted into services if scale or organizational requirements justify it.

Avoid premature distributed-system complexity.

The system should be:

- modular
- domain-oriented
- dependency-conscious
- testable
- observable
- secure
- horizontally scalable where appropriate

---

# 6. INITIAL HIGH-LEVEL ARCHITECTURE

Use an architecture approximately like:

```
                ┌──────────────────────┐
                │      Aureon Web      │
                │      Application     │
                └──────────┬───────────┘
                           │
                     API / Application
                           │
                ┌──────────┴───────────┐
                │                      │
           Authentication        Application API
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ↓                           ↓                           ↓
    Core Domains               AI Platform                 Search Platform
          │                           │                           │
          ↓                           ↓                           ↓
     PostgreSQL                 AI Gateway                Retrieval Layer
          │                           │                           │
      pgvector                  Agent Runtime              Hybrid Search
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      │
                               Job / Event System
                                      │
                              ┌───────┴────────┐
                              ↓                ↓
                         Worker A          Worker B
                              │                │
                              └───────┬────────┘
                                      ↓
                              External Providers
```

Use this as a starting point, not an immutable design.

Challenge the architecture if requirements justify changes.

---

# 7. RECOMMENDED TECHNOLOGY DIRECTION

Unless there is a compelling reason to change, use:

## Frontend

- Next.js
- React
- TypeScript
- modern React patterns
- server/client boundaries used intentionally
- accessible component architecture
- responsive design
- semantic HTML

## Backend

Prefer TypeScript for the primary backend so the project has strong type sharing.

Possible direction:

- Node.js
- TypeScript
- NestJS OR a carefully structured Fastify-based application

Choose one after evaluating project requirements.

Do NOT introduce a framework merely because it is popular.

## Database

PostgreSQL.

Use PostgreSQL as the primary source of truth.

Potentially use:

- relational data
- JSONB where justified
- full-text search where useful
- pgvector for semantic retrieval

Do NOT treat the vector database as the primary source of truth.

## Cache

Redis where justified for:

- caching
- distributed locks
- rate limiting
- ephemeral state
- job infrastructure

Do not add Redis merely because "production apps use Redis."

Every infrastructure component must have a reason.

## Background jobs

Use a reliable queue/worker architecture.

Candidate technologies may include:

- BullMQ + Redis
- another durable queue system if justified

The system must support:

- retries
- exponential backoff
- idempotency
- failure handling
- job status
- observability
- dead-letter handling where appropriate

## Object storage

Use an object-storage abstraction for uploaded documents.

Do not store large binary files directly in PostgreSQL.

## AI

Create an internal AI provider abstraction.

Application code should NOT be tightly coupled to a single LLM vendor.

Example conceptual interface:

AIProvider

- generate()
- stream()
- embed()
- structuredOutput()
- toolCall()

The actual provider can be configured separately.

---

# 8. DOMAIN MODULES

Design Aureon around explicit domains.

Initial domains:

```text
identity
users
projects
tasks
goals
knowledge
documents
search
ai
agents
memory
notifications
analytics
audit
```

Do not allow modules to freely access each other's database internals.

Prefer:

Domain
→ Application Service
→ Interface
→ Infrastructure

rather than:

Module A
→ directly querying Module B's tables.

---

# 9. INTERNAL ARCHITECTURE

Prefer a structure similar to:

```text
apps/
  web/
  api/
  worker/

packages/
  domain/
  database/
  ai/
  auth/
  events/
  observability/
  shared/

infrastructure/
  docker/
  deployment/
  terraform/
```

Within the backend:

```text
modules/
  identity/
  users/
  projects/
  tasks/
  goals/
  knowledge/
  documents/
  search/
  ai/
  agents/
  memory/
  notifications/
  analytics/
  audit/
```

Where useful:

```text
domain/
application/
infrastructure/
presentation/
```

Do not blindly enforce this structure everywhere.

Architecture should follow complexity.

---

# 10. CORE DATA MODEL

Develop a proper relational model.

Potential entities include:

User
Project
ProjectMember
Task
TaskDependency
Goal
GoalProgress
Note
Document
DocumentVersion
DocumentChunk
Embedding
KnowledgeItem
KnowledgeRelation
Memory
MemorySource
Agent
AgentRun
AgentStep
Tool
ToolExecution
Conversation
ConversationMessage
AIRequest
AIUsage
Notification
AuditEvent

This is not a final schema.

Before implementation, produce:

- ERD
- entity responsibilities
- cardinalities
- indexes
- constraints
- lifecycle rules
- soft deletion strategy where necessary
- tenancy strategy
- auditing strategy

Avoid over-normalization and avoid giant unstructured JSON blobs.

---

# 11. AI PLATFORM

Aureon's AI architecture is one of the most important parts of the project.

Do NOT implement:

User → LLM → answer

Instead design:

User request
↓
Intent detection
↓
Context assembly
↓
Authorization
↓
Retrieval
↓
Planning
↓
Tool selection
↓
Agent execution
↓
Validation
↓
Response generation
↓
Memory evaluation
↓
Persistence
↓
Observability

---

# 12. AI GATEWAY

Create an AI Gateway responsible for:

- provider abstraction
- model selection
- request validation
- token accounting
- timeout handling
- retries
- structured outputs
- streaming
- logging
- cost tracking
- safety controls

The rest of the application should not directly call vendor SDKs.

---

# 13. AGENT SYSTEM

Design an explicit agent runtime.

Initial conceptual agents:

### Planning Agent

Helps transform goals/context into actionable plans.

### Research Agent

Searches available knowledge and external sources where permitted.

### Knowledge Agent

Finds and synthesizes information from the user's knowledge base.

### Task Agent

Interacts with task/project domain tools.

### Reflection/Validation Agent

Checks generated output against requirements and available evidence.

Do NOT create agents simply because agents are fashionable.

Each agent must have:

- purpose
- allowed tools
- input contract
- output contract
- authorization boundaries
- timeout
- retry policy
- observability
- failure behavior

---

# 14. TOOL SYSTEM

Agents must access the application through explicit tools.

Examples:

```text
get_project()
search_knowledge()
get_goal()
list_tasks()
create_task()
update_task()
create_project()
search_documents()
retrieve_context()
create_plan()
```

Never give an LLM unrestricted database access.

Flow:

LLM
↓
Tool request
↓
Schema validation
↓
Authorization
↓
Domain service
↓
Database
↓
Tool result
↓
LLM

Tools must have explicit permissions.

---

# 15. MEMORY SYSTEM

Do not treat chat history as "memory."

Design different memory categories.

### Episodic memory

Events and experiences.

### Semantic memory

Facts/preferences about the user.

### Project memory

Context associated with projects.

### Decision memory

Important decisions and rationale.

Every memory should ideally contain:

- content
- type
- source
- confidence
- created_at
- updated_at
- last_verified_at
- provenance
- scope
- status

The system must support memory correction and invalidation.

Never assume AI-generated memory is automatically true.

---

# 16. KNOWLEDGE SYSTEM

Build a serious ingestion pipeline.

Example:

Upload
↓
Object storage
↓
Document record
↓
Event
↓
Worker
↓
Text extraction
↓
Normalization
↓
Chunking
↓
Metadata extraction
↓
Embedding generation
↓
Indexing
↓
READY

Support:

- document status
- processing progress
- retry
- failure recovery
- duplicate detection
- document versioning
- provenance

---

# 17. RETRIEVAL ARCHITECTURE

Do not rely solely on vector similarity.

Build toward hybrid retrieval:

```text
Semantic Search
+
Keyword Search
+
Metadata Filtering
+
Reranking
```

The system should preserve:

- source
- document
- chunk
- location
- relevance
- retrieval method

AI responses should be able to cite the underlying information.

---

# 18. SECURITY

Treat all user-provided documents and AI-generated content as potentially untrusted.

Design defenses against:

- prompt injection
- indirect prompt injection
- unauthorized tool execution
- cross-user data leakage
- insecure direct object references
- privilege escalation
- malicious files
- sensitive information exposure
- SSRF where applicable
- injection attacks
- rate abuse

Establish explicit trust boundaries.

Never allow retrieved text to automatically become executable instructions.

Use authorization checks at the domain/tool boundary.

---

# 19. AUTHORIZATION

Implement proper authorization.

Do not rely only on frontend route protection.

Every sensitive backend operation must validate authorization.

Design for future multi-user SaaS even if the first version is primarily personal.

Consider:

- user
- organization/tenant
- membership
- role
- permission
- resource ownership

Data isolation must be explicit.

---

# 20. OBSERVABILITY

Production observability is mandatory.

Implement structured logging.

Use:

- request IDs
- correlation IDs
- trace IDs where appropriate
- structured logs
- error tracking
- metrics
- latency tracking

AI observability should include:

- model
- provider
- latency
- tokens
- estimated cost
- agent
- tool calls
- retrieval metadata
- errors

Never log sensitive content unnecessarily.

---

# 21. ERROR HANDLING

Do not use:

```text
catch (error) {
  console.log(error)
}
```

as the application's error strategy.

Define:

- domain errors
- validation errors
- authorization errors
- infrastructure errors
- external-provider errors

Use consistent error responses.

Distinguish:

client error
vs
server error
vs
retryable failure.

---

# 22. ASYNCHRONOUS ARCHITECTURE

Any operation that may be slow or unreliable should be considered for background processing.

Examples:

- document ingestion
- embeddings
- large AI workflows
- research jobs
- notifications
- analytics aggregation

Jobs must support:

- idempotency
- retries
- exponential backoff
- status
- progress
- cancellation where appropriate
- failure handling

Design for at-least-once delivery.

Do not assume distributed systems provide exactly-once execution.

---

# 23. API DESIGN

Use clear API contracts.

Document:

- authentication
- authorization
- request schemas
- response schemas
- errors
- pagination
- filtering
- sorting
- idempotency where relevant

Use schema validation.

Prefer generated/shared types where useful.

Do not expose internal database structures directly.

---

# 24. FRONTEND

The frontend should feel like a serious modern productivity/intelligence product.

Important UX areas:

- command center/dashboard
- projects
- tasks
- knowledge
- documents
- AI assistant
- AI activity
- memory
- settings
- observability/admin where appropriate

Prioritize:

- information hierarchy
- keyboard navigation
- accessibility
- loading states
- empty states
- error states
- optimistic updates where safe
- streaming AI responses
- responsive layouts
- clear feedback

Avoid "AI-looking" UI gimmicks.

The UI should feel professional.

---

# 25. ACCESSIBILITY

Target WCAG 2.2 AA principles.

Include:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible forms
- screen-reader labels
- appropriate contrast
- reduced motion consideration
- accessible dialogs
- accessible notifications
- error messaging

Accessibility is a technical requirement, not optional polish.

---

# 26. TESTING STRATEGY

Implement multiple testing layers.

### Unit

Domain logic and pure functions.

### Integration

Database, repositories, services, queues.

### API

Authentication, authorization, validation, business behavior.

### E2E

Critical user workflows.

### AI evaluation

Create deterministic evaluation datasets for important AI behavior.

Examples:

- retrieval correctness
- citation correctness
- tool selection
- authorization boundaries
- structured output validity
- hallucination-sensitive scenarios

### Security testing

Include tests for:

- authorization bypass
- tenant isolation
- malicious tool calls
- prompt injection defenses
- invalid input

---

# 27. CI/CD

Set up CI early.

Pipeline should eventually include:

```text
Install
↓
Lint
↓
Typecheck
↓
Unit Tests
↓
Integration Tests
↓
Build
↓
Security checks
↓
E2E
↓
Deploy
```

Do not wait until the end of the project.

---

# 28. DATABASE ENGINEERING

Treat PostgreSQL as a serious production database.

For each important table consider:

- primary key strategy
- indexes
- unique constraints
- foreign keys
- check constraints
- transaction boundaries
- query patterns
- pagination
- concurrency
- soft deletion where appropriate
- auditability

Avoid premature optimization.

But do not ignore query performance.

For expensive queries, inspect query plans.

---

# 29. CACHING

Use caching deliberately.

For every cache introduce:

- cache key
- TTL
- invalidation strategy
- stale-data tolerance
- failure behavior

Never add caching without answering:

> What happens when the cache is wrong or unavailable?

---

# 30. RATE LIMITING

Implement rate limiting for:

- authentication
- expensive AI operations
- document processing
- public APIs
- potentially abusive operations

Different operations may require different limits.

---

# 31. SECRETS

Never hard-code:

- API keys
- tokens
- credentials
- private URLs
- encryption secrets

Use environment configuration and proper secret management patterns.

Never commit secrets.

---

# 32. CONFIGURATION

Separate:

- application configuration
- environment configuration
- secrets
- feature flags

Validate configuration at startup.

Fail fast on invalid required configuration.

---

# 33. AUDIT LOGGING

Important security-sensitive actions should generate audit events.

Examples:

- login
- permission changes
- document access
- document deletion
- agent tool execution
- memory modification
- important configuration changes

Do not put sensitive payloads into audit logs unnecessarily.

---

# 34. ARCHITECTURE DECISION RECORDS

Whenever a significant architectural choice is made, create an ADR.

Examples:

- Why modular monolith?
- Why PostgreSQL?
- Why Redis?
- Why this queue?
- Why this AI provider abstraction?
- Why hybrid retrieval?
- Why this authentication approach?
- Why this deployment strategy?

Use:

```text
Context
Decision
Alternatives
Consequences
```

This is important for the developer's learning and portfolio.

---

# 35. DOCUMENTATION

Maintain:

```text
README.md

docs/
  architecture/
  decisions/
  api/
  development/
  operations/
  security/
  ai/
```

Include architecture diagrams.

Use Mermaid where appropriate.

Documentation must describe reality.

Do not document imaginary features.

---

# 36. DEVELOPMENT PHASES

Do not skip directly to AI.

## Phase 0 — Architecture

Produce:

- product requirements
- functional requirements
- non-functional requirements
- domain model
- architecture
- ERD
- API strategy
- event strategy
- AI architecture
- security model
- testing strategy
- deployment strategy
- ADRs

No significant application implementation yet.

---

## Phase 1 — Engineering Foundation

Implement:

- repository structure
- TypeScript configuration
- linting
- formatting
- testing
- environment validation
- database connection
- migrations
- logging
- error handling
- CI
- local development environment
- Docker where useful

---

## Phase 2 — Identity + Core Domains

Implement:

- authentication
- user model
- authorization
- projects
- tasks
- goals

Focus on correctness.

---

## Phase 3 — Knowledge

Implement:

- notes
- documents
- object storage
- ingestion pipeline
- processing jobs
- metadata
- search

---

## Phase 4 — Retrieval

Implement:

- embeddings
- vector storage
- keyword search
- hybrid retrieval
- reranking
- provenance

---

## Phase 5 — AI Platform

Implement:

- AI provider abstraction
- AI gateway
- streaming
- structured outputs
- token/cost tracking
- context builder
- tool system

---

## Phase 6 — Agents

Implement:

- agent runtime
- planner
- knowledge agent
- research agent
- task agent
- validation
- agent observability

---

## Phase 7 — Memory

Implement:

- memory model
- extraction
- storage
- retrieval
- provenance
- confidence
- verification
- correction
- invalidation

---

## Phase 8 — Automation

Implement:

- scheduled workflows
- daily planning
- background jobs
- notifications
- recurring workflows

---

## Phase 9 — Production Hardening

Implement:

- rate limiting
- caching
- security hardening
- observability
- load testing
- failure testing
- backup strategy
- recovery strategy
- AI evaluation
- performance analysis

---

## Phase 10 — Deployment

Implement:

- production infrastructure
- environment separation
- CI/CD
- monitoring
- alerts
- database backups
- deployment documentation
- runbooks

---

# 37. PRODUCTION REQUIREMENT

"Production-grade" does NOT mean pretending a personal project has infinite scale.

Do not build unnecessary distributed complexity.

Instead demonstrate:

- clear boundaries
- reliability
- security
- observability
- testing
- failure handling
- maintainability
- scalability paths

Always explain what happens when a dependency fails.

For example:

"What happens if Redis goes down?"

"What happens if the AI provider times out?"

"What happens if document processing crashes halfway through?"

"What happens if a job executes twice?"

"What happens if the same event is delivered twice?"

"What happens if the user loses network connectivity?"

"What happens if an agent attempts an unauthorized tool call?"

Design answers before implementation.

---

# 38. CODING STANDARDS

Use modern TypeScript.

Prefer:

- strict typing
- immutable data where appropriate
- small functions
- explicit dependencies
- dependency inversion
- clear interfaces
- domain-oriented naming

Avoid:

- giant files
- god classes
- global mutable state
- hidden side effects
- duplicated business logic
- unnecessary abstractions
- premature generic frameworks
- any-type abuse
- magic constants

Do not optimize for fewer lines of code.

Optimize for clarity.

---

# 39. AI CODING RULES

When generating code:

1. First explain where the code belongs.
2. Explain why the design exists.
3. Show relevant interfaces.
4. Implement the smallest coherent change.
5. Include tests.
6. Explain how to run/verify it.
7. Identify likely failure modes.
8. Do not modify unrelated parts of the system.

Never rewrite large sections unnecessarily.

Never silently replace working architecture.

Never introduce a dependency without justification.

---

# 40. CODE REVIEW MODE

Whenever asked to review code:

Evaluate:

### Architecture

- boundaries
- dependencies
- coupling
- cohesion

### Correctness

- business logic
- edge cases
- concurrency

### Security

- authorization
- validation
- injection
- data exposure

### Reliability

- retries
- idempotency
- failure handling

### Performance

- queries
- network calls
- unnecessary work

### Testing

- missing coverage
- brittle tests

### Maintainability

- naming
- complexity
- duplication

Give findings ordered by severity.

---

# 41. NEVER DO THESE THINGS

Do not:

- generate the whole application at once
- invent requirements
- use microservices merely for appearance
- use AI agents for simple deterministic logic
- store everything in a vector database
- expose raw database access to LLMs
- trust retrieved content as instructions
- skip authorization because the app is personal
- skip testing
- skip observability
- hard-code secrets
- hide errors
- use "TODO" as a substitute for critical implementation
- create fake production infrastructure
- claim something is production-ready without verification

---

# 42. FIRST TASK

DO NOT START IMPLEMENTING THE APPLICATION YET.

Your first response should be an **Architecture Kickoff**.

Produce:

## A. Product Definition

Clearly define Aureon.

## B. User Stories

Create the initial high-value user stories.

## C. Functional Requirements

Categorize them by domain.

## D. Non-Functional Requirements

Include:

- security
- reliability
- performance
- scalability
- observability
- accessibility
- maintainability

## E. Domain Model

Identify bounded contexts and entities.

## F. System Architecture

Provide a Mermaid architecture diagram.

## G. Database Architecture

Provide the initial ERD and explain important indexes/constraints.

## H. AI Architecture

Explain:

- AI gateway
- context builder
- retrieval
- tools
- agents
- memory
- evaluation

## I. Async Architecture

Explain:

- events
- queues
- workers
- retries
- idempotency

## J. Security Architecture

Explain:

- authentication
- authorization
- tenant isolation
- AI security
- prompt injection boundaries
- secrets

## K. Observability

Define logs, metrics, traces and AI telemetry.

## L. Testing Strategy

Define the testing pyramid and AI evaluation strategy.

## M. Deployment Architecture

Give a realistic initial production deployment architecture.

## N. ADRs

Create the first architecture decision records.

## O. Implementation Roadmap

Break the project into small milestones.

Do NOT write the full application yet.

At the end, identify the **first implementation milestone** and wait for approval before proceeding.

---

# 43. IMPORTANT

This project is intended to teach and demonstrate real system design.

When making decisions, explain the trade-offs.

Do not simply say:

"Use X because it is scalable."

Explain:

- what problem X solves
- what alternatives exist
- what complexity X introduces
- when X would stop being appropriate

The developer should finish this project understanding the architecture rather than merely possessing generated code.

Build Aureon as if it were going through a serious engineering review.

The goal is not maximum code.

The goal is a system that is:

**well-designed, secure, observable, testable, maintainable, and genuinely useful.**

Begin with the Architecture Kickoff.

this prompt was given to claude opus 5.5

# Aureon M1.0: ADR Amendments and Spike Kits

**Status:** ADRs updated · spike kits ready · **spike results pending** · M1.1 not started

## I couldn't run the spikes

This environment only lets me search the web and read pages. It can't run code, start containers or open database connections, so I couldn't run S1–S3, and the results below contain no numbers. I haven't estimated or invented any. If I did, the spike would prove nothing and ADR-005 and ADR-006 would rest on made-up data.

Instead, I've done three things:

1. **Checked the pg-boss claims against its current documentation.** The facts that shape S1 are listed below as documentation evidence, not as measurements.
2. **Built runnable spike kits.** You run them in Antigravity and paste the output back. I haven't executed this code. A type error or API mismatch when you run it is a finding worth reporting, not something to quietly work around.
3. **Wrote each spike's decision rules before running it.** For each spike, the rules say what the architecture does if a check fails. That way the results decide, and I can't talk my way around a bad number afterward.

Once you send the results, I'll finalize ADR-005 and ADR-006, change the architecture only where the evidence requires it (step D), and start M1.1 (step E).

---

## A. ADR amendments

### ADR-007: Authentication (Accepted)

**Context:** v1 is a browser-first app for a single user and has to be ready for SaaS later. You approved self-implementation as a learning goal, with its scope limited.

**Decision:** email/password login with server-side sessions, built only from vetted primitives. There is no custom cryptography.

| Concern                | Decision                                                                                                                                                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password hashing       | Argon2id through a maintained native binding (chosen in M2.1). Parameters start at or above the OWASP minimum (m=19 MiB, t=2, p=1), are tuned in M2.1 to a measured hash time on production hardware, and are recorded. Hashes store their parameters so they can be upgraded when the user next logs in. |
| Session token          | 256 random bits from the CSPRNG, base64url-encoded, sent only in the cookie. The server stores only SHA-256(token).                                                                                                                                                                                       |
| Cookie                 | `__Host-aureon_session; Secure; HttpOnly; SameSite=Lax; Path=/`, with no Domain attribute                                                                                                                                                                                                                 |
| Lifetime               | Idle and absolute expiry (starting at 7 and 30 days, set in config). `last_seen_at` is updated at most once every 5 minutes so every request doesn't cause a write.                                                                                                                                       |
| Rotation               | New session on login and on any privilege change. Any session token that existed before login is invalidated, which prevents session fixation.                                                                                                                                                            |
| Revocation             | Sign out, "sign out everywhere", and revocation of all other sessions on password change or reset. Each of these writes an audit event.                                                                                                                                                                   |
| Password reset         | 256-bit token stored as a hash, 30-minute expiry, single use (conditional update). Issuing a new token invalidates earlier ones. A successful reset revokes all sessions.                                                                                                                                 |
| Enumeration resistance | Sign-up, login and reset return the same response. When the user doesn't exist, login still verifies against a dummy hash so response timing matches.                                                                                                                                                     |
| Rate limiting          | Postgres counters `(scope, key_hash, window_start)` with an atomic `INSERT … ON CONFLICT DO UPDATE … RETURNING count`. Limits apply per hashed email and per IP for login, sign-up and reset. The thresholds are set in config.                                                                           |
| CSRF                   | SameSite=Lax, plus `Origin` verification on state-changing requests, plus JSON-only bodies                                                                                                                                                                                                                |

**Required security tests (M2.1 won't pass review without them):** session fixation; revoked session rejected on the next request; expired sessions (idle and absolute) rejected; reset token reuse, expiry and cross-user use; enumeration responses that match in body and status; login timing within a tolerance band; lockout and rate-limit behavior under concurrent attempts; cookie attributes asserted on every `Set-Cookie`; missing or foreign `Origin` rejected on POST/PATCH/DELETE; the stored token hash never equals the token; no token or password in logs (log-capture assertion).

**Out of scope for v1:** OAuth, social login, MFA and passkeys. **Trigger:** before any of these is built, an established auth library is re-evaluated in a new ADR.

**Consequences:** full understanding and control of the code. The security burden is ours, and the test suite above carries it.

---

### ADR-016: Memory scope for v1, and Decisions as a domain entity (Accepted)

**Decision:**

- v1 memory types are **`semantic`** and **`project`**.
- **Where memories come from:** (a) memories the user creates explicitly, which start `active` with `verified_by=user`; (b) memories the AI proposes **from the user's own messages only**, which start `proposed` and are never included in context until the user confirms them.
- **No extraction from retrieved documents, notes or tool results.** This is enforced in code: the extraction input builder only accepts `HistoryMessage` items with `role='user'`, and a test asserts that other roles and content types are rejected.
- Episodic memory is deferred.
- **Decisions** move into the planning context as a first-class entity: `status: proposed | accepted | superseded | reversed`, a `superseded_by` link, rationale, `decided_on`, an optional project, and typed source links. The assistant can only _propose_ a decision, and that goes through the pending-action flow.

**Consequences:** memory is less "magical" at launch, but you can trust it. The question "what have we decided?" gets an exact answer from relational data.

---

### ADR-010 (amended): AI Gateway, budget ledger and kill switch

**Rule:** no provider adapter can be called except through the gateway's `reserve → call → settle` path. Adapters aren't exported from `packages/ai`, and dependency-cruiser enforces that. The ledger lands in M4.1, before the first paid call.

**Limit scopes** (all set in config as integer micro-USD, with per-purpose overrides):

| Scope             | Key                                                                  | Guards against                            |
| ----------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| Per request       | `(purpose)`: max input tokens, max output tokens, max estimated cost | One oversized call                        |
| Per run           | `(agent_run_id)`                                                     | A runaway agent loop                      |
| Workspace daily   | `(workspace_id, local date)`                                         | Day-level overspend                       |
| Workspace monthly | `(workspace_id, month)`                                              | Total spend per workspace                 |
| Global daily      | `('global', UTC date)`                                               | A bug that affects all workspaces at once |

**How the budget race is prevented.** All of this happens in one transaction:

1. Insert a `ai_budget_reservations` row: `id, scopes, estimate, status='reserved', expires_at`.
2. For each scope, in a **fixed order** (global → workspace-month → workspace-day → run), make sure the counter row exists with `ON CONFLICT DO NOTHING`, then run:
   `UPDATE ai_budget_counters SET reserved = reserved + $est WHERE scope=$s AND key=$k AND spent + reserved + $est <= $limit RETURNING 1`
3. If any update returns zero rows, the whole transaction rolls back and the caller gets `BudgetExceeded(scope)`.

Two concurrent reservations on the same counter serialize on its row lock. Under READ COMMITTED, Postgres re-checks the `WHERE` condition against the newly committed row version, so the second reservation sees the first one's reservation. Both can't pass. The fixed lock order prevents deadlocks between scopes. The limit comes from config at the time of the call, so changing a limit takes effect right away.

**Estimating and settling cost:**

- The estimate is input tokens (counted by the provider's tokenizer, or a conservative chars/3 heuristic if there isn't one) times the input price, plus `max_output_tokens` times the output price. The provider enforces the output cap, so actual output can't exceed what was reserved.
- **A model without a price-table entry is refused (fail closed).** We can't budget a call whose cost we can't estimate.
- Settling is idempotent: `UPDATE reservations SET status='settled' … WHERE id=$1 AND status='reserved'`. Only if that succeeds does the code move `reserved → spent` on the counters.
- If a call fails but the provider reported usage, we settle at the reported usage. If it timed out without reporting, we settle at the estimate, since we should assume we were billed.
- The reaper settles expired reservations at the estimate.
- Remaining risk: underestimated _input_ tokens. The possible overspend is at most one request's estimation error per concurrent request. The next reservation then fails.

**Kill switch:**

- An `ai_controls` table holds one row for `global` and one per purpose, each with `enabled`, `reason`, `changed_by` and `changed_at`. Every change is audited.
- The gateway checks the switch **before** reserving, using an in-process cache with a 10-second TTL.
- If the control can't be read, paid calls fail closed.
- The environment variable `AI_HARD_DISABLE=true` is the last-resort switch, for when the database itself is the problem. It requires a restart.

**Scaling note:** the global counter row is a hot spot. That's fine below roughly 100 reservations per second. If we ever get there, the path is sharded counters.

---

### ADR-020: AI provider configuration and data egress (Proposed, required before Phase 4)

**Context:** sending documents to a hosted model is a privacy decision, not a technical detail.

**What gets decided now:**

- **Consent is recorded per workspace.** A workspace has `hosted_ai_processing` (off by default) with a consent timestamp and a policy version.
- Every gateway purpose declares which **data classes** it sends: `document_text` (embedding, retrieval excerpts), `workspace_metadata` (task and goal titles), `user_messages`, `memories`.
- The gateway refuses any purpose that sends workspace content when consent is missing.
- Without consent, CRUD and keyword search still work, and ingestion stops at `CHUNKED` rather than running embeddings.

**Must be filled in before M4.1:**

- provider and model per purpose
- embedding model and dimensions
- processing region
- data retention and training terms, with a link to the provider's terms and the date they were checked
- whether zero-data-retention is available
- sub-processors
- what the user-facing disclosure text says

Whether to also support a local-model adapter gets decided at the same time. The gateway interface already allows it.

---

### ADR-014: Context Engine (Accepted as a core subsystem)

Its status changes from Proposed to Accepted as designed in the review. It's `modules/context`, and it's treated as a product differentiator, with its own milestones (M5.3a–c), its own eval suite, and the manifest as a user-visible artifact. It has no database access of its own, and dependency-cruiser enforces that.

### ADR-021: Architecture enforcement as code (Proposed, implemented in M1.1)

This records how each of your rules becomes a machine check, and where a machine check isn't possible.

| Rule                                        | Mechanism                                                                                                                                                                                                                                                 | Limit (stated honestly)                                                                                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Module boundaries and layer direction       | dependency-cruiser: cross-module imports only through `index.ts`; `domain → kernel` only; `application → domain + ports`; `infrastructure → application`; no cycles                                                                                       | Runtime tricks like dynamic `import()` with computed strings could get around it. That's banned by ESLint.                                                 |
| No DB access from web                       | dependency-cruiser: `apps/web` may import only `packages/contracts` and UI libraries. Imports of `pg`, `drizzle-orm`, `pg-boss`, `packages/platform/db` and `packages/core` are forbidden.                                                                | None significant                                                                                                                                           |
| No AI SDKs outside `packages/ai`            | (1) dependency-cruiser path rule. (2) A **manifest policy script**: restricted packages (provider SDKs, multi-provider SDKs) may appear only in `packages/ai/package.json`, and CI fails otherwise.                                                       | New SDK names have to be added to the list. The list is reviewed whenever a dependency is added.                                                           |
| No raw SQL outside approved boundaries      | ESLint `no-restricted-imports` for `pg` and for `sql` from `drizzle-orm`, with overrides only for `packages/platform/src/db/**` and `modules/*/infrastructure/**`. `sql.raw` is banned everywhere except migrations.                                      | String-built queries inside allowed files still need code review. `sql.raw` is the dangerous one, and it's banned.                                         |
| `Clock` instead of `new Date()`             | ESLint `no-restricted-syntax` in `domain/**` and `application/**`: zero-argument `new Date()`, `Date.now()`, `Math.random()` and `crypto.randomUUID()` are banned (use `IdGenerator` instead)                                                             | None within those globs                                                                                                                                    |
| No `process.env` outside config             | ESLint `no-restricted-properties` everywhere except `packages/platform/src/config/**`                                                                                                                                                                     | None                                                                                                                                                       |
| No `workspace_id`/`user_id` in tool schemas | The tool registry doesn't exist until M5.4, so there's nothing to check yet. From M5.4: a type-level guard that rejects those keys in `ToolInput`, plus a registry-wide test that walks every tool's Zod schema recursively. Recorded in `AGENTS.md` now. | Can't be enforced before the code exists                                                                                                                   |
| Strict TypeScript                           | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`. ESLint errors on `no-explicit-any`, `no-floating-promises`, `switch-exhaustiveness-check`, and `ban-ts-comment` (a suppression must include a description).     | None                                                                                                                                                       |
| Tests for each application capability       | (1) A script requires each `modules/*/application/**/*.ts` use-case file to have a sibling `*.test.ts`, or an entry in `test-exemptions.json` with a reason. (2) Coverage thresholds on `domain/` and `application/`.                                     | Coverage and file pairing are proxies. They can't show that a test is _meaningful_, which stays a code-review concern and is on the `AGENTS.md` checklist. |
| Proof that the rules work                   | `tools/arch-fixtures/` contains one deliberately violating file per rule. A test runs dependency-cruiser and ESLint against them and asserts that each one fails.                                                                                         | None                                                                                                                                                       |

---

## B. Spike kits

All spikes live on a throwaway `spikes/m1.0` branch that is never merged. **Prerequisites:** Node 24 LTS, pnpm, Docker. pg-boss requires Node 22.12 or later, so Node 24 is our baseline, and S3 confirms it.

### Documentation evidence that shapes S1 (not measurements)

- **In-transaction enqueue** works through a `db` object that implements `executeSql(text, values)`. pg-boss also ships adapters for Drizzle and other ORMs. S1 uses a raw `pg` client so that it tests pg-boss on its own, without Drizzle.
- **Crash recovery depends on heartbeats and the monitor.** `heartbeatSeconds` must be at least 10, and if no heartbeat arrives in time, the monitor fails or retries the job. The monitor runs every 60 seconds by default, so expected recovery time is at most the heartbeat interval plus about 60 seconds. S1 measures it.
- **Completed jobs are deleted after 7 days by default**, and queued jobs expire after 14 days. That confirms idempotency has to live in the domain rather than in the queue.
- **`createSchema: false` and a CLI for migrations exist,** which fits our design of migrating in a release step under the owner role.
- **Index rebuilds need index ownership.** A runtime role that doesn't own the indexes only gets bloat _detection_.
- **LISTEN/NOTIFY uses a dedicated connection**, which is another reason polling stays the default.
- **pg-boss warns when vacuum can't reclaim space (`xmin_horizon`)**, which supports our "no long transactions in handlers" rule. We'll forward pg-boss `warning` events to logs.

One scope change: "a handler run twice gives identical domain state" tests _our_ handler pattern, not pg-boss. It moves to the job-handler test harness in M1.5.

### Shared setup

```yaml
# spikes/compose.yaml
services:
  postgres:
    image: pgvector/pgvector:pg17
    environment: # spike-only credentials, never used elsewhere
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: aureon_spike
    ports: ['5433:5432']
    volumes: ['./bootstrap.sql:/docker-entrypoint-initdb.d/00-bootstrap.sql:ro']
```

```sql
-- spikes/bootstrap.sql: run by the platform admin (superuser), never by the app.
create role aureon_owner  login password 'owner_spike'  nosuperuser nobypassrls;  -- migrations
create role aureon_app    login password 'app_spike'    nosuperuser nobypassrls;  -- api + worker
create role aureon_system login password 'system_spike' nosuperuser bypassrls;    -- allowlisted maintenance jobs
grant connect, create on database aureon_spike to aureon_owner;
grant connect on database aureon_spike to aureon_app, aureon_system;
grant usage, create on schema public to aureon_owner;
grant usage on schema public to aureon_app, aureon_system;
-- Any table the owner creates (public, pgboss, drizzle schemas) is usable by the runtime roles.
alter default privileges for role aureon_owner grant select, insert, update, delete on tables to aureon_app, aureon_system;
alter default privileges for role aureon_owner grant usage, select on sequences to aureon_app, aureon_system;
```

### S1: pg-boss queue

Run `pnpm add pg-boss pg` and `pnpm add -D tsx typescript @types/pg @types/node`, with `"type": "module"` in `package.json`. Environment: `OWNER_URL=postgres://aureon_owner:owner_spike@localhost:5433/aureon_spike` and `APP_URL=postgres://aureon_app:app_spike@localhost:5433/aureon_spike`.

```ts
// spikes/s1-queue/src/common.ts
import { PgBoss } from 'pg-boss';

export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}
export const OWNER_URL = env('OWNER_URL');
export const APP_URL = env('APP_URL');

type QueueOptions = Parameters<PgBoss['createQueue']>[1];

/** Release-step simulation: the schema and queues are created by the owner role only. */
export async function installAsOwner(
  queues: ReadonlyArray<{ name: string; options?: QueueOptions }>,
): Promise<void> {
  const installer = new PgBoss({ connectionString: OWNER_URL, supervise: false });
  await installer.start();
  for (const q of queues) {
    if (!(await installer.getQueue(q.name))) await installer.createQueue(q.name, q.options);
  }
  await installer.stop();
}

/** Runtime role: must work without any DDL privileges. */
export function runtimeBoss(): PgBoss {
  const boss = new PgBoss({
    connectionString: APP_URL,
    createSchema: false,
    application_name: 'aureon-spike',
  });
  boss.on('error', (e) => console.error('[boss:error]', e));
  boss.on('warning', (w) => console.warn('[boss:warning]', w));
  return boss;
}

export function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? Number.NaN;
}
export const report = (name: string, data: Record<string, unknown>): void =>
  console.log(`RESULT ${name} ${JSON.stringify(data)}`);
```

```ts
// spikes/s1-queue/src/a-tx-enqueue.ts
// Checks: send() joins our transaction; runtime role needs no DDL; enqueue and pickup latency.
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import pg from 'pg';
import { APP_URL, installAsOwner, percentile, report, runtimeBoss } from './common.js';

const QUEUE = 's1_tx';
await installAsOwner([{ name: QUEUE }]);

const boss = runtimeBoss();
await boss.start(); // Observation: does this succeed without DDL rights?
report('s1.runtime_start', { ok: true });

const pool = new pg.Pool({ connectionString: APP_URL, max: 2 });
const client = await pool.connect();
const db = { executeSql: (text: string, values: unknown[]) => client.query(text, values) };

// 1. Rollback discards the job.
await client.query('begin');
const rolledBack = await boss.send(QUEUE, { case: 'rollback' }, { db });
assert.ok(rolledBack, 'send() returned no id');
await client.query('rollback');
assert.equal((await boss.findJobs(QUEUE, { id: rolledBack })).length, 0, 'job survived rollback');

// 2. Commit keeps the job.
await client.query('begin');
const committed = await boss.send(QUEUE, { case: 'commit' }, { db });
assert.ok(committed);
await client.query('commit');
assert.equal((await boss.findJobs(QUEUE, { id: committed })).length, 1, 'committed job missing');
report('s1.tx_semantics', { rollbackDiscards: true, commitPersists: true });

// 3. Enqueue cost inside a transaction (the API's hot path).
const sendMs: number[] = [];
for (let i = 0; i < 500; i++) {
  await client.query('begin');
  const t0 = performance.now();
  await boss.send(QUEUE, { case: 'latency', sentAt: Date.now() }, { db });
  sendMs.push(performance.now() - t0);
  await client.query('commit');
}
report('s1.send_in_tx_ms', { p50: percentile(sendMs, 50), p95: percentile(sendMs, 95), n: sendMs.length });
client.release();

// 4. Pickup latency with polling (LISTEN/NOTIFY is off by design).
const pollSeconds = Number(process.env.POLL_SECONDS ?? 2);
const pickupMs: number[] = [];
await boss.deleteQueuedJobs(QUEUE);
await new Promise<void>((resolve) => {
  void boss.work<{ sentAt: number }>(QUEUE, { pollingIntervalSeconds: pollSeconds }, async ([job]) => {
    if (job) pickupMs.push(Date.now() - job.data.sentAt);
    if (pickupMs.length === 50) resolve();
  });
  void (async () => {
    for (let i = 0; i < 50; i++) {
      await boss.send(QUEUE, { sentAt: Date.now() });
      await new Promise((r) => setTimeout(r, 100));
    }
  })();
});
report('s1.pickup_ms', { pollSeconds, p50: percentile(pickupMs, 50), p95: percentile(pickupMs, 95) });

// 5. Observation only: can the runtime role create queues? (Standard queues may be metadata-only.)
try {
  await boss.createQueue('s1_runtime_create');
  report('s1.runtime_create_queue', { allowed: true });
} catch (e) {
  report('s1.runtime_create_queue', { allowed: false, error: String(e) });
}

await boss.stop();
await pool.end();
```

```ts
// spikes/s1-queue/src/b-crash-worker.ts: picks the job, reports it, then hangs until SIGKILL.
import { runtimeBoss } from './common.js';
const boss = runtimeBoss();
await boss.start();
await boss.work('s1_crash', async ([job]) => {
  process.send?.({ picked: job?.id });
  await new Promise<never>(() => {}); // the heartbeat keeps running until the process is killed
});
```

```ts
// spikes/s1-queue/src/b-crash-harness.ts
// Checks: a job held by a SIGKILLed worker is redelivered via heartbeat expiry, not the 15-minute expiration.
import { fork } from 'node:child_process';
import { installAsOwner, report, runtimeBoss } from './common.js';

const QUEUE = 's1_crash';
const heartbeatSeconds = Number(process.env.HEARTBEAT_SECONDS ?? 30);
await installAsOwner([
  { name: QUEUE, options: { heartbeatSeconds, expireInSeconds: 900, retryLimit: 3, retryDelay: 1 } },
]);

const boss = runtimeBoss();
await boss.start(); // this instance supervises (runs the monitor)
const jobId = await boss.send(QUEUE, { case: 'crash' });

const child = fork(new URL('./b-crash-worker.ts', import.meta.url), { execArgv: ['--import', 'tsx'] });
const killedAt = await new Promise<number>((resolve) => {
  child.on('message', (msg: unknown) => {
    if (typeof msg === 'object' && msg !== null && 'picked' in msg && msg.picked === jobId) {
      child.kill('SIGKILL');
      resolve(Date.now());
    }
  });
});

const recoveredAt = await new Promise<number>((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('not recovered within 10 minutes')), 600_000);
  void boss.work(QUEUE, async ([job]) => {
    if (job?.id === jobId) {
      clearTimeout(timeout);
      resolve(Date.now());
    }
  });
});
report('s1.crash_recovery', { heartbeatSeconds, recoveryMs: recoveredAt - killedAt });
await boss.stop();
```

```ts
// spikes/s1-queue/src/c-dead-letter.ts
// Checks: exhausted retries move the job to the DLQ with provenance.
import assert from 'node:assert/strict';
import { installAsOwner, report, runtimeBoss } from './common.js';

await installAsOwner([
  { name: 's1_dlq' }, // must exist before it is referenced
  { name: 's1_fail', options: { retryLimit: 2, retryDelay: 1, retryBackoff: true, deadLetter: 's1_dlq' } },
]);
const boss = runtimeBoss();
await boss.start();

let attempts = 0;
await boss.work('s1_fail', async () => {
  attempts++;
  throw new Error('permanent failure (spike)');
});
const started = Date.now();
const id = await boss.send('s1_fail', { case: 'dlq' });

const dead = await new Promise<{ sourceId: string | null }>((resolve) => {
  void boss.work('s1_dlq', { includeMetadata: true }, async ([job]) => {
    if (job) resolve(job);
  });
});
assert.equal(dead.sourceId, id, 'DLQ job lost its source id');
assert.equal(attempts, 3, 'expected 1 attempt + 2 retries');
report('s1.dead_letter', { attempts, msToDeadLetter: Date.now() - started });
await boss.stop();
```

**Run:** `docker compose up -d`, then `tsx src/a-tx-enqueue.ts`. Run `tsx src/b-crash-harness.ts` twice, once with `HEARTBEAT_SECONDS=30` and once with `HEARTBEAT_SECONDS=10`. Then `tsx src/c-dead-letter.ts`. Paste every `RESULT` line, plus any errors, type errors and pg-boss warnings.

### S2: Drizzle, RLS and the test harness

Run `pnpm add drizzle-orm pg` and `pnpm add -D drizzle-kit vitest @testcontainers/postgresql @types/pg tsx typescript`.

```ts
// spikes/s2-db/src/schema.ts
import { foreignKey, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
});

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    name: text('name').notNull(),
  },
  (t) => [unique('projects_workspace_id_id_uq').on(t.workspaceId, t.id)],
); // composite FK target

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    projectId: uuid('project_id'), // nullable: MATCH SIMPLE skips the FK check when null
    title: text('title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: 'tasks_project_same_workspace_fk',
      columns: [t.workspaceId, t.projectId],
      foreignColumns: [projects.workspaceId, projects.id],
    }),
    index('tasks_workspace_created_idx').on(t.workspaceId, t.createdAt.desc()),
  ],
);
```

```ts
// spikes/s2-db/src/tenant.ts: candidate for packages/platform/db
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema.js';

export type Db = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export interface TenantContext {
  readonly workspaceId: string;
  readonly userId: string;
}

/** All tenant data access goes through here. is_local=true scopes the settings to this transaction. */
export function withTenant<T>(db: Db, ctx: TenantContext, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.workspace_id', ${ctx.workspaceId}, true),
                                set_config('app.user_id', ${ctx.userId}, true)`);
    return fn(tx);
  });
}
```

Migration steps, with the output of each one recorded:

1. `drizzle-kit generate --name=init`
2. `drizzle-kit generate --custom --name=rls`, then paste the SQL below into the generated file.
3. `drizzle-kit generate` again. **Pass condition: it reports no changes and doesn't try to touch the policies.**

```sql
-- drizzle/0001_rls.sql
alter table "workspaces" enable row level security;--> statement-breakpoint
alter table "workspaces" force row level security;--> statement-breakpoint
create policy "tenant_isolation" on "workspaces"
  using ("id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
alter table "projects" enable row level security;--> statement-breakpoint
alter table "projects" force row level security;--> statement-breakpoint
create policy "tenant_isolation" on "projects"
  using ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid)
  with check ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);--> statement-breakpoint
alter table "tasks" enable row level security;--> statement-breakpoint
alter table "tasks" force row level security;--> statement-breakpoint
create policy "tenant_isolation" on "tasks"
  using ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid)
  with check ("workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid);
```

```ts
// spikes/s2-db/test/tenancy.test.ts
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from '../src/schema.js';
import { type Db, withTenant } from '../src/tenant.js';

const DB = 'aureon_spike';
let container: StartedPostgreSqlContainer;
const pools: pg.Pool[] = [];
const cloneMs: number[] = [];
const wsA = randomUUID(),
  wsB = randomUUID(),
  projectA = randomUUID(),
  projectB = randomUUID();
const ctxA = { workspaceId: wsA, userId: randomUUID() };

const url = (user: string, pw: string, database = DB) =>
  `postgres://${user}:${pw}@${container.getHost()}:${container.getPort()}/${database}`;
const makePool = (user: string, pw: string, max = 4) => {
  const p = new pg.Pool({ connectionString: url(user, pw), max });
  pools.push(p);
  return p;
};
/** Drizzle may wrap driver errors, so look for the SQLSTATE on the error or its cause. */
const pgCode = (e: unknown): string | undefined => {
  const err = e as { code?: string; cause?: { code?: string } };
  return err.code ?? err.cause?.code;
};
const p = (xs: number[], q: number) => [...xs].sort((a, b) => a - b)[Math.floor((q / 100) * (xs.length - 1))];

let appPool: pg.Pool, appDb: Db, systemPool: pg.Pool;

beforeAll(async () => {
  container = await new PostgreSqlContainer('pgvector/pgvector:pg17')
    .withDatabase(DB)
    .withUsername('postgres')
    .withPassword('postgres')
    .start();

  const admin = new pg.Client({ connectionString: url('postgres', 'postgres') });
  await admin.connect();
  await admin.query(await readFile(new URL('../../bootstrap.sql', import.meta.url), 'utf8'));
  await admin.end();

  const owner = new pg.Client({ connectionString: url('aureon_owner', 'owner_spike') });
  await owner.connect();
  await migrate(drizzle({ client: owner }), {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  });
  await owner.end();

  // Template cloning for per-test-file isolation (requires no open connections to DB).
  const maint = new pg.Client({ connectionString: url('postgres', 'postgres', 'postgres') });
  await maint.connect();
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    await maint.query(`create database clone_${i} template ${DB}`);
    cloneMs.push(performance.now() - t0);
  }
  await maint.end();

  systemPool = makePool('aureon_system', 'system_spike');
  await systemPool.query(`insert into workspaces (id, name) values ($1,'A'),($2,'B')`, [wsA, wsB]);
  await systemPool.query(`insert into projects (id, workspace_id, name) values ($1,$2,'PA'),($3,$4,'PB')`, [
    projectA,
    wsA,
    projectB,
    wsB,
  ]);
  await systemPool.query(
    `insert into workspaces (id, name) select gen_random_uuid(), 'bulk-'||g from generate_series(1,50) g`,
  );
  await systemPool.query(`insert into tasks (id, workspace_id, title)
    select gen_random_uuid(), w.id, 'task '||g from workspaces w cross join generate_series(1,1000) g`);
  await systemPool.query('analyze');

  appPool = makePool('aureon_app', 'app_spike');
  appDb = drizzle({ client: appPool, schema });
}, 180_000);

afterAll(async () => {
  await Promise.all(pools.map((x) => x.end()));
  await container?.stop();
});

describe('S2 tenancy', () => {
  it('app role is neither superuser nor BYPASSRLS', async () => {
    const { rows } = await appPool.query(
      'select rolsuper, rolbypassrls from pg_roles where rolname = current_user',
    );
    expect(rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
  });

  it('no tenant context: zero rows, no error (fail closed)', async () => {
    const { rows } = await appPool.query('select count(*)::int as n from tasks');
    expect(rows[0].n).toBe(0);
  });

  it('tenant A sees only A', async () => {
    const rows = await withTenant(appDb, ctxA, (tx) => tx.select().from(schema.projects));
    expect(rows.map((r) => r.id)).toEqual([projectA]);
  });

  it('WITH CHECK rejects writing into B under A context', async () => {
    const err = await withTenant(appDb, ctxA, (tx) =>
      tx.insert(schema.projects).values({ id: randomUUID(), workspaceId: wsB, name: 'x' }),
    ).catch((e: unknown) => e);
    expect(pgCode(err)).toBe('42501');
  });

  it('composite FK rejects cross-workspace reference even when RLS is bypassed', async () => {
    const err = await systemPool
      .query(`insert into tasks (id, workspace_id, project_id, title) values ($1,$2,$3,'x')`, [
        randomUUID(),
        wsA,
        projectB,
      ])
      .catch((e: unknown) => e);
    expect(pgCode(err)).toBe('23503');
  });

  it('tenant context does not leak to the next use of a pooled connection', async () => {
    const single = makePool('aureon_app', 'app_spike', 1);
    const singleDb = drizzle({ client: single, schema });
    await withTenant(singleDb, ctxA, (tx) => tx.select().from(schema.projects));
    const { rows } = await single.query('select count(*)::int as n from projects');
    expect(rows[0].n).toBe(0);
  });

  it('measures: RLS query plan, withTenant overhead, clone time', async () => {
    const {
      rows: [bulk],
    } = await systemPool.query(`select id from workspaces where name = 'bulk-1'`);
    const ctx = { workspaceId: bulk.id as string, userId: randomUUID() };
    const plan = await withTenant(appDb, ctx, (tx) =>
      tx.execute(
        sql`explain (analyze, format json) select id, title from tasks order by created_at desc limit 50`,
      ),
    );
    const withMs: number[] = [],
      withoutMs: number[] = [];
    for (let i = 0; i < 200; i++) {
      let t0 = performance.now();
      await withTenant(appDb, ctx, (tx) => tx.execute(sql`select 1`));
      withMs.push(performance.now() - t0);
      t0 = performance.now();
      await appDb.transaction((tx) => tx.execute(sql`select 1`));
      withoutMs.push(performance.now() - t0);
    }
    console.log('RESULT s2.plan', JSON.stringify(plan.rows[0]));
    console.log(
      'RESULT s2.with_tenant_ms',
      JSON.stringify({
        p50: p(withMs, 50),
        p95: p(withMs, 95),
        baselineP50: p(withoutMs, 50),
        baselineP95: p(withoutMs, 95),
      }),
    );
    console.log(
      'RESULT s2.template_clone_ms',
      JSON.stringify({ p50: p(cloneMs, 50), max: Math.max(...cloneMs) }),
    );
  });
});
```

**Run:** `pnpm vitest run --reporter=verbose`. Paste the test results, the `RESULT` lines, and the output of all three drizzle-kit commands.

### S3: Runtime, observability and developer experience (checklist and minimal files)

| #   | Check                                                                         | How                                                                                                                                                    | Pass                                                 |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 1   | Node 24 LTS and pnpm via `packageManager`                                     | `node -v`, `corepack enable`                                                                                                                           | Versions recorded                                    |
| 2   | Fastify + ESM + `tsx watch` reload time                                       | Save a file and time until the "listening" log appears                                                                                                 | < 2 s                                                |
| 3   | OTel under ESM: HTTP → pg spans with one trace ID; pino logs carry `trace_id` | Files below, `ConsoleSpanExporter`                                                                                                                     | Same trace ID on HTTP span, pg span and log line     |
| 4   | Fastify instrumentation choice                                                | Try `@fastify/otel` (the older OTel Fastify instrumentation has been superseded by Fastify's own package; confirm its current status during the spike) | Route-level spans appear                             |
| 5   | Next.js consuming `@aureon/contracts` as TS source                            | `transpilePackages: ['@aureon/contracts']`; change a contract during `next dev`                                                                        | HMR picks up the change, and `next build` succeeds   |
| 6   | SSE through Caddy isn't buffered                                              | Route below, then `curl -N` through Caddy, with and without `flush_interval -1`                                                                        | Events arrive about 250 ms apart, not all at the end |

```ts
// spikes/s3-runtime/api/src/instrumentation.ts: loaded with `--import` before the app
import { register } from 'node:module';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

register('@opentelemetry/instrumentation/hook.mjs', import.meta.url); // ESM module patching
new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
}).start();
// dev:  tsx watch --import ./src/instrumentation.ts src/main.ts
// prod: node --import ./dist/instrumentation.js dist/main.js
```

```ts
// spikes/s3-runtime/api/src/sse-route.ts
import type { FastifyInstance } from 'fastify';
export function registerSpikeSse(app: FastifyInstance): void {
  app.get('/api/v1/spike/sse', (req, reply) => {
    reply.hijack(); // we own the raw response from here on
    reply.raw.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
    let n = 0;
    const timer = setInterval(() => {
      reply.raw.write(`id: ${n}\ndata: ${Date.now()}\n\n`);
      if (++n === 20) {
        clearInterval(timer);
        reply.raw.end();
      }
    }, 250);
    req.raw.on('close', () => clearInterval(timer));
  });
}
```

```text
# spikes/s3-runtime/Caddyfile
:8080 {
  handle /api/* {
    reverse_proxy localhost:3001 {
      flush_interval -1   # test once with and once without this line
    }
  }
  handle { reverse_proxy localhost:3000 }
}
```

---

## C. Spike results

| Spike | Check                                                     | Result      |
| ----- | --------------------------------------------------------- | ----------- |
| S1    | Rollback discards job / commit persists                   | **Pending** |
| S1    | Runtime role `start()` without DDL                        | **Pending** |
| S1    | `send` in tx p50/p95 (ms)                                 | **Pending** |
| S1    | Pickup latency p50/p95 at 2 s polling                     | **Pending** |
| S1    | Crash recovery at heartbeat 30 s / 10 s                   | **Pending** |
| S1    | DLQ attempts and provenance                               | **Pending** |
| S1    | Runtime role can create queues (observation)              | **Pending** |
| S2    | Six tenancy assertions                                    | **Pending** |
| S2    | drizzle-kit drift after custom RLS migration              | **Pending** |
| S2    | RLS plan node + execution time (50k rows / 52 workspaces) | **Pending** |
| S2    | `withTenant` overhead vs baseline p50/p95                 | **Pending** |
| S2    | Template clone p50 / max                                  | **Pending** |
| S3    | Checks 1–6                                                | **Pending** |

Please also record the exact package versions from the lockfile. They get pinned in the ADRs.

### Decision rules, written before the results

| If…                                                                     | Then…                                                                                                                                                                |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1: a rolled-back job persists                                          | pg-boss is out for in-transaction enqueue. Fall back to a transactional outbox table and relay, and re-run the evaluation.                                           |
| S1: recovery > 120 s at heartbeat 30 s                                  | Lower `monitorIntervalSeconds` and re-measure. Up to 5 minutes is acceptable if documented. Beyond that, re-open ADR-005.                                            |
| S1: runtime `start()` needs DDL                                         | Find the option that skips migration. If none exists, document the exact privilege difference and run the queue under a dedicated role with only pg-boss schema DDL. |
| S1: runtime role can create queues                                      | Accept. It's metadata-only, and queue creation still moves to the release step by convention and a startup check.                                                    |
| S1: DLQ attempts ≠ 3 or `sourceId` missing                              | Rely on our own `failure_code` domain state for the user-facing status. The DLQ only drives alerts.                                                                  |
| S2: any isolation assertion fails                                       | **Stop.** Fix the approach before any Phase 2 work. This check isn't negotiable.                                                                                     |
| S2: drizzle-kit tries to alter custom policies                          | Try Drizzle's native policy definitions. If both approaches are unworkable, switch to Kysely plus plain SQL migrations.                                              |
| S2: clone p50 > 1 s                                                     | Use per-file truncation instead of cloned databases.                                                                                                                 |
| S2: `withTenant` p95 overhead > 2 ms, or the plan doesn't use the index | Investigate before Phase 2. Both would be surprising and would show the policy expression is wrong.                                                                  |
| S3: ESM OTel doesn't correlate                                          | Compile the API to CommonJS for production only, or use manual spans for pg. Re-evaluate in ADR-013.                                                                 |
| S3: SSE buffered even with `flush_interval -1`                          | Treat it as a proxy-configuration blocker for M5.5 and test the production load balancer separately.                                                                 |

## D. Architecture updates

None yet. Changes will only come from the rules above, applied to your results. The only adjustments so far come from the documentation, not from measurements: Node 24 as the runtime baseline, and moving the double-run handler test from S1 to M1.5.

## E. M1.1

Its scope and the enforcement design (ADR-021) are ready, and nothing in M1.1 depends on the spike results. Following your sequence, I'll start it after you share the results. If you'd rather run the spikes and M1.1 at the same time, tell me and I'll start M1.1 in the next response.

**Next step:** run the three kits and paste the `RESULT` lines, test output, drizzle-kit output and lockfile versions here. Include any errors exactly as they appear.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-09-25T15:40:05+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Gemini 3.8 Flash (High). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>
