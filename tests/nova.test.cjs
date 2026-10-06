// Run with: node tests/nova.test.cjs (Node built-ins only; executes the actual inline matcher).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const start = html.indexOf('    var KB=[');
const end = html.indexOf('    function addMsg', start);
assert(start !== -1 && end > start, 'Find the actual Nova data and matcher');
const bot = {};
vm.runInNewContext(html.slice(start, end), bot);

// Expected category IDs, "fallback", or an explicit list of clarification topics.
const questions = [
  ['Can Alex build a new Shopify store for my brand?', 'new-builds'],
  ['I need a new website from scratch.', 'new-builds'],
  ['Can you build my store?', 'new-builds'],
  ['Could you help me set up a store?', 'new-builds'],
  ['Can you redesign my existing Shopify store?', 'redesigns'],
  ['Can Alex migrate our store from WooCommerce to Shopify?', 'redesigns'],
  ['We need a website refresh.', 'redesigns'],
  ['Can you rebuild our current store?', 'redesigns'],
  ['Do you work with Shopify Plus?', 'shopify'],
  ['Can Alex develop custom Liquid themes?', 'shopify'],
  ['Do you handle checkout extensibility?', 'shopify'],
  ['Can you build a Shopify app?', 'shopify'],
  ['Shopify?', 'shopify'],
  ['Do you build headless Shopify storefronts?', 'headless'],
  ['Can Alex work with Next.js?', 'headless'],
  ['Do you use Hydrogen and the Storefront API?', 'headless'],
  ['Could we use React for our storefront?', 'headless'],
  ['What is your tech stack for Shopify and headless?', 'stack'],
  ['What programming languages do you use?', 'stack'],
  ['Which tools does Alex use for development?', 'stack'],
  ['TypeScript, GraphQL and Tailwind?', 'stack'],
  ['What’s your STACK?', 'stack'],
  ['Can you integrate Klaviyo with Shopify?', 'integrations'],
  ['Can you build a loyalty program?', 'integrations'],
  ['Can Alex set up email flows?', 'integrations'],
  ['We need subscriptions and custom bundles.', 'integrations'],
  ['Can you help with a third-party integration?', 'integrations'],
  ['Can Alex handle payment gateway integration?', 'integrations'],
  ['Can you improve my Shopify store performance?', 'performance'],
  ['Our site is slow. Can you help?', 'performance'],
  ['Do you do CRO?', 'performance'],
  ['How can we improve our conversion rate?', 'performance'],
  ['Can you improve Core Web Vitals?', 'performance'],
  ['Hi, is Alex available for work?', 'availability'],
  ['Can we hire you for a Shopify project?', 'availability'],
  ['Are you open to full-time roles?', 'availability'],
  ['Are you taking on new projects?', 'availability'],
  ['I want to work with Alex on a store.', 'availability'],
  ['Are you available for remote freelance work?', 'availability'],
  ['Where is Alex based?', 'location'],
  ['What timezone are you in?', 'location'],
  ['Do you work remotely?', 'location'],
  ['Where are you located and what are your working hours?', 'location'],
  ['Can we discuss timezone overlap?', 'location'],
  ['How much experience does Alex have?', 'experience'],
  ['How long have you been a developer?', 'experience'],
  ['Is Alex a senior developer?', 'experience'],
  ['How many Shopify stores have you built?', 'experience'],
  ['Has Alex been a team lead?', 'experience'],
  ['Where can I see your work?', 'portfolio'],
  ['Show me your previous projects.', 'portfolio'],
  ['Do you have Shopify case studies?', 'portfolio'],
  ['What brands has Alex worked with?', 'portfolio'],
  ['Can I see examples of stores you built?', 'portfolio'],
  ['Tell me about your previous work.', 'portfolio'],
  ['How long does a Shopify store take?', 'timelines'],
  ['Can a website refresh be ready in 2 days?', 'timelines'],
  ['How quickly can you build a new store?', 'timelines'],
  ['What is the timeline for a headless migration?', 'timelines'],
  ['Could you meet a tight deadline?', 'timelines'],
  ['How much would a new Shopify store cost?', 'pricing'],
  ['What is the cost of a migration?', 'pricing'],
  ['How much does a bot like this cost?', 'pricing'],
  ['What are your hourly rates?', 'pricing'],
  ['What do you charge for ongoing support?', 'pricing'],
  ['What are the payment terms?', 'pricing'],
  ['Can I get a quote for a headless build?', 'pricing'],
  ['How do you work with clients?', 'process'],
  ['What is the process for a new store?', 'process'],
  ['How do we get started?', 'process'],
  ['What happens during onboarding?', 'process'],
  ['What services does Alex offer?', 'services'],
  ['What do you do?', 'services'],
  ['What can Alex help with?', 'services'],
  ['Do you offer maintenance after launch?', 'support'],
  ['Can Alex look after my store?', 'support'],
  ['Is ongoing Shopify support possible?', 'support'],
  ['Why hire Alex?', 'why-alex'],
  ['Why should we hire you as our senior developer?', 'why-alex'],
  ['What makes Alex different?', 'why-alex'],
  ['Why work with Alex?', 'why-alex'],
  ['Which industries do you work with?', 'industries'],
  ['Have you built stores for skincare brands?', 'industries'],
  ['Do you know the jewellery niche?', 'industries'],
  ['What types of brands do you work with?', 'industries'],
  ['How can I contact Alex about hiring?', 'contact'],
  ['What is your email address?', 'contact'],
  ['Where can I get in touch?', 'contact'],
  ['How do I reach you?', 'contact'],
  ['Can I book a call with Alex?', 'contact'],
  ['Where can I download your CV?', 'cv'],
  ['Can you email me Alex’s résumé?', 'cv'],
  ['Does Alex speak English?', 'languages'],
  ['What languages do you speak?', 'languages'],
  ['Do you speak Spanish or German?', 'languages'],
  ['Can you share client references?', 'references'],
  ['What do your clients say?', 'references'],
  ['Do you have testimonials?', 'references'],
  ['Want a bot like this?', 'bots'],
  ['Can you build a chatbot for my site?', 'bots'],
  ['Can I have an assistant like Nova?', 'bots'],
  ['Who built Nova?', 'bots'],
  ['Can you build an AI assistant for Shopify?', 'bots'],
  ['Can I get Nova for my website?', 'bots'],
  ['Who is Alex Keegan?', 'about-alex'],
  ['Tell me about Alex.', 'about-alex'],
  ['Who’s Alex?', 'about-alex'],
  ['Who are you?', 'about-nova'],
  ['What is Nova?', 'about-nova'],
  ['Are you Alex?', 'about-nova'],
  ['Tell me about yourself.', 'about-nova'],
  ['Hi!', 'greetings'],
  ['Hello Nova!', 'greetings'],
  ['Good morning', 'greetings'],
  ['Hey, how are you?', 'greetings'],
  ['Thanks!', 'goodbye'],
  ['Thank you Nova.', 'goodbye'],
  ['See you later!', 'goodbye'],
  ['Hey Nova, what is Alex’s email address?', 'contact'],
  ['Thanks, can I see your portfolio?', 'portfolio'],
  ['Hello, how much does Shopify development cost?', 'pricing'],
  ['Hi Nova, do you use Shopify?', 'shopify'],
  ['Pricing and timelines?', ['timelines', 'pricing']],
  ['Shopify or React?', ['shopify', 'headless']],
  ['What is the weather tomorrow?', 'fallback'],
  ['Where is my order?', 'fallback'],
  ['Can you check my shipping status?', 'fallback'],
  ['Do you offer cooking lessons?', 'fallback'],
  ['What tool should I use to repair a bike?', 'fallback'],
  ['Which program is on television?', 'fallback'],
  ['Who was the previous president?', 'fallback'],
  ['I have a question about my work hours.', 'fallback'],
  ['Can you review my homework?', 'fallback'],
  ['Can you recommend a restaurant?', 'fallback'],
  ['Who am I?', 'fallback'],
  ['Hi Nova, what is the capital of France?', 'fallback'],
  ['Tell me the time in Paris, thanks.', 'fallback'],
  ['Will shipping cost extra?', 'fallback'],
  ['Hello, who is Alex Keegan?', 'about-alex'],
  ["Tell me about Alex's stack.", 'stack'],
  ['Do Shopify subscriptions need custom integration?', 'integrations'],
  ['Does Shopify support checkout extensibility?', 'shopify'],
  ['What is the price of CRO work?', 'pricing'],
  ['What is the cost of a website refresh?', 'pricing'],
  ['How much for a new store?', 'pricing'],
  ['What technologies do you use for Shopify Plus?', 'stack'],
  ['What programming language do you code in?', 'stack'],
  ['Can you build a Shopify store from scratch?', 'new-builds'],
  ['Can Alex help build an online store?', 'new-builds'],
  ['What is your availability for a Shopify migration?', 'availability'],
  ['What is your previous experience as a developer?', 'experience'],
  ['Hi there!', 'greetings'],
  ['Hi Nova, who is Alex?', 'about-alex'],
  ['What do you charge for a chatbot?', 'pricing'],
  ['Hi Nova, are you available for freelance work?', 'availability'],
  ['Can Alex help with my store after launch?', 'support'],
  ['What is the cost of shipping?', 'fallback'],
  ['What is the weather like where you live?', 'fallback'],
  ['Does this spaceship have a pilot?', 'fallback'],
  ['What is the reaction time of a cat?', 'fallback'],
  ['What time does the show begin?', 'fallback'],
  ['Tell me about the solar system.', 'fallback'],
  ['Can you fix my microwave?', 'fallback'],
  ['work', 'fallback'],
  ['site', 'fallback'],
  ['where', 'fallback'],
  ['hours', 'fallback'],
  ['tool', 'fallback'],
  ['program', 'fallback'],
  ['previous', 'fallback'],
  ['Can you build me a website?', 'new-builds'],
  ['I need a Shopify store for a new brand.', 'new-builds'],
  ['Do you have experience with Shopify?', 'experience'],
  ['What can you do?', 'services'],
  ['How can Alex help me?', 'services'],
  ['Tell me about you.', 'about-nova'],
  ['What is this?', 'about-nova'],
  ['What is this site built with?', 'stack'],
  ['Who made this?', 'bots'],
  ['Who built this assistant?', 'bots'],
  ['Shopify Shopify Shopify: what is your stack?', 'stack'],
  ['  HELLO,   NOVA!  ', 'greetings'],
  ['Can you work full–time?', 'availability'],
  ['What is Alex’s e-mail address?', 'contact'],
  ['', 'fallback'],
];
let failed = 0;
for (const [question, expected] of questions) {
  const matched = Array.from(bot.matchQuestion(question), entry => entry.id);
  const expectedIds = Array.isArray(expected) ? expected : expected === 'fallback' ? [] : [expected];
  try {
    assert.deepEqual(matched, expectedIds);
    const response = bot.answer(question);
    if (!matched.length) assert.equal(response, bot.FALLBACK);
    else if (matched.length === 1) assert.equal(response, bot.KB.find(entry => entry.id === matched[0]).a);
    else assert.match(response, /^Are you asking about /);
  } catch (error) {
    failed++;
    console.error(JSON.stringify(question), 'expected:', expected, 'actual:', matched);
  }
}
const chipIds = ['bots', 'stack', 'availability', 'portfolio', 'contact'];
for (let index = 0; index < bot.CHIPS.length; index++) {
  for (const input of bot.CHIPS[index]) {
    try { assert.deepEqual(Array.from(bot.matchQuestion(input), entry => entry.id), [chipIds[index]]); }
    catch { failed++; console.error('Chip failed:', input); }
  }
}
assert.equal(bot.KB.length, 27, 'Keep all FAQ categories');
assert.equal(new Set(bot.KB.map(entry => entry.id)).size, 27);
assert.equal(bot.CHIPS.length, 5);
const reference = fs.readFileSync(path.join(root, 'BOT-REFERENCE.md'), 'utf8');
for (const text of [bot.GREETING, bot.FALLBACK]) assert(reference.includes(text));
for (const entry of bot.KB) {
  assert(questions.some(([, expected]) => expected === entry.id), `Missing coverage: ${entry.id}`);
  assert(!/\b(?:I am|I'm|I build|I work|my CV|my stack)\b/.test(entry.a) || entry.id === 'about-nova', `Assistant identity: ${entry.id}`);
  const section = reference.split(`ID: \`${entry.id}\``)[1]?.split('\n## ')[0];
  assert(section?.includes(entry.a), `Documented answer: ${entry.id}`);
  for (const field of ['k', 'q', 'x']) {
    if (entry[field]) assert(section.includes(JSON.stringify(entry[field], null, 2)), `Documented ${field}: ${entry.id}`);
  }
}
console.log(`${questions.length} visitor questions + ${bot.CHIPS.length * 2} chip label/input checks: ${failed} failures.`);
if (failed) process.exitCode = 1;
// Validate all inline JavaScript and the deployed CSP hashes as part of the same check.
const csp = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).headers[0].headers.find(header => header.key.startsWith('Content-Security-Policy')).value;
for (const [, attrs, source] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (/\bsrc=/.test(attrs) || !source.trim()) continue;
  new vm.Script(source);
  const hash = crypto.createHash('sha256').update(source).digest('base64');
  assert(csp.includes(`'sha256-${hash}'`), 'CSP must match inline JavaScript');
}
