# Nova questions, triggers and answers

Reference for the current implementation in index.html. All 27 FAQ categories, answers, trigger phrases, the greeting, fallback and five quick questions below match the source. Nova uses local, prepared responses; it does not call an AI service.

## Variables

| Variable | Purpose |
| --- | --- |
| `KB` | Array of 27 FAQ entries. |
| `id`, `label` | Stable category ID for tests and readable topic for clarification. |
| `k` | Whole-word topic keywords and phrases. |
| `q` | Optional explicit question-intent phrases with higher priority. |
| `x` | Optional phrases that exclude an entry (currently shipping costs versus developer pricing). |
| `exact` | Require a whole-message match; used for About Alex, greetings and thanks/goodbye. |
| `a` | Prepared answer. |
| `GREETING` | Initial message on first opening. |
| `FALLBACK` | Response when nothing matches, including Alex's email. |
| `CHIPS` | Five pairs of button label and matching input; unchanged. |
| `FAQ_MATCHERS` | Normalized phrases cached once at initialization. |
| `original`, `question`, `padded` | Normalized input, input without a leading salutation, and space-padded input for word boundaries. |
| `entry`, `item`, `phrase` | FAQ entry, its compiled matcher, and the current phrase. |
| `found`, `weight`, `score` | Whether a phrase matches, its relevance, and the entry's strongest relevance. |
| `matches`, `bestScore` | All entries tied at the highest positive score, and that score. |
| `started` | Tracks whether greeting and buttons have been initialized. |
| `text` | User message or quick-button matching input. |
| `who` | Message role (`bot` or `user`). |
| `m` | Message DOM element. |
| `c` | Quick-button label/input pair. |
| `b` | Generated quick-button element. |
| `launch`, `panel`, `closeBtn`, `body`, `chipsEl`, `form`, `input` | Bot interface DOM elements. |
| `focusTimer` | Pending delayed focus after opening the panel. |
| `viewport` | Browser visual viewport, used to account for the phone keyboard. |
| `height` | Currently visible viewport height. |
| `keyboard` | Bottom area obscured by viewport resizing or the keyboard. |
| `keyboardOpen` | Whether the open panel needs keyboard-aware positioning. |
| `safeBottom` | Launcher's bottom spacing, including its device safe area. |
| `bottom` | Calculated chat panel bottom offset. |
| `available` | Height available to the panel. |
| `target` | Input on desktop; close button on touch devices to avoid opening the keyboard automatically. |

## Matching behavior

- Lowercase and normalize accents, punctuation, apostrophes, hyphens and whitespace. Match complete tokens/phrases, never fragments of unrelated words.
- A leading salutation such as "Hi Nova," is ignored when matching the question. Whole-message entries also check the original normalized input, so standalone greetings still work.
- A topic phrase scores its word count. An explicit question-intent phrase scores 100 plus its word count. Thus the question being asked can outrank an incidental technology or subject.
- Use only the strongest phrase per category. Repeated words and overlapping synonyms do not inflate scores.
- Excluded phrases prevent known unrelated uses from matching an entry. Developer pricing excludes shipping-cost questions.
- A unique highest score supplies that category's answer. Ties ask which of the named topics the visitor means; they never silently select the first category. No match supplies the fallback.
- Greetings and farewells match whole messages, so "Hello, what is the weather?" uses the fallback, rather than hiding the unanswered question with a greeting.
- This is a lightweight phrase matcher, not semantic understanding or conversation memory. Unusual wording and multiple intents may need rephrasing. Responses still appear after 280 ms.

## Greeting

Hey, I'm Nova, Alex Keegan's assistant. Ask me about Alex's work, stack, availability, pricing, timelines, or building your store.

## Fallback

I don't have an answer for that one. I can help with Alex's work, services, stack, availability, pricing and timelines. For anything else, email Alex at alejandrokeegandev@gmail.com.

## Quick-question buttons

