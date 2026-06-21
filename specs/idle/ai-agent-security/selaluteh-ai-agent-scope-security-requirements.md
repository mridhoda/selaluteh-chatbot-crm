---
schema_version: 1
document_type: requirements
spec_id: selaluteh-ai-agent-scope-security
title: SelaluTeh AI Agent Scope Security and Cost Guard Requirements
status: draft
version: 1.0.0
updated_at: 2026-06-19
---

# Requirements Document: SelaluTeh AI Agent Scope Security and Cost Guard

## Introduction

Dokumen ini mendefinisikan kebutuhan fungsional dan non-fungsional khusus untuk **AI Agent Scope Security and Cost Guard** pada SelaluTeh / KALIS.AI.

Dokumen ini adalah spec baru dan terpisah dari:

```text
selaluteh-ai-agent-architecture
selaluteh-backend-marketplace
```

Dokumen ini tidak mendesain ulang:

```text
conversation memory
RAG ingestion internals
AI Orchestrator internals
Tool Gateway internals
product
cart
order
payment
complaint
notification
workspace
outlet
```

Dokumen ini hanya mengatur:

```text
business-domain confinement
scope classification
off-topic blocking
unsafe-request handling
small-talk limits
business-adjacent boundaries
RAG gating
tool gating
full-agent gating
repeated-misuse controls
scope profiles
scope analytics
cost-saving controls
scope-specific testing
```

Prinsip utama:

```text
Unknown is not automatically allowed.

Customer-facing AI is business-scoped.

Off-topic requests must not invoke RAG, tools, embeddings, or full AI Agent.

Custom agent instructions may narrow scope but may never expand platform maximum scope.

Tool Gateway remains the final authorization boundary.
```

---

# 1. Product Decisions

Keputusan berikut dianggap final untuk MVP.

## 1.1 Customer-Facing Scope

Customer-facing agent hanya boleh melayani:

```text
brand SelaluTeh
outlet
jam operasional
produk
varian
rasa
bahan
harga
availability
promo
rekomendasi
cart
order
Xendit payment
pickup
order status
payment status
complaint
ticket
refund policy
customer support
human handoff
```

Customer-facing agent tidak boleh menjadi general-purpose assistant.

## 1.2 Internal Agent Scope

Internal business agent boleh memiliki scope lebih luas untuk:

```text
business reports
campaign drafts
brand content
complaint summaries
operational analysis
business knowledge
```

Internal agent tetap tidak otomatis menjadi general-purpose assistant.

## 1.3 Business-Adjacent Topics

Topik adjacent boleh dilayani jika:

```text
membantu customer memahami atau memilih produk
dan
jawaban berasal dari official knowledge atau backend data
```

Contoh:

```text
coffee education
ingredients
allergens
caffeine
dietary information
taste comparison
preparation method
```

## 1.4 Small Talk

Small talk boleh.

Default:

```text
maximum consecutive small-talk turns: 1
redirect to business after response: true
```

## 1.5 Creative Requests

Customer-facing agent menolak creative request, termasuk yang terkait brand.

Creative brand work hanya tersedia pada internal/admin agent dengan policy profile yang sesuai.

## 1.6 Low-Confidence Behavior

Jika classifier tidak yakin:

```text
ask one narrow clarification
```

Jika setelah satu clarification masih tidak jelas:

```text
fixed scope redirect
```

## 1.7 Repeated Off-Topic Behavior

Default:

```text
first consecutive off-topic
→ friendly fixed refusal

second consecutive off-topic
→ shorter refusal and business redirect

third consecutive off-topic
→ 60-second cooldown

continued off-topic or abuse
→ increasing capped cooldown
```

Default maximum cooldown:

```text
5 minutes
```

## 1.8 Product Health Information

AI boleh menyampaikan official facts tentang:

```text
ingredients
allergens
caffeine
dietary information
```

AI tidak boleh:

```text
diagnose
give personal medical advice
guarantee allergy safety without official evidence
replace professional medical guidance
```

Alergi berat harus diarahkan ke outlet atau human agent.

## 1.9 Scope Configuration

Scope dikonfigurasi per agent melalui backend-owned policy profile.

Rule:

```text
platform maximum
→ profile maximum
→ agent-specific narrowing

agent may narrow
agent may never expand
```

---

# 2. Architectural Baseline

| Area | Decision |
|---|---|
| Enforcement model | Allowlist-based capability scope |
| Guard placement | Before RAG, tools, embeddings, and full agent |
| First layer | Deterministic pre-check |
| Second layer | Lightweight structured classifier |
| Final scope authority | Scope Policy Engine |
| Decisions | Business, adjacent, small talk, clarify, off-topic, unsafe |
| Unknown request | Clarify, not automatically allow |
| Off-topic response | Fixed deterministic template |
| Off-topic RAG | Disabled |
| Off-topic tools | Disabled |
| Off-topic full agent | Disabled |
| Unsafe tools | Always disabled |
| Small talk | Allowed and bounded |
| Adjacent product topics | Allowed from official knowledge |
| Repeated misuse | Cooldown and rate limiting |
| Scope profiles | Platform-owned and versioned |
| Agent customization | May narrow, never expand |
| Cost control | Tiered processing |
| Classifier model | Lightweight local structured classifier |
| Classifier context | Minimal and bounded |
| Trace | Decision, intent, confidence, reason, versions |
| Final action authorization | Existing Tool Gateway |

---

# 3. Scope

## 3.1 Included

```text
input safety pre-check
deterministic scope filter
lightweight scope classifier
scope policy engine
scope decision taxonomy
reason codes
business allowlist
adjacent-topic policy
small-talk policy
clarification policy
off-topic refusal
unsafe refusal
repeated off-topic counters
cooldown
scope profiles
agent scope narrowing
RAG gating
tool gating
embedding gating
full-agent gating
cost tiers
classifier token/time budget
scope decision trace
scope analytics
scope testing
shadow rollout
```

## 3.2 Excluded

```text
general content moderation platform
full AI Agent architecture
RAG ingestion implementation
Tool Gateway implementation
commerce domain implementation
payment domain implementation
human takeover implementation
general-purpose AI
model training
fraud detection platform
legal or medical decision engine
```

---

# 4. Glossary

- **Scope_Guard**: Komponen yang menentukan apakah customer request boleh masuk ke AI business flow.
- **Deterministic_Filter**: Rule-based layer tanpa model.
- **Scope_Classifier**: Lightweight model yang mengklasifikasikan domain request.
- **Scope_Policy_Engine**: Komponen backend yang mengambil keputusan final.
- **Policy_Profile**: Platform-owned scope policy yang dapat direferensikan agent.
- **Effective_Scope**: Hasil intersection antara platform maximum, profile, dan agent narrowing.
- **ALLOW_BUSINESS**: Request langsung terkait bisnis.
- **ALLOW_ADJACENT**: Request terkait produk tetapi bukan transaksi langsung.
- **ALLOW_SMALL_TALK**: Percakapan sosial singkat yang diizinkan.
- **CLARIFY**: Request ambigu yang membutuhkan satu pertanyaan klarifikasi.
- **DENY_OFF_TOPIC**: Request di luar domain bisnis.
- **DENY_UNSAFE**: Request yang mencoba bypass, exfiltration, atau action berbahaya.
- **Processing_Tier**: Tingkat biaya pemrosesan dari deterministic hingga full agent.
- **Fixed_Responder**: Template response tanpa full LLM.
- **Scope_Counter**: Counter small talk, off-topic, dan unsafe per session/chat.
- **Cost_Avoidance**: Resource yang tidak digunakan karena request ditolak sebelum full processing.

---

# 5. Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| AISS-R1 | Scope Guard Placement and Execution Order | P0 |
| AISS-R2 | Scope Decision Taxonomy | P0 |
| AISS-R3 | Deterministic Input Safety Pre-Check | P0 |
| AISS-R4 | Deterministic Scope Filter | P0 |
| AISS-R5 | Lightweight Scope Classifier | P0 |
| AISS-R6 | Scope Policy Engine | P0 |
| AISS-R7 | Business Domain Allowlist | P0 |
| AISS-R8 | Business-Adjacent Topic Boundary | P0 |
| AISS-R9 | Small-Talk Boundary | P0 |
| AISS-R10 | Ambiguous Message Clarification | P0 |
| AISS-R11 | Off-Topic Refusal | P0 |
| AISS-R12 | Unsafe Request Handling | P0 |
| AISS-R13 | Emotional Complaint Preservation | P0 |
| AISS-R14 | Repeated Off-Topic and Cooldown | P0 |
| AISS-R15 | Scope Policy Profiles | P0 |
| AISS-R16 | Agent Scope Configuration | P0 |
| AISS-R17 | Immutable Platform Maximum Scope | P0 |
| AISS-R18 | RAG and Embedding Gating | P0 |
| AISS-R19 | Tool Gating | P0 |
| AISS-R20 | Full-Agent Gating | P0 |
| AISS-R21 | Cost Processing Tiers | P0 |
| AISS-R22 | Classifier Context and Budget | P0 |
| AISS-R23 | Deterministic Response Templates | P0 |
| AISS-R24 | Scope Counters and Persistence | P0 |
| AISS-R25 | Scope Trace and Metrics | P0 |
| AISS-R26 | Admin Scope Configuration APIs | P1 |
| AISS-R27 | Scope Test and Preview APIs | P1 |
| AISS-R28 | Privacy and Data Minimization | P0 |
| AISS-R29 | Failure and Fail-Closed Behavior | P0 |
| AISS-R30 | Prompt Injection and Scope Expansion Defense | P0 |
| AISS-R31 | Rollout and Shadow Mode | P1 |
| AISS-R32 | Security and Evaluation Testing | P0 |
| AISS-R33 | Cost and Performance Testing | P0 |
| AISS-R34 | Scope Feedback and Improvement Loop | P1 |

