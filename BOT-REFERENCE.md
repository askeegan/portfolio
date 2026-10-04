# Bot questions, keywords and answers

Extracted from index.html. All answers and trigger phrases below are exact current values.

## Variables

| Variable | Purpose |
| --- | --- |
| `KB` | Array of 27 FAQ entries. |
| `k` | Trigger keywords and phrases for an entry. |
| `a` | Answer for that entry. |
| `GREETING` | Initial message on first opening. |
| `FALLBACK` | Answer when no keywords match. |
| `CHIPS` | Five pairs of button label and matching input. |
| `started` | Tracks whether greeting and buttons have been initialized. |
| `text` | User message or quick-button matching input. |
| `t` | Lowercase message padded with spaces. |
| `best` | Highest-scoring FAQ entry. |
| `score` | Highest match count. |
| `e` | FAQ entry being checked. |
| `s` | Match count for that entry. |
| `w` | Trigger phrase being checked. |
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

Each matching phrase in `k` adds one point. The entry with the most matching phrases supplies `a`. Ties select the earlier entry in `KB`. No match supplies `FALLBACK`. Matching uses substrings, rather than semantic understanding or exact question matching. Responses appear after 280 ms.

## Greeting

Hey, I'm Nova, Alex Keegan's assistant. Ask me about Alex's work, stack, availability, pricing, timelines, or building your store.

## Fallback

I'm a simple assistant, so I might not have that exact one. I can help with Alex's stack, availability, past work, timelines, pricing, process, or building a store. For anything else, email alejandrokeegandev@gmail.com and he'll get right back to you.

## Quick-question buttons

| Button label | Matching input | Current answer topic |
| --- | --- | --- |
| Want a bot like this? | `want a bot like this` | Bots and assistants |
| What's your stack? | `stack` | Technology stack |
| Available for work? | `available` | Availability |
| See your work | `portfolio work` | Portfolio |
| How to reach you? | `contact email` | Contact |

## 1. New store builds

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "from scratch",
  "build my",
  "build a store",
  "build me",
  "can you build",
  "can alex build",
  "help me build",
  "need a store",
  "new store",
  "new site",
  "new website",
  "create my",
  "create a store",
  "make me a store",
  "set up a store",
  "setup a store",
  "ground up",
  "start a store",
  "get a store"
]
```

Answer:

Absolutely. I build Shopify stores end to end, from a blank slate to launch: design, build, product setup, payments, apps and go-live. Tell me about yours at alejandrokeegandev@gmail.com.

## 2. Redesigns and migrations

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "redesign",
  "re-design",
  "revamp",
  "rebuild",
  "refresh my",
  "fix my",
  "improve my",
  "update my",
  "migrate",
  "migration",
  "replatform",
  "re-platform",
  "move my",
  "existing store",
  "current store",
  "already have"
]
```

Answer:

Yes. I redesign and rebuild existing stores, migrate between platforms or themes, and tune them for speed and conversion. Send me the URL at alejandrokeegandev@gmail.com and I'll take a look.

## 3. Shopify

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "shopify",
  "liquid",
  " theme",
  "shopify plus",
  " plus",
  "checkout",
  "custom app",
  "shopify app",
  "metafield"
]
```

Answer:

Yes, Shopify is home base: custom themes, Shopify Plus, checkout extensibility, custom apps and migrations. Whatever you need built, I can handle it.

## 4. Headless storefronts

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "headless",
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

Yes, I build headless storefronts with Next.js or Hydrogen on the Shopify Storefront API, deployed on Vercel. Fast, modern and fully custom.

## 5. Technology stack

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "stack",
  " tech",
  "technolog",
  "skill",
  " tool",
  "framework",
  "what do you use",
  "built with",
  "work with",
  "coding",
  "code in",
  "program"
]
```

Answer:

I work across Shopify (Liquid, Storefront API, checkout extensibility) and headless with Next.js, React, TypeScript, Hydrogen, GraphQL, Tailwind and Vercel.