| Button label | Matching input | Current answer topic |
| --- | --- | --- |
| Want a bot like this? | `want a bot like this` | bots and assistants |
| What's your stack? | `stack` | technology stack |
| Available for work? | `available` | availability |
| See your work | `portfolio work` | portfolio |
| How to reach you? | `contact email` | contact |

## Verification

Run `node tests/nova.test.cjs` using Node's built-in modules; no dependencies are needed. The tests extract and execute the actual inline knowledge base and matching functions. They cover all 27 categories, natural questions, known collisions, unknown questions, both the label and input of each quick button, JavaScript syntax and CSP hashes.

Intentionally ambiguous examples: "Pricing and timelines?" asks the visitor to choose timelines or pricing; "Shopify or React?" asks them to choose Shopify or headless storefronts. These are clarification responses, not extra FAQ categories.

## 1. New store builds

ID: `new-builds`

Topic phrases (`k`):

```json
[
  "new store",
  "new website",
  "new site",
  "build a store",
  "build my store",
  "build my website",
  "build a website",
  "build a shopify store",
  "build a shopify website",
  "create a store",
  "start a store",
  "set up a store",
  "setup a store",
  "store from scratch",
  "website from scratch",
  "store from the ground up",
  "custom ecommerce build",
  "new shopify store",
  "new shopify website",
  "new ecommerce store",
  "build an online store",
  "build my shopify store",
  "build me a website",
  "build me a store",
  "need a shopify store",
  "build my site",
  "build a site"
]
```

Answer:

Yes. Alex builds custom Shopify stores from the ground up, with thoughtful architecture, design implementation and functionality shaped around the brand and its customers. He can also handle the product, payment and app setup needed for launch.

## 2. Redesigns and migrations

ID: `redesigns`

Topic phrases (`k`):

```json
[
  "redesign",
  "redesigns",
  "re design",
  "revamp",
  "rebuild",
  "refresh",
  "migrate",
  "migration",
  "migrations",
  "replatform",
  "re platform",
  "existing store",
  "current store",
  "move my store",
  "switch platforms"
]
```

Question-intent phrases (`q`):

```json
[
  "can you migrate",
  "can alex migrate",
  "can you redesign",
  "can alex redesign",
  "can you rebuild",
  "can alex rebuild",
  "can you refresh",
  "can alex refresh"
]
```

Answer:

Alex redesigns and rebuilds existing stores, migrates between platforms or themes, and improves speed and conversion. Send the store URL and what you want to change to alejandrokeegandev@gmail.com.

## 3. Shopify

ID: `shopify`

Topic phrases (`k`):

```json
[
  "shopify",
  "liquid",
  "theme",
  "themes",
  "shopify plus",
  "checkout",
  "checkout extensibility",
  "custom app",
  "custom apps",
  "shopify app",
  "shopify apps",
  "metafield",
  "metafields"
]
```

Answer:

Shopify is Alex's home base: Liquid, custom themes, Shopify Plus, checkout extensibility, custom apps and migrations. He builds around the store's requirements, from storefront details to more complex functionality.

## 4. Headless storefronts

ID: `headless`

Topic phrases (`k`):

```json
[
  "headless",
  "headless commerce",
  "headless shopify",
  "shopify headless",
  "hydrogen",
  "next.js",
  "nextjs",
  "next js",
  "react",
  "storefront api",
  "vercel",
  "composable",
  "jamstack"
]
```

Answer:

Alex builds headless storefronts with Next.js or Hydrogen, using Shopify's Storefront API. He works across the architecture, React frontend and integrations to create a fast, custom shopping experience.

## 5. Technology stack

ID: `stack`

Topic phrases (`k`):

```json
[
  "stack",
  "technology",
  "technologies",
  "skills",
  "framework",
  "frameworks",
  "typescript",
  "graphql",
  "tailwind",
  "coding",
  "programming languages"
]
```

Question-intent phrases (`q`):

```json
[
  "stack",
  "technologies",
  "frameworks",
  "programming languages",
  "what tools",
  "which tools",
  "what technology",
  "which technology",
  "what do you use",
  "what does alex use",
  "built with",
  "code in"
]
```