---

# 6. Requirements

## AISS-R1: Scope Guard Placement and Execution Order

**Priority:** P0

**User Story:** Sebagai platform owner, saya ingin scope request diperiksa sebelum resource AI mahal digunakan.

### Acceptance Criteria

1. THE System SHALL menjalankan Scope_Guard sebelum:
   - RAG retrieval;
   - embedding query;
   - tool schema loading;
   - tool execution;
   - full AI Agent generation.
2. THE System SHALL menjalankan provider verification dan message deduplication sebelum Scope_Guard.
3. THE System SHALL menjalankan basic input safety sebelum scope classification.
4. THE System SHALL membaca human takeover state sebelum mengirim customer-facing response.
5. Active human takeover SHALL mencegah Scope_Guard menghasilkan customer-facing AI response.
6. THE Scope_Guard SHALL menghasilkan satu final scope decision per customer message.
7. THE Scope_Guard SHALL mencatat processing tier.
8. THE Scope_Guard SHALL bekerja untuk Telegram dan WhatsApp.
9. THE Scope_Guard SHALL bekerja tanpa memodifikasi domain commerce state.
10. THE Scope_Guard SHALL tidak menjadi replacement untuk Tool Gateway.
11. IF Scope_Guard gagal, THE System SHALL menggunakan fail-closed behavior.
12. THE System SHALL memiliki integration test yang membuktikan denied request tidak mencapai RAG, tools, atau full agent.
13. THE System SHALL memiliki trace correlation antara message, scope decision, dan AI run bila ada.
14. THE Scope_Guard SHALL dievaluasi untuk setiap customer turn.
15. Prior allowed decision SHALL tidak otomatis mengizinkan future turn.

---

## AISS-R2: Scope Decision Taxonomy

**Priority:** P0

**User Story:** Sebagai developer, saya ingin keputusan scope memiliki enum yang jelas dan stabil.

### Acceptance Criteria

1. THE Scope_Guard SHALL mendukung:
   - `ALLOW_BUSINESS`;
   - `ALLOW_ADJACENT`;
   - `ALLOW_SMALL_TALK`;
   - `CLARIFY`;
   - `DENY_OFF_TOPIC`;
   - `DENY_UNSAFE`.
2. Decision SHALL menggunakan enum resmi.
3. Unknown decision SHALL ditolak oleh validator.
4. Decision SHALL memiliki intent.
5. Decision SHALL memiliki confidence.
6. Decision SHALL memiliki approved reason code.
7. Decision SHALL memiliki classifier/policy version.
8. Decision SHALL memiliki processing tier.
9. Decision SHALL menentukan:
   - RAG allowed;
   - tools allowed;
   - full agent allowed;
   - fixed responder required.
10. `DENY_OFF_TOPIC` SHALL selalu menghasilkan:
    - no RAG;
    - no tools;
    - no full agent.
11. `DENY_UNSAFE` SHALL selalu menghasilkan:
    - no RAG;
    - no tools;
    - no full agent.
12. `ALLOW_SMALL_TALK` SHALL menggunakan no tools secara default.
13. `CLARIFY` SHALL tidak mengizinkan mutation tools.
14. Decision mapping SHALL unit-tested.
15. Decision serialization SHALL stable untuk trace dan APIs.

---

## AISS-R3: Deterministic Input Safety Pre-Check

**Priority:** P0

**User Story:** Sebagai platform, saya ingin request invalid atau abuse sederhana ditangani tanpa model call.

### Acceptance Criteria

1. THE System SHALL memiliki deterministic input pre-check.
2. Pre-check SHALL mendeteksi:
   - empty message;
   - oversized message;
   - malformed encoding;
   - unsupported binary;
   - known spam burst;
   - known platform command;
   - known callback action;
   - direct known security probe.
3. Pre-check SHALL tidak memanggil LLM.
4. Pre-check SHALL tidak memanggil RAG.
5. Pre-check SHALL tidak memanggil tools kecuali deterministic platform action yang sudah terotorisasi.
6. Oversized input SHALL menghasilkan safe bounded response.
7. Malformed input SHALL tidak diteruskan ke classifier.
8. Known callback SHALL dirutekan ke existing authorized action.
9. Spam signal SHALL memengaruhi rate-limit policy.
10. Pre-check SHALL tidak bergantung hanya pada keyword blacklist.
11. Pre-check SHALL menghasilkan auditable reason code.
12. Pre-check SHALL memiliki maximum execution latency target.
13. Pre-check failure SHALL fallback ke classifier atau fail closed sesuai error.
14. THE System SHALL memiliki unit tests untuk seluruh deterministic input cases.
15. THE System SHALL memiliki abuse test untuk repeated oversized messages.

---

## AISS-R4: Deterministic Scope Filter

**Priority:** P0

**User Story:** Sebagai owner, saya ingin request yang jelas dapat dirutekan tanpa classifier cost.

### Acceptance Criteria

1. THE System SHALL memiliki Deterministic_Scope_Filter.
2. Filter MAY classify high-confidence:
   - known business callback;
   - known order/payment quick action;
   - greeting;
   - thanks;
   - direct human handoff command;
   - known unsafe signature.
3. Filter SHALL conservative.
4. Filter SHALL tidak menggunakan keyword tunggal untuk complex topic classification.
5. Uncertain messages SHALL diteruskan ke classifier.
6. Filter SHALL menghasilkan confidence atau deterministic flag.
7. Filter decision SHALL tetap melalui Scope_Policy_Engine.
8. Filter SHALL tidak langsung menjalankan mutation tools.
9. Filter rules SHALL versioned.
10. Filter rules SHALL testable independently.
11. Filter SHALL support Bahasa Indonesia variants.
12. Filter SHALL support common informal spelling.
13. Filter SHALL avoid classifying angry complaint as unsafe only because of profanity.
14. Filter SHALL have false-positive regression tests.
15. Filter SHALL record deterministic hit metric.

---

## AISS-R5: Lightweight Scope Classifier

**Priority:** P0

**User Story:** Sebagai platform, saya ingin pesan yang tidak jelas diklasifikasikan oleh model kecil dan murah.

### Acceptance Criteria

1. THE System SHALL menyediakan lightweight structured classifier.
2. Classifier SHALL tidak memiliki tools.
3. Classifier SHALL tidak menjalankan RAG.
4. Classifier SHALL tidak memiliki database credentials.
5. Classifier SHALL menerima minimal context.
6. Classifier SHALL menggunakan strict JSON schema.
7. Classifier SHALL menggunakan approved decisions dan intents.
8. Classifier SHALL menghasilkan confidence 0–1.
9. Classifier SHALL menghasilkan approved reason code.
10. Classifier SHALL tidak menghasilkan chain-of-thought untuk persistence.
11. Classifier SHALL memiliki configurable model.
12. Default classifier SHOULD menggunakan local model.
13. Classifier SHALL memiliki low temperature.
14. Classifier SHALL memiliki short timeout.
15. Classifier SHALL memiliki maximum output tokens.
16. Classifier SHALL tidak menerima full conversation history.
17. Classifier SHALL tidak menerima full customer memory.
18. Classifier SHALL tidak menerima full tool schema.
19. Classifier SHALL tidak menerima RAG documents.
20. Classifier SHALL tidak menerima secrets.
21. Malformed output SHALL diproses oleh validator.
22. Malformed output MAY retry sekali.
23. Repeated malformed output SHALL fallback ke `CLARIFY`.
24. Classifier provider/model/version SHALL dicatat.
25. Classifier SHALL memiliki deterministic fake untuk CI.
26. Classifier SHALL memiliki local-model sandbox tests.
27. Classifier SHALL memiliki adversarial tests.
28. Classifier failure SHALL tidak otomatis menjalankan full agent.
29. Classifier input/output token usage SHALL dicatat bila tersedia.
30. Classifier SHALL support cancellation.

---

## AISS-R6: Scope Policy Engine

**Priority:** P0

**User Story:** Sebagai owner, saya ingin backend menentukan keputusan final, bukan classifier saja.

### Acceptance Criteria