## 6. Features and integrations

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "klaviyo",
  "subscription",
  "integrat",
  " api ",
  "quiz",
  "bundle",
  "loyalty",
  "email flow",
  "third party",
  "third-party",
  "plugin",
  "automation",
  " apps"
]
```

Answer:

Yes, I build custom features and integrations: subscriptions, quizzes, bundles, Klaviyo and email flows, and third-party APIs. Tell me what you need.

## 7. Conversion and performance

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "cro",
  "conversion",
  "convert",
  "performance",
  " speed",
  "slow",
  "faster",
  "quicker",
  "page speed",
  "core web vitals",
  "optimi",
  "more sales",
  "abandon",
  "load time",
  "loading"
]
```

Answer:

Big focus for me. I build for conversion and speed: clean UX, fast load times, strong Core Web Vitals, and the details that turn visits into sales.

## 8. Availability

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "available",
  "availab",
  "hire",
  "hiring",
  "open to",
  "looking for work",
  "for a job",
  " job",
  "full-time",
  "full time",
  "part-time",
  "contract",
  "freelance",
  "work with you",
  "work together",
  "take on",
  "capacity",
  "onboard"
]
```

Answer:

I'm open to full-time and contract roles, plus freelance projects. Based in Bali (UTC+8), working worldwide. Email alejandrokeegandev@gmail.com to start.

## 9. Location and timezone

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "where",
  "located",
  "location",
  "based",
  "timezone",
  "time zone",
  "bali",
  "indonesia",
  "remote",
  "what country",
  " hours",
  "overlap"
]
```

Answer:

I'm based in Bali, Indonesia (UTC+8) and work fully remote with teams and brands worldwide.

## 10. Experience

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "experience",
  "years",
  "background",
  "senior",
  "team lead",
  " lead",
  "how long have",
  "expert",
  " level",
  "junior",
  "qualified",
  "how good"
]
```

Answer:

I'm a senior / lead developer: I've led development teams and shipped 50+ Shopify stores across wellness, beauty, jewellery and more.

## 11. Portfolio

Trigger phrases (JSON preserves intentional spaces):

```json
[
  " work",
  "portfolio",
  "project",
  "example",
  " site",
  "case stud",
  "built before",
  "clients",
  "brands",
  "showcase",
  "previous",
  "past work",
  "see your"
]
```

Answer:

Take a look at Selected Work above: live builds include Rooted Vitamins, REHAUS, Larsson & Jennings and Plantwell, plus more linked stores.

## 12. Timelines

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "how long",
  "timeline",
  "turnaround",
  "how fast",
  "how quick",
  "how soon",
  " days",
  " weeks",
  "deadline",
  "rush",
  "asap",
  "when can",
  "delivery time"
]
```

Answer:

Once scope and design are set, I can build and launch a full store in about 2 days. Larger custom builds take longer, and I quote that up front.

## 13. Pricing

Trigger phrases (JSON preserves intentional spaces):

```json
[
  " rate",
  "price",
  "pricing",
  "cost",
  "how much",
  "budget",
  "quote",
  "charge",
  " fee",
  "expensive",
  "afford",
  "payment",
  " pay ",
  "invoice",
  "deposit"
]
```

Answer:

It depends on scope. Share what you need at alejandrokeegandev@gmail.com and I'll send a clear, fixed quote. No hourly surprises.

## 14. Process

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "process",
  "how do you work",
  "how does it work",
  "what happens",
  "steps",
  "workflow",
  "next step",
  "get started",
  "getting started",
  "begin",
  "kick off",
  "kickoff",
  "onboarding",
  "how do we"
]
```

Answer:

Simple: we scope the project and lock the price, I get the design ready, then build and launch. You review a live store before go-live.

## 15. Services

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "what do you do",
  "services",
  "service",
  "what can you",
  "what else",
  "offer",
  "help with",
  "do you do",
  "specialt",
  "specialis",
  "specializ"
]
```

Answer:

I design and build Shopify and headless storefronts end to end: new builds, redesigns, migrations, CRO and performance, custom apps and ongoing care.

## 16. Ongoing support

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "support",
  "maintenance",
  "maintain",
  "after launch",
  "ongoing",
  "retainer",
  "look after",
  "updates",
  "manage my",
  "care plan",
  "keep it"
]
```

Answer:

Yes, I can keep your store fast, fixed and improving after launch. Email alejandrokeegandev@gmail.com and we'll set up a care plan.

## 17. Why hire Alex

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "why you",
  "why alex",
  "why hire",
  "why work with",
  "what makes",
  "different",
  "better than",
  "stand out",
  "special about",
  "why should"
]
```

Answer:

You deal directly with the senior developer writing the code, not an agency middle layer. Fast, senior builds, clear pricing, and a real focus on conversion.

## 18. Industries

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "industr",
  "niche",
  "sector",
  "wellness",
  "beauty",
  "skincare",
  "supplement",
  "jewel",
  "fashion",
  "cosmetic",
  "ecommerce",
  "e-commerce",
  " dtc",
  "what brands",
  "my industry"
]
```

Answer:

I've built across wellness, beauty, skincare, supplements, jewellery and other DTC brands. The approach works for most product-based stores.

## 19. Contact

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "contact",
  "email",
  "reach",
  "get in touch",
  "talk to",
  "message you",
  "connect",
  "hire you",
  " call",
  "whatsapp",
  "how do i reach",
  "your email"
]
```

Answer:

Easiest is email: alejandrokeegandev@gmail.com. My LinkedIn and GitHub are in the footer too.

## 20. CV

Trigger phrases (JSON preserves intentional spaces):

```json
[
  " cv",
  "resume",
  "curriculum"
]
```

Answer:

Happy to share my CV, just email alejandrokeegandev@gmail.com.

## 21. Languages

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "english",
  "spanish",
  "do you speak",
  "speak english",
  " german",
  "what language",
  "communicate"
]
```

Answer:

I'm Spanish (native), speak fluent English, and some German. Clear communication from kickoff to launch is a priority for me.

## 22. References

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "reference",
  "testimonial",
  "review",
  "proof",
  "vouch",
  "recommend",
  "clients say"
]
```

Answer:

Happy to share references and examples of past work on request, just email alejandrokeegandev@gmail.com.

## 23. Bots and assistants

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "bot like this",
  "want a bot",
  "this bot",
  "chatbot",
  "chat bot",
  "bot for",
  "a widget",
  "own bot",
  "get this bot",
  "like this one",
  "who made this",
  "built this bot",
  "this assistant"
]
```

Answer:

Yes! This assistant is something I build and can drop into your site: a free FAQ bubble like this, or a smarter AI version trained on your business. Email alejandrokeegandev@gmail.com and I'll set you up.

## 24. About Alex

Trigger phrases:

```json
["who is alex", "who am i", "about alex", "tell me about alex"]
```

Answer:

I'm Alex Keegan, a senior Shopify and headless developer based in Bali, building fast, high-converting stores for brands worldwide.

## 25. About Nova

Trigger phrases:

```json
["nova", "who are you", "about you", "what is this", "your name", "tell me about yourself"]
```

Answer:

I'm Nova, Alex Keegan's assistant. I can help with questions about Alex's work, stack, availability, pricing, timelines, and services.

## 26. Greetings

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "hello",
  " hi ",
  " hey ",
  "good morning",
  "good afternoon",
  "good evening",
  " yo ",
  "howdy",
  "greetings"
]
```

Answer:

Hey! Ask me about my stack, availability, work, pricing, or building a store.

## 27. Thanks and goodbye

Trigger phrases (JSON preserves intentional spaces):

```json
[
  "thanks",
  "thank you",
  "cheers",
  "appreciate",
  " bye",
  "goodbye",
  "see you",
  "later"
]
```

Answer:

Anytime! Reach out at alejandrokeegandev@gmail.com whenever you're ready.