Answer:

Alex works with Shopify, Liquid and the Storefront API, plus Next.js, React, TypeScript, Hydrogen, GraphQL, Tailwind and Vercel for headless builds. He chooses the stack to fit the project.

## 6. Features and integrations

ID: `integrations`

Topic phrases (`k`):

```json
[
  "klaviyo",
  "subscription",
  "subscriptions",
  "integrate",
  "integration",
  "integrations",
  "quiz",
  "quizzes",
  "bundle",
  "bundles",
  "loyalty",
  "email flow",
  "email flows",
  "email automation",
  "third party",
  "plugin",
  "plugins",
  "automation",
  "custom features",
  "payment setup",
  "payment gateway"
]
```

Question-intent phrases (`q`):

```json
[
  "integrate",
  "integration",
  "integrations",
  "email flow",
  "email flows",
  "email automation",
  "loyalty program",
  "payment setup",
  "payment gateway"
]
```

Answer:

Alex builds custom ecommerce features and third-party integrations, including subscriptions, quizzes, bundles, Klaviyo and APIs. The approach depends on how your store and existing systems need to work together.

## 7. Conversion and performance

ID: `performance`

Topic phrases (`k`):

```json
[
  "cro",
  "conversion",
  "conversions",
  "performance",
  "page speed",
  "site speed",
  "store speed",
  "slow store",
  "slow website",
  "slow site",
  "store is slow",
  "site is slow",
  "website is slow",
  "core web vitals",
  "optimize",
  "optimise",
  "optimization",
  "optimisation",
  "more sales",
  "abandoned carts",
  "cart abandonment",
  "load time",
  "loading time",
  "loading slowly",
  "ux"
]
```

Question-intent phrases (`q`):

```json
[
  "cro",
  "conversion",
  "conversions",
  "performance",
  "page speed",
  "site speed",
  "store speed",
  "core web vitals",
  "load time",
  "loading time"
]
```

Answer:

Alex focuses on fast load times, clear UX and the details that help visitors buy. He improves Core Web Vitals and shopping flows with performance and conversion in mind.

## 8. Availability

ID: `availability`

Topic phrases (`k`):

```json
[
  "available",
  "availability",
  "hire",
  "hiring",
  "full time",
  "part time",
  "contract",
  "freelance",
  "looking for work",
  "taking projects",
  "taking on projects",
  "taking on new projects",
  "work with you",
  "work with alex",
  "work together",
  "join our team"
]
```

Question-intent phrases (`q`):

```json
[
  "available",
  "availability",
  "hiring",
  "full time",
  "part time",
  "freelance",
  "hire you",
  "hire alex",
  "work with you",
  "work with alex",
  "work together",
  "taking on projects",
  "taking on new projects",
  "join our team"
]
```

Answer:

Alex is open to full-time, contract roles, and freelance projects. He works remotely with teams worldwide. Email alejandrokeegandev@gmail.com with the role or project you have in mind.

## 9. Location and timezone

ID: `location`

Topic phrases (`k`):

```json
[
  "located",
  "location",
  "based",
  "timezone",
  "time zone",
  "bali",
  "indonesia",
  "remote",
  "working hours",
  "time overlap",
  "remotely"
]
```

Question-intent phrases (`q`):

```json
[
  "where are you based",
  "where is alex based",
  "where do you live",
  "where does alex live",
  "where are you located",
  "where is alex located",
  "timezone",
  "time zone",
  "working hours",
  "time overlap",
  "timezone overlap"
]
```

Answer:

Alex is based in Bali, Indonesia (UTC+8) and works remotely with teams and brands worldwide. For specific working hours or timezone overlap, check with him directly.

## 10. Experience

ID: `experience`

Topic phrases (`k`):

```json
[
  "experience",
  "background",
  "senior",
  "team lead",
  "lead developer",
  "junior",
  "qualifications"
]
```

Question-intent phrases (`q`):