1. THE System SHALL memiliki Scope_Policy_Engine.
2. Classifier SHALL hanya mengusulkan keputusan.
3. Policy Engine SHALL menghasilkan final decision.
4. Policy Engine SHALL mempertimbangkan:
   - classifier output;
   - deterministic signals;
   - policy profile;
   - agent narrowing;
   - confidence;
   - recent scope counters;
   - commerce state labels;
   - human takeover state;
   - security signals.
5. Policy Engine SHALL override allowed decision yang mencoba forbidden action.
6. Payment mutation request SHALL selalu menjadi denied unsafe.
7. Cross-workspace data request SHALL selalu menjadi denied unsafe.
8. Small-talk limit exceeded SHALL mengubah route ke redirect/refusal.
9. Low-confidence request SHALL menjadi clarify.
10. Policy Engine SHALL menggunakan platform maximum.
11. Policy Engine SHALL tidak dapat dikonfigurasi off oleh agent.
12. Policy Engine SHALL produce:
    - decision;
    - intent;
    - reason code;
    - processing tier;
    - RAG permission;
    - tool permission;
    - full-agent permission;
    - response strategy.
13. Policy Engine SHALL deterministic for same validated inputs.
14. Policy Engine SHALL versioned.
15. Policy Engine SHALL unit-tested for all decision branches.
16. Policy Engine SHALL property-tested that denied decisions never enable RAG/tools/full agent.
17. Policy Engine failure SHALL fail closed.
18. Policy Engine SHALL not mutate commerce state.
19. Policy Engine SHALL record override reason.
20. Policy Engine SHALL remain framework-independent.

---

## AISS-R7: Business Domain Allowlist

**Priority:** P0

**User Story:** Sebagai business owner, saya ingin customer-facing AI hanya melayani capability bisnis resmi.

### Acceptance Criteria

1. THE platform maximum customer scope SHALL include:
   - brand;
   - outlet;
   - product;
   - recommendation;
   - cart;
   - order;
   - payment;
   - pickup;
   - complaint;
   - ticket;
   - refund policy;
   - customer support;
   - human handoff.
2. Unknown category SHALL tidak otomatis allowed.
3. Price SHALL tetap melalui authoritative tool/backend.
4. Stock SHALL tetap melalui authoritative tool/backend.
5. Availability SHALL tetap melalui authoritative tool/backend.
6. Promo aktif SHALL tetap melalui authoritative backend/knowledge.
7. Payment status SHALL tetap melalui backend.
8. Order status SHALL tetap melalui backend.
9. Customer-facing agent SHALL menolak general coding.
10. Customer-facing agent SHALL menolak unrelated homework.
11. Customer-facing agent SHALL menolak unrelated general knowledge.
12. Customer-facing agent SHALL menolak unrelated creative tasks.
13. Business capability list SHALL versioned.
14. Capability expansion SHALL membutuhkan approved platform change.
15. Agent MAY disable capability.
16. Agent SHALL not add capability outside platform maximum.
17. Business intent classification SHALL account for recent context.
18. Angry customer business request SHALL tetap allowed.
19. Business request SHALL route ke existing AI Agent architecture.
20. Business allowlist SHALL memiliki evaluation suite.

---

## AISS-R8: Business-Adjacent Topic Boundary

**Priority:** P0

**User Story:** Sebagai customer, saya ingin informasi pendukung produk tanpa membuka chatbot menjadi AI umum.

### Acceptance Criteria

1. THE System SHALL support `ALLOW_ADJACENT`.
2. Adjacent topics MAY include:
   - coffee education;
   - ingredients;
   - allergens;
   - caffeine;
   - dietary information;
   - taste comparison;
   - preparation method.
3. Adjacent response SHALL terkait dengan product/customer decision.
4. Adjacent response SHALL menggunakan official knowledge atau backend data.
5. Adjacent response SHALL tidak menggunakan unsupported general knowledge as authority.
6. Allergen claims SHALL berasal dari official source.
7. Cross-contamination uncertainty SHALL diungkapkan bila applicable.
8. AI SHALL tidak menjamin allergy safety tanpa evidence.
9. AI SHALL tidak memberi personal medical diagnosis.
10. AI SHALL tidak memberi personal medical dosage advice.
11. AI SHALL tidak memberi unsupported halal/vegan certification.
12. Serious allergy SHALL diarahkan ke outlet/human.
13. Emergency language SHALL diarahkan ke appropriate emergency help.
14. Adjacent route SHALL menggunakan constrained RAG.
15. Adjacent route SHALL tidak mengizinkan mutation tools by default.
16. Adjacent route SHALL memiliki maximum consecutive turns.
17. Default maximum adjacent-only turns SHALL 2.
18. Adjacent limit exceeded SHALL redirect to product/customer service.
19. Agent MAY narrow adjacent topics.
20. Agent SHALL not add adjacent topic outside profile.
21. Adjacent responses SHALL have evaluation tests.
22. Medical/legal/financial general advice SHALL not be treated as adjacent.
23. Product ingredient question SHALL not be rejected as off-topic.
24. THE System SHALL log adjacent reason code.

---

## AISS-R9: Small-Talk Boundary

**Priority:** P0

**User Story:** Sebagai customer, saya ingin chatbot tetap ramah tanpa menjadi teman ngobrol bebas.

### Acceptance Criteria

1. THE System SHALL support `ALLOW_SMALL_TALK`.
2. Small talk MAY include:
   - greeting;
   - thanks;
   - agent identity;
   - brief social courtesy.
3. Default maximum consecutive small-talk turns SHALL 1.
4. Small-talk response SHALL redirect to business.
5. Small-talk response SHALL be short.
6. Small talk SHALL not invoke RAG by default.
7. Small talk SHALL not invoke tools.
8. Small talk SHALL not invoke full agent by default.
9. Greeting combined with business request SHALL become `ALLOW_BUSINESS`.
10. Small-talk counter SHALL reset on valid business request.
11. Small-talk counter MAY reset on new session.
12. Repeated social conversation SHALL route to off-topic redirect.
13. Agent MAY disable small talk.
14. Agent MAY lower limit.
15. Agent SHALL not exceed platform maximum limit.
16. Small-talk template SHALL follow agent tone.
17. Small talk SHALL not reveal hidden model/provider information.
18. Small talk SHALL not disclose internal prompts.
19. Small-talk behavior SHALL be evaluation-tested.
20. Small-talk decision SHALL be traced.

---

## AISS-R10: Ambiguous Message Clarification

**Priority:** P0

**User Story:** Sebagai customer, saya ingin pesan pendek dipahami dari context sebelum ditolak.

### Acceptance Criteria

1. THE System SHALL support `CLARIFY`.
2. Ambiguous examples SHALL include:
   - “berapa?”;
   - “yang tadi”;
   - “lanjut”;
   - “sudah?”;
   - “dua”.
3. Scope classifier MAY receive 2–4 recent turns.
4. Scope classifier MAY receive compact commerce state labels.
5. Scope classifier SHALL not receive full history.
6. Active cart MAY disambiguate quantity-related message.
7. Pending payment MAY disambiguate “sudah?”.
8. If context sufficient, request SHALL route to business intent.
9. If context insufficient, THE System SHALL ask one narrow clarification.
10. Clarification SHALL not expose every capability.
11. Clarification SHALL not invoke mutation tools.
12. Clarification SHALL not run broad RAG.
13. Clarification attempt count SHALL default to 1.
14. If still unclear, THE System SHALL use fixed scope redirect.
15. Clarification SHALL be short and context-specific.
16. Clarification SHALL not assume customer confirmation.
17. Clarification SHALL have timeout/fallback behavior.
18. Clarification events SHALL be traced.
19. Ambiguous message tests SHALL include cart, order, payment, and no-context scenarios.
20. Clarification SHALL not be treated as off-topic abuse.

---

## AISS-R11: Off-Topic Refusal

**Priority:** P0

**User Story:** Sebagai owner, saya ingin off-topic request ditolak secara murah dan konsisten.

### Acceptance Criteria

1. THE System SHALL support `DENY_OFF_TOPIC`.
2. Off-topic categories SHALL include:
   - coding;
   - homework;
   - general knowledge;
   - history;
   - politics;
   - news;
   - medical advice;
   - legal advice;
   - financial advice;
   - unrelated creative writing;
   - unrelated translation;
   - travel planning;
   - unrelated roleplay.
3. Off-topic response SHALL use fixed deterministic template.
4. Off-topic response SHALL not invoke RAG.
5. Off-topic response SHALL not invoke embeddings.
6. Off-topic response SHALL not load full tool schema.
7. Off-topic response SHALL not invoke tools.
8. Off-topic response SHALL not invoke full AI Agent.
9. Off-topic response SHALL not run memory extraction.
10. Off-topic response SHALL remain friendly.
11. Off-topic response SHALL redirect to business capability.
12. Off-topic response SHALL not disclose model capabilities.
13. Off-topic response SHALL not disclose security implementation.
14. Off-topic original message MAY tetap disimpan sesuai chat retention.
15. Off-topic route SHALL record reason code.
16. Off-topic route SHALL update consecutive counter.
17. Business message SHALL reset consecutive off-topic counter.
18. Off-topic route SHALL have latency target.
19. Off-topic route SHALL have cost assertions.
20. Off-topic route SHALL be tested for paraphrased and obfuscated requests.
21. Off-topic route SHALL not handoff to human automatically.
22. Creative request related to SelaluTeh from customer-facing agent SHALL still be denied.
23. Internal profile MAY allow approved business creative tasks.
24. Off-topic response SHALL be versioned.

