# Translation review needed

Hindi (`src/locales/hi.json`) and Telugu (`src/locales/te.json`) were written for this build, aiming for short, natural, student-friendly
phrasing rather than word-for-word output. **A native speaker should review everything before release.** Items I was least sure of:

| Key | English | Concern |
| --- | --- | --- |
| `story.b3.*` | "Nani" / grandmother | Hindi uses नानी (maternal grandmother), Telugu uses అమ్మమ్మ. Confirm the relationship wording fits the intended family context (dadi / nanamma?). |
| `story.b3.quote` | "This is what we could save. The rest is up to you." | Tone: gentle and plain. Telugu "మేము ఇంతే దాచగలిగాం" may read slightly formal; consider "మేం". |
| `pillars.invest.*` | "compounding" | Hindi चक्रवृद्धि and Telugu కాంపౌండింగ్ (transliterated) chosen for familiarity; check what students actually say. |
| `pillars.safe.hook` | "Spot the scam before it spots you." | Wordplay; Hindi/Telugu versions keep the idea, not the pun. |
| `pillars.save.hook` | "Two bad weeks are coming." | "बुरे हफ़्ते" / "కష్టమైన వారాలు": check register. |
| `recap.sampleTitle` | "Opportunity cost" | Hindi अवसर लागत, Telugu అవకాశ వ్యయం: formal textbook terms; a simpler explainer phrase may land better. |
| `personas.earner.name` | "First-generation earner" | Hindi पहली कमाई वाला / Telugu మొదటి సంపాదన are loose; the English concept (first in the family to earn) is not fully carried. |
| `hud.*` Lite mode | "Lite mode" | Left as लाइट / లైట్ (loanword). |
| `buttons.rewind` | "Rewind" | Left as रिवाइंड / రివైండ్ (loanword). |
| `story.b4.stamp` | "DUE" | बाकी / బాకీ (= outstanding). Confirm it reads right on a fee receipt. |

Text rendered inside the scene art (shop signs, OFFER! board) comes from `world.*` keys in the same files.

## Added with the game host (neutral wording, needs a native speaker)

| Key | English | Concern |
| --- | --- | --- |
| `host.*`, `result.*`, `state.*`, `skills.*` | exit, play, loading, error, banner, result labels, skill names | All Hindi and Telugu in this block were drafted for this build and need review, especially the register of the error text |
| `state.bright` / `state.dim` / `state.flicker` | Full / Dim / Faint | Chosen to be neutral about the final visual theme. Hindi पूरी / हल्की / फीकी and Telugu పూర్తి / మసక / మందం may read oddly for "how fully a pillar counts" |
| `result.happy` | Happy Index | Hindi खुशी सूचकांक, Telugu సంతోష సూచిక: check these are natural for a student |
| `skills.riskSense`, `skills.scamSense` | Risk sense, Scam sense | Short coined phrases; confirm what students actually say |
| `host.placeholder.*` | Placeholder game, Great run... | Developer-facing only; can be left in English |

## Added with the progress, Happy Index and life-moment screens (neutral wording, needs a native speaker)

| Key | English | Concern |
| --- | --- | --- |
| `progress.*` | summary lines such as "{{lit}} of {{total}} complete, {{dim}} dim" | Hindi and Telugu word order and the numbers-in-the-middle phrasing were drafted; check they read naturally, especially "dim" (हल्के / మసక) and "faint" (फीके / మందం) |
| `progress.penalty.*` | "Some pillars count for less..." | Tone must stay gentle and never blame; please check the Hindi and Telugu do not sound like a scolding |
| `happy.band.*` | Glowing, OK, Tired | Tired as a state of the player (थका हुआ / అలసట) versus tired as a hint to rest; confirm both read well |
| `happy.tiredNote`, `happy.toast.*` | break and low-Happy wording | Check "break" (ब्रेक / విరామం) is what students say |
| `moments.*` | A chai with friends, A festival treat, Rest at home | Names and one-line descriptions; the festival one should feel natural without naming a specific festival |
| `balance.*` | "You and your future", why both matter, next-step lines | One plain sentence that must not sound like financial advice |
| `wire.*` | Wireframe index (dev) | Developer-only page; deliberately left in English in every language file |

## Added with Onboarding and Hub (Prompt B)

| Key | English | Concern |
| --- | --- | --- |
| `onboarding.*` | Welcome, The Goal, Who are you, Four Pillars, Stay Happy, How to move | Ensure the tone is encouraging and clear, especially "Let's earn the rest" and "Money isn't everything". |
| `hub.*` | Money Mohalla Hub, Look after yourself, Teaches, Time, mins, Best Score, CTA buttons | Check "Look after yourself" translates well as a button label. The hub taglines (`plan.tagline`, etc) must sound natural. |
| `coach.*` | Tips, Dismiss All, Your Goal, Stay Happy, Progress, The Hub | Very short tooltip-style text; ensure the translation is punchy. |
| `avatars.*`, `festivals.*` | Boy, Girl, Diwali, Eid, etc | Ensure cultural appropriateness and spelling for festival names. |

## Festival Countdown (Pillar 1)

Strings live in `src/games/showdown/content/{en,hi,te}.json` (namespace `showdown`). A test checks every key and `{{placeholder}}`
exists in all three files, but not the wording. Please review especially:

| Key | English | Concern |
| --- | --- | --- |
| `jars.*` | Needs, Gift, Fun, Spare | Telugu uses అవసరాలు / బహుమతి / సరదా / మిగులు; check these read naturally for money jars. |
| `borrow.*` | "borrow from another jar" | Rendered as उधार लो / అప్పు తీసుకో; it means moving money between your own jars, so check it doesn't sound like a loan from a person. |
| `ideas.*.name` | Opportunity cost, Emergency buffer, Comparison shopping | Plain phrases were used instead of textbook terms; confirm they land with students. |
| `shops.*.hello`, `haggle.*` | Shopkeeper lines | Should sound like light, natural Hyderabadi bazaar talk in each language. |
| `festivals.*.items` | Item names per festival | Check each festival's items with someone who celebrates it. |
| `invites.*` | Friends' messages | Casual register ("bhai", "bro"); check it matches how 16-year-olds actually talk. |