```json
[
  "years of experience",
  "how much experience",
  "how long have you been",
  "how long has alex been",
  "how long have you worked",
  "how long has alex worked",
  "how many stores",
  "how many years",
  "how many shopify stores",
  "how many sites",
  "how many websites",
  "experience with"
]
```

Answer:

Alex is a senior Shopify and headless ecommerce developer. He's led development teams and shipped 50+ Shopify stores across wellness, beauty, jewellery and more.

## 11. Portfolio

ID: `portfolio`

Topic phrases (`k`):

```json
[
  "portfolio",
  "selected work",
  "past work",
  "previous work",
  "your work",
  "alex s work",
  "recent work",
  "live builds",
  "case study",
  "case studies",
  "project examples",
  "store examples",
  "previous projects",
  "past projects",
  "previous clients",
  "stores you built",
  "stores has alex built",
  "built before",
  "showcase"
]
```

Question-intent phrases (`q`):

```json
[
  "portfolio",
  "selected work",
  "past work",
  "previous work",
  "see your work",
  "see alex s work",
  "case study",
  "case studies",
  "project examples",
  "store examples",
  "previous projects",
  "past projects",
  "previous clients",
  "stores you built",
  "stores has alex built",
  "built before",
  "what brands"
]
```

Answer:

Take a look at Selected Work on this site: live builds include Rooted Vitamins, REHAUS, Larsson & Jennings and Plantwell, plus more linked stores.

## 12. Timelines

ID: `timelines`

Topic phrases (`k`):

```json
[
  "timeline",
  "timelines",
  "turnaround",
  "deadline",
  "rush",
  "asap",
  "delivery time",
  "two days",
  "2 days"
]
```

Question-intent phrases (`q`):

```json
[
  "timeline",
  "timelines",
  "turnaround",
  "deadline",
  "how long",
  "how fast",
  "how quickly",
  "how quick",
  "how soon",
  "delivery time",
  "two days",
  "2 days"
]
```

Answer:

Once the design and scope are ready, Alex can often build a website refresh in around 2 days. Custom Shopify builds, migrations and headless projects can take longer depending on scope. He'll confirm a realistic timeline with you.

## 13. Pricing

ID: `pricing`

Topic phrases (`k`):

```json
[
  "price",
  "prices",
  "pricing",
  "cost",
  "costs",
  "budget",
  "quote",
  "rates",
  "hourly",
  "fee",
  "fees",
  "expensive",
  "afford",
  "invoice",
  "deposit"
]
```

Question-intent phrases (`q`):

```json
[
  "price",
  "prices",
  "pricing",
  "cost",
  "costs",
  "budget",
  "quote",
  "rates",
  "hourly",
  "how much",
  "what do you charge",
  "what does alex charge",
  "payment terms",
  "engagement structure",
  "cost of",
  "cost to",
  "price of"
]
```

Excluded phrases (`x`):

```json
[
  "shipping cost",
  "shipping costs",
  "cost of shipping",
  "shipping fees",
  "delivery fees"
]
```

Answer:

Pricing depends on scope. Share the project with Alex at alejandrokeegandev@gmail.com and he can provide a clear quote or recommend an engagement structure that fits the work.

## 14. Process

ID: `process`

Topic phrases (`k`):

```json
[
  "process",
  "workflow",
  "next steps",
  "next step",
  "kickoff",
  "kick off",
  "onboarding"
]
```

Question-intent phrases (`q`):

```json
[
  "process",
  "workflow",
  "how do you work",
  "how does alex work",
  "how does it work",
  "get started",
  "getting started",
  "kickoff",
  "kick off",
  "onboarding",
  "next steps",
  "next step"
]
```

Answer:

Alex starts by understanding the business, goals and scope, then agrees the approach, timeline and engagement. Once the design is ready, he builds, shares progress for feedback, and tests before launch.

## 15. Services

ID: `services`

Topic phrases (`k`):

```json
[
  "services",
  "service",
  "specialty",
  "specialties",
  "specialise",
  "specialises",
  "specialize",
  "specializes",
  "specialisation",
  "specialization"
]
```