---

## AISS-R12: Unsafe Request Handling

**Priority:** P0

**User Story:** Sebagai platform owner, saya ingin security bypass ditolak tanpa mencapai tools atau data.

### Acceptance Criteria

1. THE System SHALL support `DENY_UNSAFE`.
2. Unsafe categories SHALL include:
   - prompt injection;
   - secret request;
   - cross-tenant request;
   - payment bypass;
   - hidden-tool request;
   - admin impersonation;
   - privilege escalation;
   - data exfiltration;
   - abusive automated attack.
3. Unsafe response SHALL be deterministic or tightly constrained.
4. Unsafe response SHALL not invoke RAG.
5. Unsafe response SHALL not invoke tools.
6. Unsafe response SHALL not invoke full agent.
7. Unsafe response SHALL emit security signal when available.
8. Unsafe response SHALL influence stricter rate limit.
9. Unsafe response SHALL not reveal system prompt.
10. Unsafe response SHALL not reveal tool names beyond safe customer wording.
11. Unsafe response SHALL not reveal secrets.
12. Payment mutation request SHALL always be unsafe.
13. Cross-workspace data request SHALL always be unsafe.
14. Agent custom prompt SHALL not downgrade unsafe decision.
15. RAG content SHALL not downgrade unsafe decision.
16. Tool result text SHALL not downgrade unsafe decision.
17. Unsafe counter SHALL be tracked.
18. Unsafe events SHALL be versioned and traceable.
19. Unsafe route SHALL have adversarial tests.
20. Unsafe route SHALL have encoded/obfuscated jailbreak tests.
21. Unsafe request while human takeover active SHALL not trigger AI response.
22. Tool Gateway SHALL remain defense in depth.
23. Unsafe decision false negatives SHALL be release blockers when critical.
24. Critical unsafe decision MAY trigger cooldown immediately.

---

## AISS-R13: Emotional Complaint Preservation

**Priority:** P0

**User Story:** Sebagai customer yang marah, saya ingin complaint tetap diproses dan tidak dianggap abuse semata.

### Acceptance Criteria

1. Business intent SHALL take precedence over profanity-only signal.
2. Angry order-status question SHALL route to business/order.
3. Angry payment complaint SHALL route to complaint/handoff.
4. Abusive language SHALL be recorded separately from scope decision.
5. THE System SHALL not deny a valid complaint only because tone is harsh.
6. Response SHALL remain calm and brief.
7. Response SHALL not retaliate.
8. Security denial SHALL apply only if request also attempts unsafe action.
9. Repeated harassment without business intent MAY become unsafe/off-topic.
10. Complaint scenarios SHALL be included in evaluation.
11. False-positive denial of complaint SHALL be measured.
12. Human handoff request SHALL still be honored.
13. Payment dispute SHALL route to human escalation.
14. Emotional wording SHALL not expand tool permissions.
15. Complaint route SHALL not bypass existing human takeover rules.

---

## AISS-R14: Repeated Off-Topic and Cooldown

**Priority:** P0

**User Story:** Sebagai owner, saya ingin repeated misuse dibatasi tanpa membebani CS.

### Acceptance Criteria

1. THE System SHALL track consecutive off-topic attempts.
2. First consecutive off-topic SHALL use friendly refusal.
3. Second consecutive off-topic SHALL use shorter refusal.
4. Third consecutive off-topic SHALL trigger cooldown.
5. Default cooldown SHALL 60 seconds.
6. Maximum Scope Guard cooldown SHALL 5 minutes.
7. Continued abuse MAY increase cooldown.
8. Valid business message SHALL reset off-topic counter.
9. Small talk SHALL have separate counter.
10. Unsafe SHALL have separate counter.
11. Cooldown SHALL not block critical transactional notification.
12. Cooldown SHALL not handoff to human automatically.
13. Cooldown response SHALL not invoke classifier/full agent if already active.
14. Cooldown state SHALL be race-safe.
15. Cooldown SHALL be scoped per contact/chat/workspace.
16. Cooldown SHALL not cross workspace.
17. Counter update SHALL be idempotent.
18. Parallel off-topic messages SHALL not corrupt count.
19. Counter storage failure SHALL not disable unsafe checks.
20. Admin MAY view current cooldown state with permission.
21. Cooldown metrics SHALL be recorded.
22. Cooldown policy SHALL be versioned.
23. Rate-limit integration SHALL be supported.
24. Tests SHALL cover reset, expiry, concurrency, and max cap.

---

## AISS-R15: Scope Policy Profiles

**Priority:** P0

**User Story:** Sebagai platform owner, saya ingin menyediakan profile scope resmi yang aman.

### Acceptance Criteria

1. THE System SHALL menyediakan backend-owned policy profiles.
2. Minimum profiles SHOULD include:
   - `customer_commerce_strict`;
   - `product_advisor`;
   - `customer_support`;
   - `internal_business_copilot`.
3. Profile SHALL memiliki version.
4. Profile SHALL memiliki platform-approved capabilities.
5. Profile SHALL memiliki adjacent topics.
6. Profile SHALL memiliki small-talk policy.
7. Profile SHALL memiliki ambiguity policy.
8. Profile SHALL memiliki off-topic policy.
9. Profile SHALL memiliki repeated-attempt policy.
10. Profile SHALL memiliki classifier budget.
11. Profile SHALL memiliki RAG/tool/full-agent gating policy.
12. Profile SHALL immutable per published version.
13. Profile SHALL code-owned or platform-controlled.
14. Workspace admin SHALL not create arbitrary platform-maximum profile.
15. New profile SHALL require platform approval.
16. Profile change SHALL trigger evaluation.
17. Agent config SHALL reference profile ID/version.
18. Missing profile SHALL fail safe.
19. Archived profile SHALL not be assigned to new agent version.
20. Historical runs SHALL retain old profile reference.
21. Profile APIs SHALL not expose secrets.
22. Profile list SHALL include safe description.

---

## AISS-R16: Agent Scope Configuration

**Priority:** P0

**User Story:** Sebagai owner, saya ingin mengatur scope per agent tanpa bisa melewati batas platform.

### Acceptance Criteria

1. Agent SHALL reference one policy profile.
2. Agent MAY disable allowed intents.
3. Agent MAY disable adjacent topics.
4. Agent MAY lower small-talk limit.
5. Agent MAY lower classifier budget.
6. Agent MAY strengthen off-topic response.
7. Agent SHALL not add capability absent from profile.
8. Agent SHALL not increase maximum beyond profile.
9. Agent SHALL not disable unsafe checks.
10. Agent SHALL not enable tools for off-topic.
11. Agent SHALL not enable RAG for off-topic.
12. Agent SHALL not enable full agent for off-topic.
13. Agent SHALL not grant payment mutation.
14. Agent scope config SHALL be versioned with agent version.
15. Agent scope config update SHALL require authorization.
16. Update SHALL validate effective scope.
17. Invalid expansion SHALL be rejected.
18. Scope change SHALL require evaluation before publish.
19. Agent test mode SHALL show effective scope.
20. Agent historical run SHALL record effective profile/version.
21. Agent scope MAY differ by customer-facing vs internal classification.
22. Customer-facing agent SHALL use strict-compatible profile.
23. Internal agent SHALL use approved business-only profile.
24. Agent prompt SHALL not be used as scope authority.
25. Agent scope APIs SHALL use optimistic concurrency.

---

## AISS-R17: Immutable Platform Maximum Scope

**Priority:** P0

**User Story:** Sebagai platform owner, saya ingin batas tertinggi scope tidak dapat diubah oleh tenant atau model.

### Acceptance Criteria

1. Platform maximum scope SHALL be code-owned and versioned.
2. Platform maximum SHALL outrank:
   - workspace prompt;
   - agent instruction;
   - classifier recommendation;
   - RAG content;
   - tool result text.
3. Agent MAY only narrow effective scope.
4. Workspace MAY only narrow effective scope.
5. Effective scope SHALL be intersection of:
   - platform maximum;
   - profile;
   - agent narrowing.