Question-intent phrases (`q`):

```json
[
  "what do you do",
  "what does alex do",
  "what services",
  "which services",
  "what can alex help with",
  "what can you help with",
  "what do you offer",
  "what does alex offer",
  "what can you do",
  "what can alex do",
  "how can alex help me",
  "how can you help me"
]
```

Answer:

Alex develops Shopify and headless storefronts: custom builds, redesigns, migrations, integrations and ongoing improvements. His work combines frontend engineering and architecture with UX, performance and conversion thinking.

## 16. Ongoing support

ID: `support`

Topic phrases (`k`):

```json
[
  "support",
  "maintenance",
  "maintain",
  "after launch",
  "ongoing support",
  "retainer",
  "care plan",
  "store updates",
  "manage my store",
  "look after my store"
]
```

Question-intent phrases (`q`):

```json
[
  "maintenance",
  "after launch",
  "ongoing support",
  "retainer",
  "care plan",
  "store updates",
  "manage my store",
  "look after my store",
  "ongoing shopify support",
  "store support",
  "do you offer support",
  "does alex offer support",
  "post launch"
]
```

Answer:

Yes. Alex can keep your store maintained and improving after launch, from fixes and updates to new features and performance work. Email alejandrokeegandev@gmail.com to discuss ongoing support.

## 17. Why hire Alex

ID: `why-alex`

Topic phrases (`k`):

```json
[
  "why you",
  "why alex",
  "why hire",
  "why work with",
  "stand out"
]
```

Question-intent phrases (`q`):

```json
[
  "why hire",
  "why work with",
  "why should i hire",
  "why should we hire",
  "what makes alex different",
  "what makes you different",
  "why choose alex",
  "why choose you",
  "stand out",
  "why hire alex",
  "why hire you",
  "why work with alex",
  "why work with you"
]
```

Answer:

You work directly with a senior developer who sees the wider ecommerce picture. Alex combines development with UX, performance, CRO and design awareness, grounded in the brand, customer and business behind the build.

## 18. Industries

ID: `industries`

Topic phrases (`k`):

```json
[
  "industry",
  "industries",
  "niche",
  "sector",
  "sectors",
  "wellness",
  "beauty",
  "skincare",
  "supplement",
  "supplements",
  "jewellery",
  "jewelry",
  "fashion",
  "cosmetics",
  "dtc"
]
```

Question-intent phrases (`q`):

```json
[
  "industry",
  "industries",
  "niche",
  "sectors",
  "types of brands",
  "kinds of brands"
]
```

Answer:

Alex has built stores for wellness, beauty, skincare, supplements, jewellery and other DTC brands. He adapts the approach to the product, customers and business.

## 19. Contact

ID: `contact`

Topic phrases (`k`):

```json
[
  "contact",
  "email",
  "e mail",
  "linkedin",
  "github",
  "whatsapp",
  "phone number"
]
```

Question-intent phrases (`q`):

```json
[
  "contact",
  "email address",
  "e mail address",
  "your email",
  "your e mail",
  "alex s email",
  "alex s e mail",
  "get in touch",
  "how do i reach",
  "how can i reach",
  "reach alex",
  "reach you",
  "talk to alex",
  "talk to you",
  "message alex",
  "message you",
  "book a call",
  "schedule a call",
  "contact alex",
  "contact you"
]
```

Answer:

The easiest way to reach Alex is alejandrokeegandev@gmail.com. His LinkedIn and GitHub are in the footer too.

## 20. CV

ID: `cv`

Topic phrases (`k`):

```json
[
  "cv",
  "resume",
  "curriculum vitae"
]
```

Question-intent phrases (`q`):

```json
[
  "cv",
  "resume",
  "curriculum vitae"
]
```

Answer:

Alex's CV is available through the Download CV button on this site. You can also request it at alejandrokeegandev@gmail.com.

## 21. Spoken languages

ID: `languages`

Topic phrases (`k`):