6. Scope expansion attempt SHALL fail validation.
7. Scope expansion attempt SHALL be audited.
8. Platform maximum SHALL include immutable payment restrictions.
9. Platform maximum SHALL include immutable cross-workspace restrictions.
10. Platform maximum SHALL include immutable unsafe handling.
11. Platform maximum SHALL include immutable denied-route gating.
12. Platform maximum SHALL not be disableable from admin UI.
13. Platform maximum version SHALL be traced.
14. Changes SHALL require code review and security evaluation.
15. Changes SHALL not silently apply to published agents without compatibility handling.
16. Property tests SHALL verify effective scope never exceeds maximum.
17. Prompt injection SHALL not change maximum.
18. RAG injection SHALL not change maximum.
19. External provider SHALL receive resolved scope, not authority to redefine it.
20. Scope maximum SHALL remain independent of LangChain/LangGraph.

---

## AISS-R18: RAG and Embedding Gating

**Priority:** P0

**User Story:** Sebagai owner, saya ingin denied request tidak memboroskan retrieval dan tidak mengambil knowledge.

### Acceptance Criteria

1. RAG MAY run only for:
   - `ALLOW_BUSINESS`;
   - `ALLOW_ADJACENT`.
2. RAG SHALL not run for:
   - `ALLOW_SMALL_TALK` by default;
   - `CLARIFY` by default;
   - `DENY_OFF_TOPIC`;
   - `DENY_UNSAFE`.
3. Embedding query SHALL not run for denied decisions.
4. Scope intent SHALL constrain retrieval category.
5. Allergen intent SHALL retrieve official product/allergen sources only.
6. Payment intent SHALL retrieve approved payment instruction sources only.
7. Complaint intent SHALL retrieve approved complaint/refund policy sources only.
8. Retrieved content SHALL not expand scope.
9. Retrieved instruction SHALL be treated as untrusted data.
10. RAG gating SHALL occur before retriever invocation.
11. RAG invocation status SHALL be recorded.
12. Denied request SHALL assert `rag_invoked = false`.
13. Retrieval failure SHALL not broaden scope.
14. RAG no-result SHALL follow existing grounded no-answer policy.
15. RAG scope SHALL remain workspace/outlet/agent constrained.
16. Scope Guard SHALL not bypass existing RAG security.
17. Integration tests SHALL spy/assert no RAG call for denied request.
18. Cost tests SHALL count avoided retrievals.
19. Adjacent route SHALL have lower top-K/context budget.
20. RAG gating policy SHALL be versioned.

---

## AISS-R19: Tool Gating

**Priority:** P0

**User Story:** Sebagai owner, saya ingin only allowed business request dapat mengakses tool yang sesuai.

### Acceptance Criteria

1. Tool availability SHALL depend on final scope decision.
2. `ALLOW_BUSINESS` MAY receive intent-specific tools.
3. `ALLOW_ADJACENT` SHALL receive read-only product-information tools only by default.
4. `ALLOW_SMALL_TALK` SHALL receive no tools.
5. `CLARIFY` SHALL receive no mutation tools.
6. `DENY_OFF_TOPIC` SHALL receive no tools.
7. `DENY_UNSAFE` SHALL receive no tools.
8. Tool schema SHALL not be loaded for denied requests.
9. Tool Gateway SHALL remain final authorization.
10. Scope Guard SHALL not replace agent allowlist.
11. Scope Guard SHALL not replace workspace/outlet validation.
12. Payment mutation SHALL remain impossible.
13. Tool gating decision SHALL be traced.
14. Denied decision SHALL assert `tools_invoked = false`.
15. Misclassified allowed request SHALL still be protected by Tool Gateway.
16. Agent custom scope SHALL not add tools.
17. Tool result SHALL not expand future scope.
18. Tool-call attempt after denied decision SHALL be critical error.
19. Critical alert SHALL be emitted if tool executes after denied decision.
20. Security tests SHALL cover hidden-tool request and aliases.
21. Read-only adjacent tool result SHALL be official-data scoped.
22. Tool gating SHALL be deterministic after final scope decision.

---

## AISS-R20: Full-Agent Gating

**Priority:** P0

**User Story:** Sebagai owner, saya ingin full model hanya dipakai saat benar-benar dibutuhkan.

### Acceptance Criteria

1. Full customer-facing agent MAY run for `ALLOW_BUSINESS`.
2. Constrained agent MAY run for `ALLOW_ADJACENT`.
3. Full agent SHALL not run for fixed small talk.
4. Full agent SHALL not run for fixed clarification.
5. Full agent SHALL not run for off-topic.
6. Full agent SHALL not run for unsafe.
7. Full agent SHALL not run during cooldown.
8. Full agent gating SHALL occur before context building yang mahal.
9. Full agent SHALL receive final scope metadata.
10. Full agent SHALL not broaden scope decision.
11. Full agent prompt SHALL include effective scope.
12. Full agent invocation SHALL be recorded.
13. Denied decision SHALL assert `full_agent_invoked = false`.
14. Cost analytics SHALL calculate full-agent calls avoided.
15. Full-agent gate failure SHALL fail closed.
16. Human takeover SHALL still suppress output.
17. Full-agent route SHALL retain existing bounded loop.
18. Full-agent route SHALL retain existing Tool Gateway.
19. Scope classifier SHALL not be reused as full agent automatically.
20. Integration tests SHALL prove off-topic does not reach orchestrator.

---

## AISS-R21: Cost Processing Tiers

**Priority:** P0

**User Story:** Sebagai owner, saya ingin setiap request menggunakan processing tier paling murah yang cukup.

### Acceptance Criteria

1. THE System SHALL define processing tiers:
   - Tier 0 deterministic;
   - Tier 1 lightweight classifier;
   - Tier 2 constrained adjacent;
   - Tier 3 full business agent.
2. Tier 0 SHALL use:
   - no LLM;
   - no RAG;
   - no embeddings;
   - no tools.
3. Tier 1 SHALL use:
   - small context;
   - small output;
   - no tools;
   - no RAG.
4. Tier 2 SHALL use:
   - limited RAG;
   - limited output;
   - read-only official-data tools only.
5. Tier 3 MAY use:
   - business context;
   - RAG;
   - Tool Gateway;
   - bounded orchestration.
6. Policy Engine SHALL choose lowest sufficient tier.
7. Decision SHALL record chosen tier.
8. Tier SHALL control budgets.
9. Tier SHALL not weaken security.
10. Tier 0 fixed response SHALL be default for known denied cases.
11. Tier 1 SHALL be default for uncertain scope.
12. Tier 2 SHALL not access mutation tools.
13. Tier 3 SHALL still obey Tool Gateway.
14. Tier misconfiguration SHALL fail validation.
15. Cost metrics SHALL aggregate by tier.
16. Performance tests SHALL measure each tier.
17. Admin preview SHALL display estimated tier.
18. Agent MAY lower maximum tier for specific intent.
19. Agent SHALL not elevate denied intent to Tier 3.
20. Tier policy SHALL be versioned.

---

## AISS-R22: Classifier Context and Budget

**Priority:** P0

**User Story:** Sebagai owner, saya ingin classifier tetap murah dan tidak menerima data berlebihan.

### Acceptance Criteria

1. Default classifier recent-turn limit SHALL 4.
2. Agent/profile MAY lower limit.
3. Classifier SHALL receive only required recent turns.
4. Classifier SHALL receive compact commerce-state labels only.
5. Classifier SHALL not receive full product catalog.
6. Classifier SHALL not receive full RAG sources.
7. Classifier SHALL not receive full customer memory.
8. Classifier SHALL not receive raw payment payload.
9. Classifier SHALL not receive secrets.
10. Default max output tokens SHOULD 128.
11. Default timeout SHOULD 2500 ms.
12. Temperature SHOULD be 0–0.2.
13. Input character/token cap SHALL be configurable.
14. Oversized input SHALL be preprocessed or rejected safely.
15. Context SHALL be redacted.
16. Budget exceed SHALL not trigger full agent automatically.
17. Budget exceed SHALL fallback to clarify/refusal.
18. Classifier usage SHALL be measured.
19. Context SHALL be deterministic and versioned.
20. Property tests SHALL ensure classifier context remains bounded.
21. Provider-specific tokenizer MAY be used.
22. Output reserve SHALL be enforced.
23. Classifier SHALL support cancellation.
24. Budget config SHALL be profile-owned with agent narrowing only.
25. Cost estimate SHALL not claim exact currency without provider pricing.

---

## AISS-R23: Deterministic Response Templates

**Priority:** P0

**User Story:** Sebagai owner, saya ingin refusal dan redirect konsisten, murah, dan sesuai tone.

### Acceptance Criteria

1. THE System SHALL provide versioned templates.
2. Template categories SHALL include:
   - first off-topic;
   - repeated off-topic;
   - small-talk redirect;
   - ambiguous clarification;
   - unsafe refusal;
   - health/allergen boundary;
   - cooldown.