```json
[
  "english",
  "spanish",
  "german",
  "spoken languages",
  "speak"
]
```

Question-intent phrases (`q`):

```json
[
  "do you speak",
  "does alex speak",
  "spoken languages",
  "what languages do you speak",
  "what languages does alex speak",
  "what language do you speak",
  "what language does alex speak"
]
```

Answer:

Alex is a native Spanish speaker, speaks fluent English and some German. Clear communication from kickoff to launch is a priority for him.

## 22. References

ID: `references`

Topic phrases (`k`):

```json
[
  "reference",
  "references",
  "testimonial",
  "testimonials",
  "vouch"
]
```

Question-intent phrases (`q`):

```json
[
  "references",
  "testimonials",
  "client reviews",
  "clients say",
  "client feedback",
  "who can vouch"
]
```

Answer:

Alex can share references and examples of past work on request. Email alejandrokeegandev@gmail.com to ask.

## 23. Bots and assistants

ID: `bots`

Topic phrases (`k`):

```json
[
  "chatbot",
  "chatbots",
  "chat bot",
  "bot like this",
  "want a bot",
  "bot for",
  "own bot",
  "get this bot",
  "build a bot",
  "build an assistant",
  "ai assistant",
  "faq assistant",
  "assistant like nova",
  "nova for my",
  "who built nova",
  "who made nova",
  "who built this bot",
  "who made this bot",
  "who made this",
  "who built this assistant",
  "this bot",
  "this assistant"
]
```

Answer:

Alex can build an assistant like Nova directly into a website, from a lightweight FAQ experience to a smarter AI assistant built around the business. Email alejandrokeegandev@gmail.com to discuss yours.

## 24. About Alex

ID: `about-alex`

Topic phrases (`k`):

```json
[
  "who is alex",
  "who s alex",
  "about alex",
  "tell me about alex",
  "who is alex keegan",
  "tell me about alex keegan",
  "about alex keegan",
  "who s alex keegan"
]
```

Whole-message matching only (`exact: true`).

Answer:

Alex Keegan is a senior Shopify and headless ecommerce developer based in Bali. He builds custom storefronts with attention to the technology, shopping experience and business behind them.

## 25. About Nova

ID: `about-nova`

Topic phrases (`k`):

```json
[
  "who are you",
  "who is nova",
  "what is nova",
  "about nova",
  "your name",
  "tell me about yourself",
  "are you ai",
  "are you a bot",
  "are you alex",
  "about you",
  "what is this"
]
```

Question-intent phrases (`q`):

```json
[
  "who are you",
  "who is nova",
  "what is nova",
  "about nova",
  "your name",
  "tell me about yourself",
  "are you ai",
  "are you a bot",
  "are you alex",
  "about you"
]
```

Answer:

I'm Nova, Alex Keegan's assistant. I answer FAQs about Alex's work, stack, availability, pricing and services using a set of prepared responses.

## 26. Greetings

ID: `greetings`

Topic phrases (`k`):

```json
[
  "hello",
  "hi",
  "hey",
  "hi there",
  "hello there",
  "hey there",
  "hi nova",
  "hello nova",
  "hey nova",
  "good morning",
  "good afternoon",
  "good evening",
  "yo",
  "howdy",
  "greetings",
  "good morning nova",
  "how are you",
  "hi how are you",
  "hey how are you"
]
```

Whole-message matching only (`exact: true`).

Answer:

Hey! Ask me about Alex's stack, availability, work, pricing, or building a store.

## 27. Thanks and goodbye

ID: `goodbye`

Topic phrases (`k`):

```json
[
  "thanks",
  "thank you",
  "cheers",
  "thanks nova",
  "thank you nova",
  "thanks for your help",
  "thank you for your help",
  "appreciate it",
  "bye",
  "goodbye",
  "see you",
  "see you later",
  "thanks bye",
  "thanks goodbye"
]
```

Whole-message matching only (`exact: true`).

Answer:

Anytime! Reach out at alejandrokeegandev@gmail.com whenever you're ready.