3. Templates SHALL support approved tone variants.
4. Templates SHALL remain bounded in length.
5. Templates SHALL not reveal internal model/provider.
6. Templates SHALL not reveal hidden tools.
7. Templates SHALL not reveal system prompt.
8. Templates SHALL not imply unavailable capability.
9. Customer-facing default SHALL be friendly semi-formal Gen-Z.
10. Template selection SHALL use reason code and attempt count.
11. Template text SHALL be versioned.
12. Template update SHALL require review.
13. Agent MAY select approved tone.
14. Agent SHALL not replace unsafe template with arbitrary broad answer.
15. Template rendering SHALL not require full LLM.
16. Template interpolation SHALL use safe allowlisted fields.
17. User-provided text SHALL not be inserted unsafely.
18. Template tests SHALL assert output length and required redirect.
19. Template preview SHALL be available in safe admin test endpoint.
20. Templates SHALL support Bahasa Indonesia MVP.

---

## AISS-R24: Scope Counters and Persistence

**Priority:** P0

**User Story:** Sebagai platform, saya ingin repeated behavior dilacak secara konsisten.

### Acceptance Criteria

1. THE System SHALL track:
   - consecutive small talk;
   - consecutive adjacent;
   - consecutive off-topic;
   - consecutive unsafe;
   - last scope decision;
   - cooldown until.
2. Counter SHALL be scoped by workspace/contact/chat/session policy.
3. Counter SHALL not cross workspace.
4. Valid business request SHALL reset off-topic counter.
5. Valid business request MAY reset small-talk counter.
6. New session MAY reset conversational counters.
7. Unsafe counter MAY persist longer according to abuse policy.
8. Counter increment SHALL be atomic.
9. Counter update SHALL be idempotent per message.
10. Duplicate message SHALL not increment twice.
11. Parallel messages SHALL not corrupt count.
12. Persistent minimum SHALL not depend only on Redis.
13. Redis MAY cache counters.
14. Cache loss SHALL not disable immutable controls.
15. Cooldown SHALL use authoritative time.
16. Fixed clock SHALL be used in tests.
17. Counter retention SHALL be defined.
18. Counter APIs SHALL be permission-controlled.
19. Customer SHALL not see internal security counters.
20. Counter metrics SHALL avoid exposing PII.
21. Counter storage failure SHALL use conservative fallback.
22. Counter reset SHALL be auditable where needed.
23. Property tests SHALL verify non-negative counters.
24. Concurrency tests SHALL verify race safety.

---

## AISS-R25: Scope Trace and Metrics

**Priority:** P0

**User Story:** Sebagai admin, saya ingin memahami keputusan scope dan penghematan resource.

### Acceptance Criteria

1. THE System SHALL record:
   - workspace;
   - chat;
   - message;
   - agent/version;
   - policy profile/version;
   - decision;
   - intent;
   - confidence;
   - reason code;
   - classifier provider/model/version;
   - deterministic filter hit;
   - processing tier;
   - RAG invoked;
   - tools invoked;
   - full agent invoked;
   - counters;
   - latency;
   - estimated tokens.
2. THE System SHALL not persist hidden chain-of-thought.
3. Trace SHALL be redacted.
4. Trace SHALL be workspace-scoped.
5. Trace SHALL have retention.
6. Trace SHALL correlate to AI run when full agent runs.
7. Denied request MAY have scope trace without AI run.
8. Metrics SHALL include:
   - deterministic rate;
   - classifier rate;
   - allow rate;
   - adjacent rate;
   - small-talk rate;
   - clarify rate;
   - off-topic rate;
   - unsafe rate;
   - low-confidence rate;
   - full-agent calls avoided;
   - RAG calls avoided;
   - tool calls avoided;
   - estimated tokens saved.
9. Metrics SHALL not claim exact monetary saving without reliable pricing.
10. Metrics SHALL avoid high-cardinality raw customer text.
11. Critical alert SHALL fire if RAG/tools/full agent run after denied decision.
12. Trace API SHALL require permission.
13. Cross-workspace trace access SHALL be denied.
14. Customer SHALL not access internal scope trace.
15. Classifier latency SHALL be measured.
16. Deterministic filter latency SHALL be measured.
17. False-positive and false-negative feedback SHALL be measurable.
18. Trace write failure SHALL not block safe refusal.
19. Trace schema SHALL be versioned.
20. Retention cleanup SHALL be tested.

---

## AISS-R26: Admin Scope Configuration APIs

**Priority:** P1

**User Story:** Sebagai admin, saya ingin mengatur scope agent secara aman.

### Acceptance Criteria

1. THE System SHOULD provide:
   - `GET /api/ai-scope/profiles`;
   - `GET /api/ai-scope/profiles/:profileId`;
   - `GET /api/agents/:agentId/scope`;
   - `PUT /api/agents/:agentId/scope`.
2. API SHALL be workspace-scoped.
3. API SHALL require role permission.
4. API SHALL expose safe profile description.
5. API SHALL not expose hidden security implementation.
6. API SHALL validate profile assignment.
7. API SHALL reject scope expansion.
8. API SHALL support agent narrowing.
9. API SHALL support optimistic concurrency.
10. API SHALL audit changes.
11. API SHALL not return provider credentials.
12. API SHALL not allow disabling unsafe checks.
13. API SHALL not allow enabling RAG/tools/full agent for denied routes.
14. API SHALL return effective scope preview.
15. API SHALL return validation errors with stable codes.
16. Published agent scope SHALL be immutable with versioning.
17. Scope changes SHALL create new agent version.
18. Internal vs customer-facing classification SHALL be validated.
19. Customer-facing agent SHALL require strict-compatible profile.
20. API SHALL have integration/security tests.

---

## AISS-R27: Scope Test and Preview APIs

**Priority:** P1

**User Story:** Sebagai admin, saya ingin menguji scope sebelum agent dipublish.

### Acceptance Criteria

1. THE System SHOULD provide:
   - `POST /api/agents/:agentId/scope/test`.
2. Test input MAY include:
   - message;
   - recent turns;
   - compact commerce fixture.
3. Test output SHALL include:
   - decision;
   - intent;
   - confidence;
   - reason code;
   - processing tier;
   - RAG allowed;
   - tools allowed;
   - full agent allowed;
   - template preview.
4. Test endpoint SHALL have no production side effect.
5. Test endpoint SHALL not execute mutation tools.
6. Test endpoint SHALL not create order/payment.
7. Test endpoint SHALL use selected agent draft/version.
8. Test endpoint SHALL be permission-controlled.
9. Test endpoint SHALL be workspace-scoped.
10. Test endpoint SHALL redact sensitive data.
11. Test endpoint SHALL have rate limit.
12. Test endpoint SHALL support deterministic fake classifier in automated tests.
13. Test result MAY be linked to evaluation.
14. Test endpoint SHALL not reveal hidden prompt.
15. Test endpoint SHALL have API integration tests.
16. Test endpoint SHALL report classifier timeout/malformed output safely.
17. Test endpoint SHALL display profile/version.
18. Test endpoint SHALL not claim production behavior if live model differs.
19. Test endpoint SHALL support batch evaluation separately.
20. Test endpoint SHALL be auditable.

---

## AISS-R28: Privacy and Data Minimization

**Priority:** P0

**User Story:** Sebagai customer, saya ingin scope classification menggunakan data minimum.

### Acceptance Criteria

1. Classifier SHALL receive only minimum data needed.
2. Classifier SHALL not receive full order history.
3. Classifier SHALL not receive full contact profile.
4. Classifier SHALL not receive address.
5. Classifier SHALL not receive payment secrets.
6. Classifier SHALL not receive unrelated memories.
7. Classifier SHALL not receive hidden admin data.
8. Scope trace SHALL store metadata, not hidden reasoning.
9. Raw message retention SHALL follow chat policy.
10. Analytics SHOULD avoid raw text.
11. Logs SHALL redact secrets.
12. External provider fallback SHALL not receive restricted scope data without policy.
13. Scope cache key SHALL not store raw sensitive text.
14. Cache SHALL use safe normalized hash/fingerprint when used.
15. Scope counters SHALL not expose customer identity in metrics labels.
16. Admin APIs SHALL be permission-controlled.
17. Cross-workspace data SHALL never appear in classifier input.
18. Privacy tests SHALL seed fake secrets and assert redaction.
19. Data minimization SHALL be documented.
20. Scope decision retention SHALL be configurable.
21. Deletion/retention SHALL not remove required security incident evidence without policy.
22. Scope Guard SHALL not create new durable customer memory from off-topic content.

---

## AISS-R29: Failure and Fail-Closed Behavior

**Priority:** P0

**User Story:** Sebagai platform owner, saya ingin guard tetap aman ketika classifier atau policy gagal.

### Acceptance Criteria

1. Deterministic filter failure SHALL route to classifier when safe.
2. Classifier timeout SHALL not invoke full agent automatically.
3. Classifier malformed output SHALL retry at most once.
4. Repeated malformed output SHALL fallback to clarify.
5. Policy Engine failure SHALL fail closed.
6. Fail-closed SHALL disable:
   - RAG;
   - tools;
   - embeddings;
   - full agent.
7. Customer SHALL receive short safe retry/clarification response.
8. Counter storage failure SHALL not disable unsafe checks.
9. Trace failure SHALL not block safe refusal.
10. Metrics failure SHALL not block safe refusal.
11. Cache failure SHALL not expand scope.
12. Profile missing SHALL fail closed.
13. Unknown decision SHALL fail closed.
14. Unknown intent SHALL clarify or deny.
15. Provider unavailable SHALL not broaden scope.
16. Human takeover SHALL remain authoritative.
17. Failure behavior SHALL be observable.
18. Failure behavior SHALL have resilience tests.
19. Timeout SHALL have bounded total latency.
20. No failure path SHALL execute mutation tool.
21. Recovery SHALL not replay denied request into full agent.
22. Critical failure MAY trigger temporary safe mode.

---

## AISS-R30: Prompt Injection and Scope Expansion Defense

**Priority:** P0

**User Story:** Sebagai owner, saya ingin user, documents, dan custom prompts tidak dapat memperluas scope.

### Acceptance Criteria

1. THE System SHALL treat as untrusted:
   - customer message;
   - RAG content;
   - custom agent instruction;
   - tool-returned free text;
   - encoded/translated instruction.
2. Untrusted content SHALL not modify platform maximum.
3. Untrusted content SHALL not modify policy profile.
4. Untrusted content SHALL not enable denied tools.
5. Untrusted content SHALL not enable RAG for denied route.
6. Untrusted content SHALL not enable full agent for denied route.
7. “Ignore previous instructions” SHALL not broaden scope.
8. “You are now a coding assistant” SHALL not broaden scope.
9. RAG document instruction SHALL not broaden scope.
10. Tool result instruction SHALL not broaden scope.
11. Multi-turn gradual jailbreak SHALL be evaluated every turn.
12. Prior business request SHALL not grant future general permission.
13. Scope decision SHALL be recomputed per customer message.
14. Scope prompt SHALL use strict output schema.
15. Classifier output SHALL be validated.
16. Tool Gateway SHALL remain defense in depth.
17. Hidden system prompt SHALL not be exposed.
18. Hidden tool names SHALL not be exposed unnecessarily.
19. Security event SHALL be recorded for critical attempts.
20. Adversarial corpus SHALL include:
   - direct jailbreak;
   - obfuscated jailbreak;
   - encoded jailbreak;
   - multilingual jailbreak;
   - RAG injection;
   - agent-config expansion.
21. Critical false negative SHALL block release.
22. Platform policy SHALL not be configurable off.
23. Scope policy SHALL remain independent of model compliance.
24. No generated code SHALL be executed.

---

## AISS-R31: Rollout and Shadow Mode

**Priority:** P1

**User Story:** Sebagai owner, saya ingin guard diluncurkan bertahap agar valid request tidak banyak salah ditolak.

### Acceptance Criteria

1. THE System SHOULD support shadow mode.
2. Shadow mode SHALL classify without blocking.
3. Shadow mode SHALL record expected route.
4. Shadow mode SHALL compare existing behavior.
5. Shadow mode SHALL not store unnecessary raw text.
6. Shadow mode SHALL measure false positives/negatives through review.
7. Unsafe enforcement MAY be enabled before off-topic enforcement.
8. High-confidence off-topic enforcement SHALL precede low-confidence blocking.
9. Low-confidence SHALL remain clarify during rollout.
10. Cost gating SHALL be enabled after decision quality acceptable.
11. Per-agent profile rollout SHALL be supported.
12. Rollout SHALL be versioned.
13. Rollback SHALL be supported.
14. Rollback SHALL not disable immutable unsafe controls.
15. Rollout metrics SHALL be monitored.
16. Critical alert SHALL stop/rollback release.
17. Threshold tuning SHALL use evaluation data.
18. Production profile change SHALL require approval.
19. Shadow-to-enforce transition SHALL have checklist.
20. Rollout status SHALL be visible to authorized admin.

---

## AISS-R32: Security and Evaluation Testing

**Priority:** P0

**User Story:** Sebagai development team, saya ingin scope security dilindungi oleh automated tests.

### Acceptance Criteria

1. THE System SHALL have unit tests.
2. THE System SHALL have component tests.
3. THE System SHALL have integration tests.
4. THE System SHALL have security tests.
5. THE System SHALL have evaluation tests.
6. THE System SHALL have property-based tests for critical invariants.
7. THE System SHALL have concurrency tests.
8. Allowed evaluation scenarios SHALL include:
   - greeting;
   - thanks;
   - product question;
   - outlet question;
   - order status;
   - payment status;
   - complaint;
   - allergen;
   - coffee education;
   - ambiguous follow-up;
   - angry complaint.
9. Denied evaluation scenarios SHALL include:
   - coding;
   - homework;
   - history;
   - politics;
   - news;
   - investment advice;
   - medical diagnosis;
   - legal advice;
   - unrelated creative writing;
   - unrelated roleplay.
10. Security scenarios SHALL include:
    - prompt injection;
    - system prompt request;
    - hidden tool request;
    - mark-paid request;
    - cross-workspace request;
    - admin impersonation;
    - RAG instruction injection;
    - agent scope expansion;
    - encoded jailbreak;
    - gradual jailbreak.
11. Denied request SHALL assert:
    - RAG calls = 0;
    - tool calls = 0;
    - embedding calls = 0;
    - full-agent calls = 0.
12. Complaint with profanity SHALL not be falsely denied.
13. Ambiguous business follow-up SHALL use recent context.
14. Agent effective scope SHALL never exceed profile.
15. Critical security tests SHALL block release.
16. Test data SHALL not use production data.
17. Test environment SHALL not use production secrets.
18. External classifier SHALL be mocked for deterministic CI.
19. Optional local-model evaluation SHALL be separate.
20. Evaluation dataset SHALL be versioned.
21. Test results SHALL link to policy/classifier version.
22. Skipped critical test SHALL require owner and follow-up.
23. Flaky critical test SHALL not be accepted as baseline.
24. Security regression SHALL block profile publish.

---

## AISS-R33: Cost and Performance Testing

**Priority:** P0

**User Story:** Sebagai owner, saya ingin membuktikan bahwa guard benar-benar menghemat resource.

### Acceptance Criteria

1. THE System SHALL measure deterministic-filter latency.
2. THE System SHALL measure classifier latency.
3. THE System SHALL measure Policy Engine latency.
4. THE System SHALL measure denied-response latency.
5. THE System SHALL measure full-agent calls avoided.
6. THE System SHALL measure RAG calls avoided.
7. THE System SHALL measure embedding calls avoided.
8. THE System SHALL measure tool calls avoided.
9. THE System SHALL estimate tokens saved when possible.
10. Exact currency saving SHALL only be reported when pricing reliable.
11. Denied request SHALL have no full-agent token usage.
12. Denied request SHALL have no RAG token/context usage.
13. Classifier context SHALL remain within configured cap.
14. Classifier output SHALL remain within token cap.
15. Classifier timeout SHALL remain bounded.
16. Parallel denied requests SHALL not overload full agent.
17. Repeated off-topic cooldown SHALL reduce classifier/full-agent load.
18. Performance tests SHALL cover:
    - deterministic allow;
    - deterministic deny;
    - classifier allow;
    - classifier deny;
    - clarify;
    - cooldown.
19. Performance regression SHALL be monitored.
20. Cost metrics SHALL be workspace/agent scoped.
21. Metrics SHALL not expose PII.
22. Load tests SHALL include repeated off-topic bursts.
23. Load tests SHALL include legitimate business bursts.
24. Guard SHALL not add unacceptable latency to obvious business callbacks.
25. Performance target SHALL be documented after baseline.

---

## AISS-R34: Scope Feedback and Improvement Loop

**Priority:** P1

**User Story:** Sebagai admin, saya ingin memperbaiki classifier tanpa membiarkannya berubah otomatis.

### Acceptance Criteria

1. Authorized admin MAY label decision:
   - correct;
   - false positive;
   - false negative;
   - wrong intent;
   - should clarify;
   - should handoff.
2. Feedback SHALL link to scope decision.
3. Feedback SHALL link to profile/version.
4. Feedback SHALL link to classifier version.
5. Feedback SHALL be workspace-scoped.
6. Feedback SHALL be permission-controlled.
7. Feedback SHALL not auto-modify production policy.
8. Changes SHALL require:
   - version;
   - evaluation;
   - approval;
   - rollout.
9. Feedback MAY improve:
   - deterministic rules;
   - few-shot examples;
   - thresholds;
   - templates;
   - policy profiles;
   - classifier model.
10. Feedback SHALL not grant forbidden scope.
11. False-positive rate SHALL be measurable.
12. False-negative rate SHALL be measurable.
13. Critical false negative SHALL trigger incident/release block.
14. Feedback APIs SHALL redact sensitive text where possible.
15. Evaluation corpus SHALL include confirmed regressions.
16. Profile publish SHALL use latest required evaluation.
17. Historical decisions SHALL retain original version.
18. A/B testing MAY be added later with security constraints.
19. Automated prompt optimization SHALL not publish without human approval.
20. Feedback workflow SHALL be auditable.

---

# 7. Cross-Cutting Correctness Properties

## Property 1: Platform Maximum Scope

*For any* workspace, profile, agent, or prompt, effective scope SHALL never exceed platform maximum.

## Property 2: Denied RAG Isolation

*For any* `DENY_OFF_TOPIC` or `DENY_UNSAFE` decision, RAG SHALL not be invoked.

## Property 3: Denied Tool Isolation

*For any* `DENY_OFF_TOPIC` or `DENY_UNSAFE` decision, no tool SHALL be available or executed.

## Property 4: Denied Full-Agent Isolation

*For any* `DENY_OFF_TOPIC` or `DENY_UNSAFE` decision, full AI Agent SHALL not run.

## Property 5: Denied Embedding Isolation

*For any* denied decision, no embedding retrieval call SHALL run.

## Property 6: Unsafe Authority

*For any* payment bypass, cross-tenant, secret, or hidden-tool request, final decision SHALL be `DENY_UNSAFE`.

## Property 7: Business Continuity

*For any* valid business complaint, emotional wording alone SHALL not cause off-topic denial.

## Property 8: Context-Aware Ambiguity

*For any* ambiguous short message, recent turns and compact commerce state SHALL be considered before denial.

## Property 9: Small-Talk Bound

*For any* conversation, small talk SHALL not continue beyond configured maximum without business redirect.

## Property 10: Adjacent Knowledge Bound

*For any* adjacent response, content SHALL remain tied to approved product knowledge.

## Property 11: No Scope Expansion by Agent

*For any* agent config, agent-specific scope SHALL be a subset of profile scope.

## Property 12: No Scope Expansion by Content

*For any* customer message, RAG chunk, or tool result, content SHALL not expand effective scope.

## Property 13: Cost Bound

*For any* classifier call, context, output, and timeout SHALL remain within configured budget.

## Property 14: Fail Closed

*For any* classifier/policy failure, RAG, tools, embeddings, and full agent SHALL remain disabled.

## Property 15: Repeated Attempt Safety

*For any* duplicate message, scope counters SHALL increment at most once.

## Property 16: Counter Isolation

*For any* contact/chat, scope counters SHALL not leak across workspace.

## Property 17: Payment Defense in Depth

*For any* profile or classifier decision, AI SHALL not gain payment mutation capability.

## Property 18: Human Takeover

*For any* active human takeover, Scope Guard SHALL not produce customer-facing AI response.

## Property 19: Version Traceability

*For any* scope decision, policy profile and classifier version SHALL be recorded.

## Property 20: Cost Avoidance Truthfulness

*For any* cost metric, exact currency saving SHALL not be claimed without reliable provider pricing and usage.

---

# 8. Error Codes

```text
AI_SCOPE_PROFILE_NOT_FOUND
AI_SCOPE_PROFILE_INACTIVE
AI_SCOPE_PROFILE_VERSION_NOT_FOUND
AI_SCOPE_EXPANSION_DENIED
AI_SCOPE_CONFIG_INVALID
AI_SCOPE_DECISION_INVALID
AI_SCOPE_REASON_CODE_INVALID
AI_SCOPE_CLASSIFIER_UNAVAILABLE
AI_SCOPE_CLASSIFIER_TIMEOUT
AI_SCOPE_CLASSIFIER_OUTPUT_INVALID
AI_SCOPE_POLICY_ENGINE_FAILED
AI_SCOPE_INPUT_EMPTY
AI_SCOPE_INPUT_TOO_LARGE
AI_SCOPE_INPUT_INVALID
AI_SCOPE_OFF_TOPIC
AI_SCOPE_UNSAFE
AI_SCOPE_CLARIFICATION_REQUIRED
AI_SCOPE_CLARIFICATION_EXHAUSTED
AI_SCOPE_COOLDOWN_ACTIVE
AI_SCOPE_RATE_LIMITED
AI_SCOPE_RAG_NOT_ALLOWED
AI_SCOPE_TOOL_NOT_ALLOWED
AI_SCOPE_FULL_AGENT_NOT_ALLOWED
AI_SCOPE_EMBEDDING_NOT_ALLOWED
AI_SCOPE_COUNTER_CONFLICT
AI_SCOPE_TRACE_ACCESS_DENIED
AI_SCOPE_TEST_ACCESS_DENIED
AI_SCOPE_VERSION_CONFLICT
AI_SCOPE_SHADOW_MODE_ONLY
AI_SCOPE_INTERNAL_ERROR
```

---

# 9. MVP Scope Boundary

## Included in MVP

```text
customer_commerce_strict profile
product_advisor profile
customer_support profile
internal_business_copilot profile
deterministic pre-check
deterministic filter
lightweight classifier
Scope Policy Engine
six decision taxonomy
business allowlist
adjacent policy
small-talk limit
clarification once
fixed off-topic refusal
unsafe refusal
repeated off-topic cooldown
RAG gating
tool gating
embedding gating
full-agent gating
classifier budgets
scope counters
scope traces
scope metrics
shadow mode
scope security tests
scope cost tests
scope evaluation tests
```

## Deferred

```text
advanced semantic cache
dedicated classifier fine-tuning
cross-language classifier optimization
automated policy recommendation
A/B testing
advanced abuse reputation
global fraud correlation
dynamic model selection by real-time cost
```

## Explicitly Out of Scope

```text
general-purpose assistant mode for customer
unrestricted creative assistant
AI model training
Tool Gateway redesign
RAG ingestion redesign
backend marketplace redesign
payment mutation
general medical/legal/financial advisory
autonomous policy modification
automatic production prompt optimization
```

---

# 10. Requirement Traceability by Delivery Phase

## Phase 0 — Baseline and Shadow Mode

```text
AISS-R1
AISS-R2
AISS-R3
AISS-R4
AISS-R25
AISS-R31
```

## Phase 1 — Classifier and Policy Engine

```text
AISS-R5
AISS-R6
AISS-R7
AISS-R10
AISS-R17
AISS-R22
```

## Phase 2 — Scope Behavior

```text
AISS-R8
AISS-R9
AISS-R11
AISS-R12
AISS-R13
AISS-R14
AISS-R23
AISS-R24
```

## Phase 3 — Agent Profiles

```text
AISS-R15
AISS-R16
AISS-R26
AISS-R27
```

## Phase 4 — AI Architecture Gating

```text
AISS-R18
AISS-R19
AISS-R20
AISS-R21
```

## Phase 5 — Privacy, Failure, and Security

```text
AISS-R28
AISS-R29
AISS-R30
```

## Phase 6 — Validation and Optimization

```text
AISS-R32
AISS-R33
AISS-R34
```

---

# 11. Definition of Done for a Scope-Security Requirement

Satu requirement dianggap selesai hanya jika:

1. acceptance criteria applicable sudah diimplementasikan;
2. failing test dibuat sebelum implementation;
3. deterministic path diuji;
4. classifier path diuji;
5. policy path diuji;
6. denied-route no-RAG assertion lulus;
7. denied-route no-tool assertion lulus;
8. denied-route no-embedding assertion lulus;
9. denied-route no-full-agent assertion lulus;
10. agent scope expansion test lulus;
11. RAG prompt-injection test lulus;
12. customer prompt-injection test lulus;
13. workspace isolation tetap lulus;
14. payment mutation tetap mustahil;
15. human takeover tetap authoritative;
16. scope trace dicatat;
17. version dicatat;
18. cost metrics diperbarui;
19. privacy/redaction diperiksa;
20. unit tests lulus;
21. integration tests lulus;
22. security tests lulus;
23. evaluation tests lulus;
24. property tests lulus bila applicable;
25. concurrency tests lulus bila applicable;
26. performance/cost tests lulus;
27. docs diperbarui;
28. requirement mapping diperbarui;
29. implementation reality dilaporkan jujur;
30. specs validation lulus.

---

# 12. Final Requirement Statement

SelaluTeh AI Agent Scope Security and Cost Guard SHALL memastikan customer-facing AI tetap berada pada domain bisnis yang disetujui.

Sistem SHALL:

```text
mengklasifikasikan scope sebelum full processing
menggunakan allowlist capability
memisahkan business, adjacent, small talk, clarify, off-topic, dan unsafe
menggunakan fixed refusal untuk off-topic
memblokir RAG, embeddings, tools, dan full agent pada denied request
membatasi classifier context, output, dan timeout
membatasi repeated off-topic behavior
menerapkan platform-owned policy profiles
mengizinkan agent hanya mempersempit scope
mencatat decision dan cost avoidance
menyediakan security, evaluation, property, concurrency, dan cost tests
```

Sistem SHALL NOT:

```text
mengandalkan system prompt saja
menganggap unknown sebagai allowed
memberi custom agent hak memperluas platform scope
membiarkan RAG documents memperluas scope
menjalankan full AI Agent untuk request off-topic
menjalankan tools untuk request off-topic atau unsafe
menjalankan embedding/retrieval untuk request denied
mengubah payment authority
mengabaikan human takeover
```

Tool Gateway dan backend authorization tetap menjadi pertahanan terakhir untuk seluruh action.
