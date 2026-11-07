# Pocket Panic: Save & Manage Game Design Document

Oct 11, 2026 · @Maithily · v2.1: the month is the boss

## 1. Vision

**Pocket Panic is a 6 minute boss fight where the boss is the month.** A student splits ₹600 into three jars, then a Hyderabad Irani café throws one month at them in four escalating phases (temptation, little leaks, people, and finally the rain), and Chacha's ledger shows exactly where the money went and why. "Panic" is the feeling of money pressure, not violence, and in this café the cure is always the same: tea first, panic later. Working title; rename freely.

**The promise to the player:** spend however you like the first time. By the second time you will have worked out a strategy yourself, and the game will show you the proof.

> **What changed in this version (v2).** The first draft was a well designed scenario simulator with no signature gameplay. This version keeps about 90 percent of the learning and system design and changes the 10 percent that decides how it feels to play: (1) the month is now a boss with named phases, escalation and a finale; (2) there are real needs, so "never spend" stops being the best strategy; (3) ignored wants build visible pressure (the fizz) instead of silently doing nothing; (4) every payment asks "where should this money come from?"; (5) vendors no longer expire on a hidden timer; (6) Chacha's interest-free Book is gone so borrowing always has a price; (7) the dashboard reports *observed behaviour*, not mastery; (8) a clear hackathon build scope is set. After review, v2.1 also made the fizz a record of the player's own refusals (no drift, no visible numbers, a safe margin) and made Big Night read those refusals back. The change log is in section 18.

### The big idea: one month at Chacha's café

The whole game happens at one marble-topped table in a Hyderabad Irani café. **Chacha, the owner, is the unnervingly perceptive man who has watched every kind of customer make every kind of money decision, and who has never once raised his voice.** Nothing surprises him. He does not lecture. He keeps a big ledger and writes dry remarks in its margin, and those margin notes are how the game gives feedback.

Everything that tests the player arrives through the café, so every mechanic has a reason to exist:

- the street vendors who pass the window are the temptations (and the *wants*)
- the three small bills that arrive on certain days are the *needs*: you cannot pass them, you can only choose where the money comes from
- the goli soda bottles on the table are the *fizz*: wants you keep refusing slowly build pressure until the marble pops
- Yusuf's biscuit and samosa trolley is the small spending that adds up
- a chai left to cool in its saucer is the 10 second wait before you buy
- a friend walking in is the request to lend
- the monsoon cloud outside the window, visible from the start and creeping closer each phase, is the surprise
- the three jars are things you find in a café: a steel tumbler, a clay gullak on the high shelf, an umbrella stand by the door

### The month is the boss

**Nobody attacks the player. The month itself is the opponent, and it shows up as a sequence of patterns that test the decisions made at payday.** We borrow only the *grammar* of a boss fight: a named opponent, a loadout before the fight, phases that escalate, a signature move per phase, a spectacular finale, a knockout moment and a scorecard. There is no health bar, no damage, no game over and no violence. The "damage" is always the player's own earlier choices coming due, shown in rupees.

| Boss-fight grammar | In Pocket Panic |
| --- | --- |
| The boss | **The Month**, a 30 day bar across the top. Its silhouette is the monsoon cloud in the window, which creeps closer every phase. |
| Loadout | **Round 1, Payday.** Split ₹600 across the three jars before the fight starts. Nothing else unlocks until you do. |
| Phase 1: **Temptation** (Round 2, the window) | Vendors come in patterns: one at a time, then a pair you cannot both afford. Signature move: **Let it cool**, the saucer parry. The first bill arrives (Auto fare). |
| Phase 2: **Little Leaks** (Round 3, the trolley) | Yusuf's trolley: a stream of tiny charges that line up behind each other. Signature move: **OK or Skip** at the pay line, then the plates tower. The second bill arrives (data recharge). |
| Phase 3: **The People** (Round 4) | Two kinds of social pull in one phase: **Teja** asks for money, and if a fizz bottle has popped, the **Big Night** invitation arrives. The third bill arrives (lunch on exam day). Signature move: **say it kindly** (pick how to answer). |
| Phase 4: **The Rain** (Round 5, the finale) | The cloud breaks. Thunder freezes the café, the phone cracks, and the camera pulls back to show every earlier choice sitting on the table. Signature move: **build the bill** from the sources you set up. |
| Knockout | A stamp thunks on the wish card: **MONTH SURVIVED** (or **NOT YET**). It is a stamp, never a death. |
| Scorecard | **The Tally.** Instead of a grade it answers one question: *what kind of money manager were you this month?* (section 12). |
| Rematch | **Replay.** Same table, new month, one deliberate change. |

**Escalation without a clock.** Tension builds through *density and stakes*, not timers: Phase 1 offers one thing at a time, Phase 2 lines up a queue, Phase 3 puts two social pulls on the table at once, Phase 4 asks everything of the player at once. The café stays warm and calm to look at while the decisions get heavier. Pause freezes everything (section 5).

### Design pillars

1. **The mechanic is the lesson.** Each of the nine Save & Manage ideas is something the player does with their hands (drag, hold, tap, tag), never something they read first.
2. **Consequence before vocabulary.** The concept name ("emergency fund", "cost of borrowing") appears only after the player has felt it, on a recap card.
3. **No wrong answers, only visible trade-offs.** Nothing turns red and nothing says "bad". The tally shows what each choice cost and what it bought. *There is also no single perfect run*: at least four very different playstyles can reach the goal (section 3).
4. **Replay is the teacher.** Run 2 is where learning shows. The game compares run 1 and run 2 and measures the change.
5. **The month is the boss.** Named phases, escalating density, a finale, a knockout stamp. Cuphead-style structure, original characters and art, nothing copied.
6. **Warm world, rising stakes.** Calm to look at, increasingly demanding to play. Never frantic, never shouty, no hidden timers.
7. **Where should this money come from?** The deeper question behind every payment is not "can I afford it?" but "which jar pays, and what does that cost me?"

### What this game is not

| It is not | What we do instead |
| --- | --- |
| A violent boss fight | The month is the boss in *structure only*: named phases, patterns, a finale, a knockout stamp. There is no health bar, damage, enemy or game over. Vendors, bills, friends and rain turn up and the player decides. |
| A spreadsheet in a costume | No weeks, days or budget tables. One month, compressed to about 6 minutes, played by moving coins. |
| A "never spend" game | Spending on things you value is a valid way to win, and refusing everything has its own visible price (the fizz). The lesson is *notice and choose*, not *abstain*. |
| A game where wants secretly become needs | Wants **create pressure**, they do not turn into needs. Some wants can be ignored forever with no consequence. Only real needs (the three bills) are non-negotiable. |
| A quiz | Three short *predictions* (guesses, never graded) and one "worth it?" self-review. No marks. |
| Shaming | The game speaks in "here is what happened", never "you failed". Every ending offers Replay. |
| Real financial advice | The goal items, shops and lender are fictional. ₹600 is a made-up game economy chosen to make trade-offs visible, not a claim about real incomes. |

### How you win

**You win by reaching your personal goal while keeping enough money available to handle the month.** Specifically: Save is ₹250 or more at the Tally, every bill was paid, and you are not left in costly debt. Having the most money left is *not* the win condition, and an overshoot earns nothing extra. If saving everything were rewarded, students would learn "never spend", which is not what this pillar teaches.

The lesson in one line:

> Money is limited. Decide what is worth spending on, prepare for surprises, and know where each rupee comes from.

The Tally's headline question is not "did you win?" but **"what kind of money manager were you this month?"**, answered with a description of what the player did, never a ranking.

## 2. Learning design

**The game teaches nine ideas, and each one is something the player does, not something they read.** The list of nine comes from your source brief as you summarised it; check the wording against the original before the pitch.

### Learning objectives

After one play, a student can:

1. Put money aside *before* spending it (pay yourself first).
2. Say where their money went (track spending).
3. Explain why tiny spends matter (small spends add up).
4. Explain why you keep a cushion (emergency fund).
5. Expect that surprises will come, even if you cannot know which (plan for surprises).
6. Pause before buying (wait before you buy).
7. State what a purchase does to a goal (goals and trade-offs).
8. Compare what you get with what you pay back (cost of borrowing).
9. Decide how much to lend a friend, and what that money is doing meanwhile (lending to friends).

**A supporting idea runs through all nine: telling a need from a want, and noticing that pressure builds.** It is not a tenth concept. It is the layer that stops "never spend" from being the best strategy, and it feeds objective 7 (goals and trade-offs): every payment asks "where should this money come from?"

### Concept to mechanic

| # | Concept | What the player does | Round | The "aha" moment | What we measure |
| --- | --- | --- | --- | --- | --- |
| 1 | Pay yourself first | Splits the month's money into three jars before anything can be bought | R1 | Spending is locked until the split is confirmed. Money in Save is safe from temptations. | Share put in Save |
| 2 | Track spending | Chacha's ledger logs every coin, with a margin note. The Tally sorts it at the end. | R1 to R6 | "I spent ₹90 on things I did not notice." | Times the ledger was opened; final estimate vs actual |
| 3 | Small spends add up | Guesses the total of tiny charges, then watches them merge | R3 | Guess vs actual shown side by side | Size of the guess error |
| 4 | Emergency fund | Decides the Emergency jar size at payday, before knowing the surprise | R1, R5 | The surprise is covered, or it is not | Emergency share; covered or not |
| 5 | Plan for surprises | A dark monsoon cloud sits outside the window from Round 1, with unknown contents | R1, R5 | "It came, and I had no idea what size." | Did Emergency get any money before the cloud arrived |
| 6 | Wait before you buy | Leaves an item to cool in a saucer for 10 seconds, like chai | R2 | Some items stop mattering after the wait, and some do not. Wants refused again and again keep fizzing. | Holds used; items dropped after a hold; big buys made without a pause |
| 7 | Goals and trade-offs | Answers "where should this money come from?" for every bill, want and the rain, and watches the goal bar move with each choice | R2 to R6 | "That bill moved my goal back by ₹20." | Goal reached or not; Save withdrawals; sources chosen for bills |
| 8 | Cost of borrowing | Quick Cash pops up on the phone as one more way to pay, with a fine-print flip. Every other source has a visible price; borrowed money costs more later. | R5 | ₹150 now becomes ₹200 later | Fine print opened; loan taken |
| 9 | Lending to friends | Teja asks for ₹100 | R4 | The lent money shows as "out, not back" in the Tally | Amount lent; share of Spend lent |

### The learning loop (inside every round)

1. **Predict.** A short guess before the round reveals something (R0, end of R3, before the loan repays).
2. **Decide.** The player acts by moving, holding or tapping coins.
3. **Consequence.** Instant, visual and in rupees: jars change, the goal bar moves, the ledger writes a line.
4. **Experiment.** On Replay the player picks one thing to change on purpose and plays again.
5. **Learn.** A recap card names the concept only now. Cards collect in My Notebook.

### Recap card rule

Every recap card has exactly three lines in this order: **What happened** (their own numbers), **Why it matters** (one plain sentence, no jargon), **Try this** (one real-life action for this week). Nothing longer.

## 3. Economy and rules

**The player gets ₹600 once, aims to have ₹250 saved at the end, and ends up with about ₹120 of genuinely free money after the goal, three bills and the rain are covered.** That gap is deliberate: the month asks for far more than ₹120 (wants, small spends, a friend, a Big Night), so every choice is a real trade-off. All amounts are fictional and labelled "illustrative" on screen. ₹600 is a game economy, not a claim about what students earn.

**The budget in one line:** ₹600 income, minus ₹250 goal, minus ₹80 of bills, minus ₹150 of rain (₹100 with a phone cover) leaves roughly ₹120 to spend on everything you want.

### Core numbers

| Setting | Value | Why |
| --- | --- | --- |
| Monthly money (one payday) | ₹600 | A fictional economy, big enough to split three ways and small enough that nothing is free |
| Goal | ₹250 (player picks one of three items) | 42 percent of income: reachable, but not by ignoring everything else |
| Coin size | ₹10 | 60 coins on screen at payday; easy to drag |
| Needs (three bills) | ₹20 Auto fare (Day 3), ₹30 data recharge (Day 9), ₹30 lunch on exam day (Day 20): ₹80 in total | Small, believable, and impossible to pass |
| Surprise (run 1) | ₹150 (₹100 with a phone cover) | Large enough that the Emergency jar matters |
| Quick Cash terms | ₹50 costs ₹70, ₹100 costs ₹135, ₹150 costs ₹200 | The extra is about a third on a few days' loan: shows the cost clearly |
| Friend request | ₹100 | Big enough to hurt if it is not available later |
| Big Night | ₹60 (₹100 if it carries over from a previous month) | An event built from the things the player refused, big enough to compete with the goal |
| Fizz bottles | FUN starts at 25, FRIENDS at 35, pops at 100. The player never sees the numbers, only five visual stages. | Two slow-building records of what the player keeps refusing (see below) |
| Hold time | 10 seconds of steam | Long enough to cool off, short enough not to bore |
| Round count | 6 plus a short Round 0, grouped as a loadout and four boss phases | Fits a 6 minute run (the round times add up to about 6 and a half minutes, including the three bills) |

### The five places money can be

| Place | What it is | Counts toward the goal? |
| --- | --- | --- |
| **Spend jar** (the steel tumbler on your table) | Money you may use freely | No |
| **Save jar** (the gullak: a clay pot Chacha keeps on the high shelf, in sight but out of reach) | Money set aside for the goal | **Yes** |
| **Emergency jar** (the umbrella stand by the door) | Money kept for surprises. Unused emergency money is carried to next month and shown as "cushion kept". | No |
| **Lent out** | Money a friend is holding | No, until it comes back |
| **Quick Cash** | A phone pop-up offering money you do not have, with a price. It creates a repayment. | No |

### Where should this money come from? (the source rule)

**Every payment (a bill, a want, the rain, Big Night) opens the same small question: which jar pays?** The same ₹50 has four different prices, and the player always sees the price before choosing.

| Source | What taking from it does | Shown to the player as |
| --- | --- | --- |
| **Spend** | Nothing else changes | "From the tumbler. No change." |
| **Save** | The goal bar moves back by the amount | "Your goal moves: ₹{a} to ₹{b}." |
| **Emergency** | The cushion shrinks | "This is your cushion. Something may be coming." |
| **Quick Cash** | You owe more later (₹50 becomes ₹70). Offered for bills and the rain, never for wants. | "₹{x} now. You pay ₹{y} on payday. Fine print." |

The game never recommends a source. Spending from Spend is not "good" and borrowing is not "bad": each is shown with its price, and the Tally shows what the player chose.

### Needs, wants and pressure

**Three kinds of things ask for money, and they behave differently on purpose.** Telling them apart is a real skill, and the game never turns one into another.

| Kind | Examples | Behaviour | Why it exists |
| --- | --- | --- | --- |
| **Need (a bill)** | Auto fare ₹20, data recharge ₹30, lunch on exam day ₹30 | Arrives on a fixed day as a paper bill. It cannot be passed or cooled. The player only picks the source. | So refusing everything is impossible, and a player who hoarded in Save has to pull from it and watch the goal move: the clearest answer to "why do we separate money into jars?" |
| **Ignorable want** | Sunglasses, jacket, biryani, phone cover | Buy it, cool it, or pass it. Nothing builds up. Passing costs nothing, forever. | Most wants really can be skipped. The game must not teach "if you refuse, bad things happen". |
| **Fizz want (a want with pressure)** | Game pack, cricket, match ticket, group gift, some trolley items | Each is tagged FUN or FRIENDS. Declining it adds to that bottle. Buying it releases pressure. | Real wants about fun and friends build up when ignored. Small, intentional spending can prevent a bigger trade-off later. |

**The fizz (a goli soda bottle for each pressure) is a record of your own refusals, not a stat to manage.** Two bottles stand on the table: FUN (orange) and FRIENDS (teal). Each time the player says no to something they might care about, a little more fizz builds; when they say yes, it settles. At 100 the marble pops.

| Event | FUN or FRIENDS bottle |
| --- | --- |
| Decline a fizz item (Pass, or cool it and say no) | Rises by that item's *pull* (15 to 40) |
| Buy a fizz item | Falls by 1.5 times its pull, never below 0 |
| Reaches 100 | **POP.** At the start of Phase 3 the Big Night arrives (once per bottle per month) |

There is **no drift and no clock** on the fizz. It rises only because of what the player declined, so a pop always has a reason the player can point to: "I kept saying no."

**Design rule: the fizz is a consequence system, never an optimisation bar.** To stop students (or the pitch) turning it into "keep FUN at 47 to win":

- The player **never sees a number**. The bottle has five visual stages (calm, simmering, bubbling, fizzing, and the pop), with the marble rattling in the neck at the fourth.
- There is **no target zone** and no reward for keeping it low. Nothing in the Tally scores it.
- Staying in is free and always allowed. The fizz is described in words, never ranked.

| Stage | Internal value | What the bottle looks like |
| --- | --- | --- |
| Calm | 0 to 24 | Still, no bubbles |
| Simmering | 25 to 49 | A few bubbles |
| Bubbling | 50 to 74 | A steady stream |
| Fizzing | 75 to 99 | Foam, the marble rattles |
| Pop | 100 and over | The marble shoots out and rolls across the table |

**The arithmetic in the hackathon build (it must pop for a player who refuses every FUN offer, with room to spare).** FUN starts at 25. Refusing the Game pack adds 40, and refusing the three FUN trolley items (cold drink, in-game coins, ice cream) adds 15 each: 25 + 40 + 45 = **110**, a margin of 10. Buying the Game pack drops the bottle to 45 and buying even one trolley FUN item drops it to about 73, so in the hackathon build **only a player who refuses (nearly) everything sees the Big Night**, which is the point. A test protects this margin (section 17).

**Big Night is built from what the player refused.** It is not "the meter filled, next screen". The marble pops, the invitation arrives, and the things the player passed on appear around it as faint ghost icons. Chacha reads them back by name: "You passed on the game pack. And the cold drink. Now this." The player should feel *"I created this"*, not *"the game triggered the next level."*

| Choice | Cost | What happens to the fizz | Ledger note |
| --- | --- | --- | --- |
| **Go** | ₹60 from any source | Bottle resets to 0 | "Went. We will see if it was worth it." |
| **Join for half** | ₹30 from any source | Bottle drops to 50 | "Half and home early. Sensible, or sad. Only you know." |
| **Stay in** | ₹0 | Bottle stays at 100. **It carries into next month, and next month's Big Night is bigger (₹100) and arrives on Day 1.** | "Stayed in. The fizz stayed, too." |

The consequence of staying in is never a money penalty and never a lecture: the money is kept, and the pressure is still on the table. The player sees it again in the Tally and, if they replay, at the start of Month 2. That is the point: refusing everything is allowed, and it has a visible price that is not the same as the price of spending.

### Rules of play

1. At Payday all ₹600 must be placed in the three jars before anything else unlocks. Nothing can be left floating.
2. Spending is only possible from the jars. Every payment asks "where should this come from?" and shows the price of each source (the source rule above).
3. If Spend runs short, the game offers Save or Emergency and shows what each costs. Taking from Save moves the goal bar back. Taking from Emergency shows a gentler line: "This is your cushion. Something may be coming."
4. **Needs cannot be passed.** A bill arrives on its day (3, 9 and 20) and must be paid before the phase continues. The player chooses the source.
5. **Vendors never expire on a hidden clock.** An offer stays on the window until the player decides. The walking animation is decoration, not a deadline. Pause freezes the whole café.
6. Any item at the window can be **cooled**: it goes into one of two saucers and its steam fades over 10 seconds. When the steam is gone Chacha asks "Still want it?". Cooling is free. One item (the match ticket) really does sell out while it cools, so waiting is a check, not a rule.
7. Yusuf's trolley items (Round 3) are tiny charges. Each item rolls to the pay line and waits there until tapped **OK** (pay) or **Skip**. Nothing times out in the default mode.
8. The goal bar always shows Save divided by ₹250 and moves with every transfer.
9. Chacha's ledger writes a line for every rupee that moves. It can be opened at any time and never costs anything.
10. Quick Cash repayment is collected at the Tally from Spend first, then Emergency, then Save. If that is not enough, the rest is shown as "still owed". There is no interest-free lender in this version: borrowing always has a price on it.
11. Money lent to a friend leaves Spend and cannot be used until it returns. In this game it does not return before the Tally.
12. There is no game over and no whole-game timer. The Pause button is always visible and freezes everything, including saucers and the cloud.

### Reference playstyles (verified, Month 1, the hackathon build content)

Every row was run through the rules above. They show that several different strategies reach the goal, that spending is not punished and hoarding is not rewarded.

| Style | Payday split (Save / Emergency / Spend) | What they did | Save at the end | Ending |
| --- | --- | --- | --- | --- |
| A. Shelf-first, calm | 250 / 100 / 250 | Bought a phone cover, paid the small chai and samosa, skipped the fizz items, joined the Big Night for half | ₹250 | Goal reached |
| B. Spends early | 250 / 50 / 300 | Bought the game pack, the match ticket and the cover, then said OK to every trolley item until Spend ran out. The last bill and the rain reached into Save | ₹170 | Almost there |
| C. Vault | 500 / 100 / 0 | Refused every want and "stayed in" at the Big Night. Spend was empty, so every bill came out of Save; the rain took the ₹100 cushion plus ₹50 of Save | ₹370 | Goal reached, with ₹0 spent on wants, a popped FUN bottle and a Big Night stayed in on |
| D. Cushion-light | 300 / 0 / 300 | Bought the pack and the cover and kept no emergency money. Buying the pack kept the FUN bottle quiet, so no Big Night came. | ₹290 | Goal reached |
| E. Quick-cash reliant | 250 / 0 / 350 | Bought most things, covered the rain with Quick Cash | ₹50 | Not yet, with ₹50 extra paid to borrow |

What this table is for: the *winning* styles (A, C, D) use opposite jars, so there is no single right split. Style C wins the goal but its FUN bottle pops and it stays in, which the Tally names and Month 2 brings back bigger. Style D shows the other side: one small yes early kept the bottle quiet and no Big Night ever arrived. Style B and E show where a month goes when wants and borrowing are not noticed, and both can be replayed with one change.

### Endings (decided at the Tally)

| Ending | Condition | Headline |
| --- | --- | --- |
| Goal reached | Save is ₹250 or more and nothing is owed | "Goal reached. Here is how you did it." |
| Goal reached, at a cost | Save is ₹250 or more after paying back a Quick Cash loan | "Goal reached. The loan cost you ₹{e} on the way." |
| Almost there | Save is within ₹100 of the goal | "You are ₹X away. Close." |
| Not yet | Save is more than ₹100 short | "Not this month. Want to see what moved?" |

Every ending leads to the same two buttons: **See where it went** and **Play again**, and every ending also shows the answer to the real question: *what kind of money manager were you this month?* (section 12).

## 4. The café and its cast

**Every character is someone you would genuinely meet in an Irani café, and each carries exactly one money habit.** Nobody is a monster. The pressure in the game comes from ordinary things asking for ordinary rupees.

### The place

**Café Meherban** (a fictional name; check it does not clash with a real café before the pitch). Marble-topped tables, bentwood chairs, mirrors with ageing silver, slow ceiling fans, glass cases of biscuits, black and white floor tiles, a wall clock that has said 4:10 for years. This is the Irani café node on the island map. Tapping it on the map walks the player in through the door.

The screen is a side-on stage, like an old cartoon set, with six zones:

| Zone | What lives there | Used in |
| --- | --- | --- |
| Left: the window | The street, passing vendors, and the monsoon cloud on the horizon | R1 (cloud), R2 (vendors), R5 (rain) |
| Centre: your table | Marble top, your steel tumbler (Spend), two saucers for cooling, your phone | Every round |
| Right: Chacha's counter | The ledger, the cash box, Chacha | Every round |
| Above the counter: the high shelf | Your gullak (Save), in sight but out of reach | R1, R6 |
| By the door: the umbrella stand | Your Emergency money | R1, R5 |
| Table, beside the tumbler | Two goli soda bottles, FUN (orange) and FRIENDS (teal), with a marble in the neck. The fizz rises as wants are refused. | R1 to R4 |
| Foreground: the trolley lane | Yusuf's biscuit and samosa trolley rolls through | R3 |

The top of the screen holds the goal (a card pinned to Chacha's cork wish board), the wall clock, and the **Month bar**: a 30 day strip with four phase markers that is the boss's "health bar" in shape only. It fills as the month passes and nothing ever drains the player.

### Chacha, the owner

*In one line: the unnervingly perceptive café owner who has seen every kind of customer make every kind of money decision, and has never raised his voice.*

|  |  |
| --- | --- |
| Look | Late 60s. White kurta, grey waistcoat, reading glasses on a chain, a pencil behind one ear. Moves slowly with theatrical stillness. |
| Role | Host, narrator, ledger-keeper, and the player's one constant companion. He asks the prediction questions and writes the feedback. |
| Habits | Taps the counter twice before saying something true. Polishes the same glass all game. Never writes a number without a remark beside it. |
| Signature move | He sometimes says what you are about to do a second before you do it, then goes back to polishing. The line is generated from the player's real pattern (see section 12), so it is funny because it is accurate. |
| He never | Says "wrong", "bad" or "should". Raises his voice. Tells you what to do. Mocks poverty, an item or a person. Quotes statistics: he speaks only of "what I have seen here". |
| He always | Says what usually happens, then lets the player see their own numbers. |
| Catchphrase | "Chai first. Panic later." |

**Voice rules:** short sentences, dry, warm, one proverb-like line per moment at most, 18 words maximum on screen. Hindi and Telugu versions keep the same length and the same dryness.

### Supporting cast

| Character | Who they are | Money habit they show | Voice |
| --- | --- | --- | --- |
| **Yusuf** | Runs the biscuit and samosa trolley. Quick smile, tray always full. | Small, repeated spends | "Biscuit? Samosa? Only ₹10." Never pushy, never sad if you skip |
| **Teja** | Your friend. Warm, chaotic, always about to pay you back. | Borrowing from friends | "I will give it back Friday. Promise." A good person who is bad with timing |
| **The window vendors** | Sunglasses seller, game-pack boy with a QR sign, biryani delivery rider on a scooter, a banner man holding "SALE ENDS TODAY" | Impulse and urgency | Each has one cheerful pitch. None is a villain. |
| **Quick Cash** | A pop-up on your phone with a lightning-bolt mascot (fictional, clearly labelled) | The price of borrowed money | "Instant! No documents!" Chacha raises one eyebrow |
| **The Regulars** | Four framed photos on the café wall: Sana (saves on the 1st), Mr. Rao (third chai, fourth "quick" snack), Vicky (bought the headset twice), Farida Aunty (writes every expense in a register) | Real habits, no shame | Chacha's one-line captions, shown in the Tally and Notebook |
| **Ammamma** | The grandmother from the opening story. Her note is tucked under the ₹600 at payday. | Where the money came from | One handwritten line: "Chacha knows how to count. Listen. Then decide." |
| **The Cloud** | A dark monsoon cloud, visible from Round 1. It is the boss's silhouette. | Surprises are certain, contents are unknown | A low rumble that grows through the game; it creeps closer at every phase |
| **The Month** | The boss: a 30 day bar across the top | Time passes and things come due | Never speaks. Shown by the Month bar and the cloud. It never attacks. |
| **The bills** | Three paper slips (Auto fare, data, exam lunch) | The difference between a need and a want | Each arrives stamped BILL and cannot be passed |
| **The player** | One of the three personas from the opening story, seated at the table | Whatever they choose | Never speaks. Chooses with icons. A small thought bubble shows what they are weighing. |

### The boss, and why there is no Chacha's Book

**The Month is the boss in structure only.** It has a name, four phases, a finale and a knockout stamp, but it never attacks anyone. The "damage" is always the player's own earlier choices coming due, shown in rupees.

An earlier draft gave Chacha a Book that lent up to ₹50 at no cost. It was removed: it made borrowing look free and muddied the comparison with Quick Cash. Chacha's lending rule now lives in Teja's scene: "I lend only what I can afford to forget. You should, too."

## 5. Screens, HUD and UI text

**The game is nineteen screens, one HUD and three kinds of input: drag a coin, tap a button, or leave something to cool.** Every string below is final English and goes into `en.json`; Hindi and Telugu follow in section 16.

### Screen list

| # | Screen | Purpose | Leads to |
| --- | --- | --- | --- |
| 1 | Entry card (from the island map) | Names the café, states what the player will learn, sets expectations | 2 |
| 2 | Walk-in | Chacha greets the player; sets the scene | 3 |
| 3 | Goal pick | Player pins one of three goals on the wish board | 4 |
| 4 | Predict 1 | One quick guess about surprises | 5 |
| 5 | Payday table (R1, the loadout) | Split ₹600 into the three containers | 6 |
| 6 | Bill N1 and the window (R2, Phase 1) | Pay the Auto fare, then vendors come in patterns; get, cool or pass | 7 |
| 7 | Bill N2 and the trolley (R3, Phase 2) | Pay the data bill, then pay or skip each tiny item as it reaches the pay line | 8 |
| 8 | Predict 2 | Guess the small-spend total | 9 |
| 9 | Plates reveal | The little items stack into one big bill | 10 |
| 10 | Worth it? | Player tags each purchase as glad or meh | 11 |
| 11 | Big Night (R4, Phase 3, only if a bottle popped) | Go, join for half, or stay in | 12 |
| 12 | Teja walks in (R4, Phase 3) | Decide how much to lend | 13 |
| 13 | Bill N3 | Pay the exam lunch | 14 |
| 14 | The rain finale (R5, Phase 4) | The calm, the freeze, the crack and the table speaks | 15 |
| 15 | Pay panel | Cover the bill from the four sources | 16, 17 |
| 16 | Fine print (sub-screen) | Flip Quick Cash's offer to see the price | 15 |
| 17 | The Tally (R6) | Ending, report, money-manager reading, margin notes, recap cards, takeaway | 18 |
| 18 | One change | Player picks one thing to do differently | 5 (replay) |
| 19 | My Notebook | All recap cards collected, plus the glossary | Back to map |

A **Pause** overlay is available on every screen. It freezes everything.

```
Entry -> Walk-in -> Goal -> Predict 1 -> PAYDAY (the loadout)
  -> Bill 1 -> PHASE 1 WINDOW -> Bill 2 -> PHASE 2 TROLLEY -> Predict 2 -> Plates -> Worth it?
  -> PHASE 3: [Big Night if a bottle popped] -> Teja -> Bill 3
  -> PHASE 4 RAIN: calm -> freeze -> crack -> table speaks -> pay panel <-> fine print
  -> THE TALLY -> One change -> back to PAYDAY (replay, new month)
```

The month runs top to bottom, the rain can branch to Quick Cash and back, and One change sends the player back to Payday.

### HUD

| Position | Element | Behaviour |
| --- | --- | --- |
| Top left | **Goal card**, pinned on the wish board | Shows the item, "₹X of ₹250" and a thin progress line. Moves with every transfer. |
| Top centre | The **Month bar** (30 days, four phase markers) and the wall clock | A pointer moves along the bar as the month passes. A label shows "Phase 2 of 4". The clock hands advance a little each phase. |
| Top right | **Ledger** icon and **Pause** | Ledger opens Chacha's book with every line so far. Never costs anything. |
| On the stage | **Tumbler**, **gullak**, **umbrella stand** | Each has a small ₹ tag above it that updates as coins move. |
| Table | **Two saucers** | Hold items that are cooling, each with its own steam fade. |
| Table | **Two fizz bottles** (FUN orange, FRIENDS teal) | Bubbles rise in stepped frames as wants are refused, in five visual stages. **Never a number.** At the top stage the marble pops. Always visible. |
| Beside the calendar | **Bills tracker** | Three small paper slips that stamp as each bill is paid |
| Table | **Phone** | Lights up when a pop-up arrives (Quick Cash, a notification). |
| Bottom | **Chacha's caption bar** | One line at a time, at most 18 words. Tap to advance. |

### Controls

- **Drag** a coin to a container (Round 1, the pay panel).
- **Tap** an item to open its card, then tap a button.
- **Tap OK or Skip** on trolley items.
- **Plus and minus buttons** sit beside each container as an alternative to dragging, for accessibility and small phones.
- **Keyboard:** Tab moves between items, Enter selects, arrow keys move coins.
- **Pay it** on a bill opens the source question; tap a source to choose where the money comes from.
- **Slow mode** (in Pause) slows the animations. Offers never expire in the default mode, so Slow mode is a comfort setting, not a requirement.

### Complete UI string list (English)

| Key | Text |
| --- | --- |
| entry.title | Café Meherban |
| entry.pillar | Save & Manage |
| entry.hook | One month. ₹600. One table. Let's see where it goes. |
| entry.objective | By the end you can put money aside first, spot small spends, keep a cushion, and know what borrowing really costs. |
| entry.time | About 6 minutes |
| entry.note | All amounts are made up, for practice. |
| entry.start | Take a seat |
| hud.goal | Goal |
| hud.spend | Spend |
| hud.save | Save |
| hud.emergency | Emergency |
| hud.lent | With friends |
| hud.round | Phase {n} of 4 |
| hud.ledger | Chacha's ledger |
| hud.pause | Pause |
| hud.phone | Phone |
| btn.next | Next |
| btn.back | Back |
| btn.confirm | Confirm |
| btn.cancel | Never mind |
| btn.ok | OK |
| btn.skip | Skip |
| btn.getit | Get it · ₹{x} |
| btn.cool | Let it cool |
| btn.pass | Pass |
| btn.stillwant | Yes, still want it |
| btn.dontwant | No, I'm good |
| btn.takesave | Take ₹{x} from Save |
| btn.takeemergency | Take ₹{x} from Emergency |
| btn.fineprint | Fine print |
| btn.borrow | Borrow ₹{x} |
| btn.lend100 | Lend ₹100 |
| btn.lend50 | Lend ₹50 |
| btn.gift30 | Give ₹30, no strings |
| btn.sayno | Say no, kindly |
| btn.glad | Glad I got it |
| btn.meh | Meh |
| btn.seewhere | See where it went |
| btn.playagain | Play again |
| btn.notebook | My Notebook |
| btn.resume | Resume |
| btn.slow | Slow mode |
| sys.lock | Put all ₹600 into the containers first. |
| sys.remaining | ₹{x} still on the table |
| sys.notenough | Not enough in Spend for that. |
| sys.takesave | Take ₹{x} from Save? Your goal moves back by ₹{x}. |
| sys.takeemergency | This is your cushion. Something may be coming. Take ₹{x}? |
| sys.goalmoved | Goal: ₹{a} to ₹{b} |
| sys.steam | Steam's rising. Wait it out. |
| sys.soldout | Sold out. It happens. |
| sys.gone | It walked on by. |
| boss.name | The Month |
| boss.phase1 | Temptation |
| boss.phase2 | Little Leaks |
| boss.phase3 | The People |
| boss.phase4 | The Rain |
| boss.survived | MONTH SURVIVED |
| boss.notyet | NOT YET |
| entry.boss | A boss fight where the boss is the month. Nobody gets hurt. |
| bill.stamp | BILL |
| bill.pay | Pay it |
| bill.auto | Auto fare to class: ₹{x} |
| bill.data | Phone data recharge: ₹{x} |
| bill.lunch | Lunch on exam day: ₹{x} |
| bill.chacha | Bills do not ask. They arrive. |
| src.question | Where should this ₹{x} come from? |
| src.spend | From the tumbler. No change. |
| src.save | Your goal moves: ₹{a} to ₹{b}. |
| src.emergency | This is your cushion. Something may be coming. |
| src.quick | ₹{x} now. You pay ₹{y} on payday. |
| fizz.fun | FUN |
| fizz.friends | FRIENDS |
| fizz.pop | The marble pops! |
| fizz.stage0 | calm |
| fizz.stage1 | simmering |
| fizz.stage2 | bubbling |
| fizz.stage3 | fizzing |
| bn.invite.fun | Big screen on the terrace tonight, the cricket final. ₹{x} each. Everyone is going. Last chance? |
| bn.invite.friends | Ayesha's birthday dinner, ₹{x} each. Everyone is going. Last chance? |
| bn.refused | There goes the marble. {a}. {b}. Small noes, one after another. |
| bn.title | Big Night |
| bn.go | Go · ₹{x} |
| bn.half | Join for half · ₹{x} |
| bn.stay | Stay in |
| bn.stayed | Stayed in. The money stayed. So did the fizz. |
| tally.kind | What kind of money manager were you this month? |
| report.bills | Bills |
| report.wants | Wants |
| ledger.empty | Nothing yet. Chacha is sharpening his pencil. |
| pause.title | Chai break |
| notice.illustrative | Illustrative amounts. Real prices differ. |
| notice.fictional | Quick Cash is a made-up example, not a real company. |

## 6. Round 0: Walk in and predict (about 35 seconds)

**Round 0 sets the scene, pins the goal on the wish board, and records one guess before any money moves.** It teaches nothing the player can fail at. It exists so Round 5 can say "you guessed X".

### Script

| ID | Speaker | Text or action | Note |
| --- | --- | --- | --- |
| 0.1 | Scene | Café door opens, a bell rings, fans turn. The player sits at the marble table. | Sound of the bell is optional (audio off by default) |
| 0.2 | Chacha | "First of the month. You walk in like everyone does." | Without looking up from his glass |
| 0.3 | Chacha | "Sit. Chai first. Panic later." | A tea glass slides onto the table |
| 0.4 | Scene | An envelope lands on the table. ₹600 in notes. A small handwritten note tucked in. |  |
| 0.5 | Note | "Chacha knows how to count. Listen. Then decide. Ammamma" | Links back to the story |
| 0.6 | Chacha | "Her handwriting has not changed in forty years." | Tap counter twice |
| 0.7 | Chacha | "₹600. One month. Let's see where it goes." |  |
| 0.7a | Title card | "POCKET PANIC · THE MONTH" on a vintage frame. The cloud sits small in the window. | The boss name card |
| 0.7b | Chacha | "Four hard parts and a cloud. I will be here. Polishing." |  |
| 0.8 | Chacha | "Every customer wants something. What is pinned on my board for you?" | The wish board lights up with three cards |

### Goal pick

Three cards, all ₹250: **Earphones**, **Trip with friends**, **Game controller**. The player taps one and it pins to the top left.

| Choice | Chacha's reaction |
| --- | --- |
| Earphones | "Earphones. Good. The bus is long." |
| Trip with friends | "A trip. Those stories last longer than the chai." |
| Game controller | "A controller. Your thumbs will thank you." |

Then:

| ID | Speaker | Text |
| --- | --- | --- |
| 0.9 | Chacha | "₹250 on the board. That is the target. Everything else is life." |
| 0.10 | Chacha | "One guess before we start. No marks. I just like to know what people think." |

### Predict 1: how many surprises?

**Prompt on screen:** "How many surprises do you think this month will send you?"

| Option | Chacha's reaction | Stored as |
| --- | --- | --- |
| None. It will be a calm month. | "A calm month. Lovely. I will write it down." | `predict_surprise = 0` |
| One. | "One. I will write that down too." | `predict_surprise = 1` |
| Two or more. | "Two or more. You are an optimist about problems." | `predict_surprise = 2` |
| No idea. | "Honest. The best answer in this café." | `predict_surprise = -1` |

After any answer: Chacha: "Good. Now. The money." Scene cuts to Round 1.

### Persona variants for line 0.6

The ₹600 and the goal stay the same for all three, so results are comparable. Only the flavour changes.

| Persona | Changed line |
| --- | --- |
| School student | "Pocket money, birthday money, one month. Your grandmother counted it twice." |
| College student | "Stipend plus the tuition-class money. Your grandmother counted it twice." |
| First-generation earner | "Your first month's pay, in her envelope. Your grandmother counted it twice." |

### Edge cases

| Situation | What happens |
| --- | --- |
| Player leaves mid-round and returns | Chacha: "Back already? Chai is still warm." The round resumes where it stopped. |
| Player taps Skip on the intro | Straight to the goal pick. Predict 1 can still be skipped with "No idea". |
| Player taps the clock | Chacha: "Plenty of time. It has said 4:10 for years." |

## 7. Round 1 · The loadout: Payday (about 40 seconds)

**The player puts all ₹600 into three containers before anything else in the game unlocks.** This teaches pay yourself first, and it plants the Emergency decision before the player knows what the surprise will be.

**What the student should notice:** the money in the gullak is out of reach of every vendor later, and getting it back costs a visible step. In boss terms this is the loadout: the player chooses their kit before the fight starts, and the fight will test it.

### Setup on screen

- 60 coins (₹10 each) pile on the marble table, beside Ammamma's envelope.
- Three containers: the **tumbler** on the table (Spend), the **gullak** on the high shelf (Save), the **umbrella stand** by the door (Emergency).
- Through the window, a small dark cloud sits far away on the horizon.
- Two goli soda bottles stand beside the tumbler: FUN (orange, at 20) and FRIENDS (teal, at 30). Chacha does not mention them yet.
- The street and the trolley are quiet. Nothing can be bought yet.

### Script

| ID | Speaker | Text or action |
| --- | --- | --- |
| 1.1 | Title card | "ROUND 1 · PAYDAY · THE LOADOUT" on a vintage frame |
| 1.2 | Chacha | "Money on the first always gets spent. The only question is who decides where." |
| 1.3 | Chacha | "Three places. The tumbler is for spending." |
| 1.4 | Chacha | "The gullak is for your goal. I keep it on the high shelf. You can see it. You cannot reach it." |
| 1.5 | Chacha | "The umbrella stand, by the door. For rain." |
| 1.6 | Chacha | "That cloud? It has been there since you walked in. I do not know what it carries. Nobody does." |
| 1.6a | Chacha | "Three small bills are coming this month. They do not wait for a good moment." |
| 1.7 | Hint | "Drag the coins. Nothing else starts until every coin has a home." |

### While the player drags

- Each container shows its ₹ tag, updating live.
- The goal card shows the Save amount against ₹250.
- "₹X still on the table" counts down. **Confirm** stays disabled until it reaches zero.
- Coins can be moved freely until Confirm. There is no wrong split and no warning.

### Chacha's reaction after Confirm (shown once, picked by the first matching row)

These lines describe what he sees. They never judge it.

| Order | Condition | Chacha's line |
| --- | --- | --- |
| 1 | Save = ₹0 | "Nothing on the shelf. We will see what finds it." |
| 2 | Save is ₹250 or more | "The whole goal, already on the shelf. Now you live on what is left." |
| 3 | Spend is ₹400 or more | "Most of it in the tumbler. We will see how long a tumbler lasts." |
| 4 | Emergency = ₹0 | "Nothing by the door. Brave." |
| 5 | Emergency is ₹10 to ₹90 | "A little by the door. A little is a start." |
| 6 | Emergency is ₹100 or more | "Something by the door. The cloud will be curious." |
| 7 | None of the above | "A bit of everything. Let us see if it holds." |

Then always:

| ID | Speaker | Text |
| --- | --- | --- |
| 1.8 | Chacha | "Written down." (He writes in the ledger.) |
| 1.9 | Chacha | "The month is long. Mind the window." |

The wall clock spins, calendar pages flip to "Day 3", and Round 2 begins.

### What goes into the ledger

| Line | Format | Margin note (Chacha's handwriting) |
| --- | --- | --- |
| Day 1 | In: ₹600 (Ammamma's envelope) | "Counted twice." |
| Day 1 | Gullak ₹S, Umbrella ₹E, Tumbler ₹P | "Paid first." if Save is ₹100 or more; "Shelf is empty." if Save is ₹0; otherwise no note |

### Edge cases

| Situation | What happens |
| --- | --- |
| Everything into Save (₹600) | Chacha: "All on the shelf. Impressive. And how are you getting to class?" The player continues with Spend at ₹0. Bill N1 arrives and cannot be passed, so the source question forces a pull from Save and the goal moves back by ₹20. That is the lesson: money has to live in different places for a reason. |
| Everything into Spend | Valid. Chacha: "All in the tumbler. Interesting." The Tally shows what that cost. |
| Player drags a coin back out after confirm | Allowed only through the Take-from-Save or Take-from-Emergency prompts in later rounds |
| First-time player | A one-time overlay shows a coin moving to a container: "Drag a coin to a container, or use the plus button." |

## 8. Round 2, Phase 1 · Temptation: the window (about 70 seconds)

**Offers come past the café window in patterns, one at a time and then in pairs, and the player gets it, lets it cool in a saucer, or lets it pass. Between them, the first bill arrives and cannot be passed.** This teaches wait before you buy, goals and trade-offs, the difference between a need and a want, and that wanting is normal.

**What the student should notice:** some wants disappear after a ten second wait, some do not, and both outcomes are fine. A want that is refused again and again does not vanish: its bottle keeps fizzing. And one item really does sell out, so waiting is a check, not a rule.

### Setup

Title card: **"ROUND 2 · PHASE 1 OF 4 · TEMPTATION"**. The Month bar reads Day 3. The cloud is far away.

1. **Bill N1 arrives first.** A paper bill slides onto the table: *"Auto fare to class: ₹20"*, stamped **BILL**. Chacha: "Bills do not ask. They arrive." The player taps **Pay it** and picks the source (the source rule, section 3). Nothing can be bought until it is paid.
2. **Then the window opens.** A vendor stops at the window, says a one-line pitch, and an item card shows the name, the price and its tag. Tapping the card opens three buttons: **Get it · ₹X**, **Let it cool**, **Pass**.

**Offers wait.** An offer stays on the window until the player decides. The vendor's walking animation is decoration, never a deadline. Pause freezes the whole café.

**Cooling:** the item moves to one of two saucers on the table and a wisp of steam fades over 10 seconds. The vendor waits. When the steam is gone Chacha asks "Still want it?" with **Yes, still want it** and **No, I'm good**. The first time, a one-off hint appears: "Tap Let it cool. Chai cools in the saucer. So do wants. Sometimes."

### The patterns (this is how the phase escalates)

| Pattern | What arrives | Why it matters |
| --- | --- | --- |
| **Single** | One vendor, one decision | Teaches the verbs: get, cool, pass |
| **Pair** | Two vendors at the window at once, each can use its own saucer | You cannot afford both, so it is a trade-off between two real wants |
| **Pressure** | An offer from a fizz bottle that is already high | Shows how pressure changes what a "no" feels like |

The round ends when every wave has passed. There is no round timer.

### Item bank

Each item has a **kind**: *ignorable* (nothing builds up), *fizz* (declining raises a bottle, buying lowers it), or *sensible* (it helps later). Prices are fictional.

| # | Item | Vendor | Price | Kind and pull | Ledger category | Special rule | In the hackathon build |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Game pack | Game-pack boy with a QR sign | ₹50 | Fizz, FUN 40 | Fun and games | None | Yes |
| 2 | Cricket with friends | Ground keeper | ₹30 | Fizz, FUN 25 | Fun and games | None | Full build |
| 3 | Sunglasses | Sunglasses seller | ₹150 | Ignorable | Shopping | None | Full build |
| 4 | Jacket | Banner man with "SALE ENDS TODAY" | ₹200 | Ignorable | Shopping | Urgency tactic. The banner is still up after cooling. Cannot be afforded without reaching into Save, which is the point. | Yes |
| 5 | Match ticket | Ticket tout | ₹100 | Fizz, FRIENDS 40 | Fun and games | **Really sells out** after 10 seconds of steam | Yes |
| 6 | Biryani for one | Delivery rider on a scooter | ₹100 | Ignorable | Food | None. Hunger is a valid reason. | Full build |
| 7 | Phone cover | Accessory stall | ₹40 | Sensible | Phone | If bought, the Round 5 repair costs ₹100 instead of ₹150 | Yes |
| 8 | Group gift for Ayesha | Message on your phone | ₹40 | Fizz, FRIENDS 35 | Social | None | Full build |

Together the full list is ₹710; the four in the hackathon build are ₹390. The player has at most a few hundred in the tumbler, so every pattern is a trade-off by design.

**Wave order, hackathon build:** Bill N1 → Game pack (single) → Match ticket + Jacket (pair) → Phone cover (single).
**Wave order, full build:** Bill N1 → Game pack → Cricket + Sunglasses (pair) → Match ticket + Jacket (pair) → Biryani → Phone cover + Group gift (pair).

### Script per item

| # | Pitch (vendor) | If bought | If cooled, then yes | If cooled, then no | If passed |
| --- | --- | --- | --- | --- | --- |
| 1 | "New season pack! ₹50! Your friends already have it!" | "A game pack. Played twice by Friday, I would guess." | "Wanted it after the wait. Good sign." | "The pack will be there tomorrow. They always are." | (silence, the orange bottle fizzes) |
| 2 | "Ground is free this evening! ₹30 for the pitch!" | "Cricket. Cheap by the hour." | "Waited, still wanted a game. Reasonable." | "Not today. The ground will be there." | (silence, the orange bottle fizzes) |
| 3 | "Shades! Same as the film stars! Today only, ₹150!" | "Sunglasses. For a café with no sun." | "Cooled and still wanted. That is a decision, not an impulse." | "Still there. So is your ₹150." | (silence) |
| 4 | "SALE ENDS TODAY! ₹200 only! Last one!" | "A jacket. In Hyderabad. In October." | "Still wanted after the chai cooled. Fair." | "The banner says today. He was here yesterday, too." | "The banner man will try again tomorrow." |
| 5 | "Match tonight! Last few tickets!" | "A match ticket. I hope the seat is good." | Sold out: "Sold out. Sometimes things really do run out. Waiting is a check, not a rule." | Same sold-out line (the player did not want it anyway): "It sold out. You did not mind." | (silence, the teal bottle fizzes) |
| 6 | "Hot biryani! Five minutes! ₹100!" | "Biryani. Hungry is a good reason." | "Still hungry. Then eat." | "You changed your mind. That counts too." | (silence) |
| 7 | "Covers! ₹40! Pick any colour!" | "A cover. Your phone may thank you." | "Cooled, still wanted. Sensible." | "Skipped the cover. Phones are tough. Mostly." | (silence) |
| 8 | Phone buzz: "Ayesha's birthday gift, everyone is chipping in ₹40!" | "Chipped in. Some money is for people." | "You thought it over and went in. Good." | "Skipping a group gift is allowed. A kind message costs nothing." | "Skipped. A message is a fine gift too." (the teal bottle fizzes) |

### What the fizz does in this phase

- Each decline raises the matching bottle by the item's pull, each buy lowers it by 1.5 times the pull (section 3). The bottles are always visible on the table, as pictures with no numbers.
- Nothing rises on a timer. The bottle moves only because of what the player decided.
- Chacha comments **once**, only if a bottle reaches the *fizzing* stage by the end of the phase: "The orange bottle is fizzing. I will say no more."
- Nothing in Phase 1 ever *forces* a purchase. Ignorable items stay ignorable.

### Dynamic lines (pattern comments)

Chacha speaks at most once in a round about the player's pattern, after the fact, and never as a judgement.

| Trigger | Chacha's line |
| --- | --- |
| Every offer taken without cooling (two or more) | "In a row. The tumbler sounds different now." |
| Player cools at least one item | "You let one cool. Interesting." |
| Player cools and drops two or more | "Two cooled and gone. The tumbler thanks you." |
| Player buys nothing | "Nothing at all? The vendors will talk about you." |
| Player buys four or more (full build: six or more) | "A busy window. I will need a bigger page." |

### When Spend runs short

| Step | Text |
| --- | --- |
| Chacha | "The tumbler is short. The gullak is not." |
| System prompt | "Where should this ₹{x} come from?" with **Take ₹{x} from Save** (shows "Your goal moves back by ₹{x}"), **Take ₹{x} from Emergency** (shows the cushion line) and **Never mind** |
| If Save | Chacha: "Off the shelf it comes. The goal moves back." The goal card animates from ₹{a} to ₹{b}. |
| If never mind | Chacha: "Leave it. Good." The item passes (and a fizz item still adds to its bottle). |

Quick Cash is not offered for wants. The game does not tempt the player to borrow for fun.

### Round summary (a ledger page that flips open)

"Round 2. You looked at {n} things. You got {g}. You let {m} cool. {k} walked on by. Tumbler: ₹{x}." Then, if at least one item was cooled: **"Cooled and dropped: {d} of {m}."** This is the number the player is meant to notice. Then one line about the bottles, in words: "The orange bottle is {stage}. The teal one is {stage}."

## 9. Round 3, Phase 2 · Little Leaks: the trolley (about 55 seconds)

**Yusuf's trolley rolls past with tiny things lined up in a queue (twelve in the full build, six in the hackathon build), and afterwards the player guesses what it all cost before the plates stack up and show the real number.** This teaches that small spends add up, begins track spending as a habit, and shows that tiny fizz items quietly feed the bottles.

**What the student should notice:** their own guess is lower than the total, and nothing in the round felt expensive while it happened.

### Setup

Title card: **"ROUND 3 · PHASE 2 OF 4 · LITTLE LEAKS"**. The Month bar reads Day 9. The cloud is a little closer.

1. **Bill N2 arrives first:** *"Phone data recharge: ₹30"*, stamped **BILL**. Chacha: "Data does not run on hope." The player taps **Pay it** and picks the source.
2. **Then the trolley.** Items roll one at a time along the trolley lane to a **pay line**, with the next two items visible behind. Each waits at the line until the player taps **OK** (pay it) or **Skip**. Nothing times out. There is no saucer for these. Chacha: "No saucer here. Nobody puts a ₹10 biscuit in a saucer." That is the point.

If Spend is empty, **OK** opens the source question ("Where should this ₹{x} come from?") so every small purchase visibly moves the goal if it comes from Save.

**Rush hour (optional, Month 3 and later):** the items advance on their own every 3 seconds. An untouched item counts as Skip and costs nothing, so speed is never required.

### Item bank

Prices are fictional. Items tagged **FUN** act as small fizz items with a pull of 15: skipping one raises the orange bottle by 15, paying one lowers it by 22 (1.5 times the pull, section 3).

| # | Item | Price | Tag | Line |
| --- | --- | --- | --- | --- |
| 1 | Chai refill | ₹10 | | Yusuf: "Chai, fresh! ₹10." |
| 2 | Osmania biscuit | ₹10 | | "Osmania biscuit. ₹10." |
| 3 | Samosa | ₹20 | | "Hot samosa. ₹20." |
| 4 | Bun maska | ₹25 | | "Bun maska, soft. ₹25." |
| 5 | Cold drink | ₹20 | FUN | "Cold drink. ₹20." |
| 6 | Chai refill | ₹10 | | "Chai again? ₹10." |
| 7 | In-game coins (phone ping) | ₹30 | FUN | Phone: "Coins pack, ₹30, for the next level." |
| 8 | Cutlet | ₹25 | | "Cutlet, hot. ₹25." |
| 9 | Biscuit for the road | ₹10 | | "Biscuit for the road. ₹10." |
| 10 | Ice cream | ₹30 | FUN | "Ice cream. ₹30." |
| 11 | Last chai | ₹10 | | "Last chai? ₹10." |
| 12 | Peanuts | ₹10 | | "Peanuts, warm. ₹10." |

The full list is **₹210** if the player takes everything. **The hackathon build uses six:** chai (#1), samosa (#3), cold drink (#5), in-game coins (#7), biscuit (#9) and ice cream (#10), which total **₹120**. The data top-up that used to be a trolley item is now Bill N2.

### Script

| ID | Speaker | Text |
| --- | --- | --- |
| 3.1 | Chacha | "Yusuf comes by every day. Never pushy. That is how it works." |
| 3.2 | Chacha (after 4 OKs in a row, or 3 in the six item build) | "Yusuf is smiling. He has a gift." |
| 3.3 | Chacha (after 3 Skips in a row, or 2 in the six item build) | "Skipping with style." |
| 3.4 | Chacha (end of trolley) | "That is the trolley. Now, close your eyes." |

The ledger icon greys out and Chacha closes the book with a clap.

### Predict 2: what did the little things cost?

**Prompt:** "Without the ledger: how much did the little things cost you?"

| Option | Range it covers | Stored as |
| --- | --- | --- |
| Under ₹50 | 0 to 45 | `guess = 0` |
| ₹50 to ₹100 | 50 to 100 | `guess = 1` |
| ₹100 to ₹150 | 105 to 150 | `guess = 2` |
| More than ₹150 | above 150 | `guess = 3` |

### The plates reveal

Every item the player took becomes a small plate. The plates fly onto the table and stack into a tall, wobbling tower. A long bill slip unrolls beside it and ends in the real total.

| Outcome | Chacha's line |
| --- | --- |
| Actual is above the guessed range | "You guessed {range}. The plates say ₹{x}. Little things have long bills." |
| Actual is inside the range | "You guessed {range}. The plates say ₹{x}. You were paying attention. Keep doing that." |
| Actual is below the range | "You guessed {range}. Only ₹{x}. You were more careful than you thought." |
| Player took nothing | "Not a single biscuit? Yusuf is worried. Still, ₹0 is a number worth knowing." |

Then the bill slip is stamped across the top: **"SMALL SPENDS ADD UP."** This is the first time the concept is named, after the player has felt it.

### Worth it? (the self-review)

| ID | Speaker | Text |
| --- | --- | --- |
| 3.5 | Chacha | "Spending is fine. Spending without noticing is the problem. So, notice." |
| 3.6 | Screen | Every item bought in Rounds 2 and 3 appears as a small card. Prompt: "Tag each one. Only you know." Buttons: **Glad I got it** and **Meh**. |
| 3.7 | Chacha (after tagging) | "{g} glad, ₹{x}. {m} meh, ₹{y}." |
| 3.8 | Chacha (if meh is more than ₹0) | "The meh pile is the interesting one. ₹{y}. That is how far your goal could have moved." |
| 3.9 | Chacha (if meh is ₹0) | "All glad. That is a good month's spending, whatever the total." |

This does two jobs. It practises tracking (the player reviews their own spending) and it removes judgement: only the player decides what was worth it. The three bills are not tagged: they were not choices.

### What is recorded

`guess`, `actual_small_total`, `guess_error_band`, `items_taken`, `glad_count`, `meh_count`, `meh_total`, `paid_from_save_count`, `bill_n2_source`, `fizz_fun_stage`, `fizz_friends_stage`.

## 10. Round 4, Phase 3 · The People: Big Night and a friend (about 45 seconds)

**Phase 3 puts two kinds of social pull on the table: the Big Night that a bottle of fizz has been building towards, and Teja asking to borrow ₹100.** The player chooses how to answer each. This teaches lending to friends (borrowed-out money is not yours to use, and you should only lend what you can afford to wait for or lose) and shows what ignored pressure turns into.

**What the student should notice:** the pressure they declined earlier did not disappear, and lent money leaves the tumbler and nothing in the game can spend it until it comes back. Both matter in Round 5.

The order is deliberate. This phase comes **before** the rain, so a generous or fun-loving player may meet the surprise with less in hand. That is the lesson, shown by the player's own choices.

### Setup

Title card: **"ROUND 4 · PHASE 3 OF 4 · THE PEOPLE"**. The Month bar reads Day 14 for the Big Night, Day 16 for Teja and Day 20 for the last bill. Far off, thunder rolls once. The cloud is close enough to see rain under it.

Beats, in order:

1. **Big Night (Day 14), only if a bottle has popped.** If neither bottle reached 100, skip to Teja.
2. **Teja walks in (Day 16).**
3. **Bill N3 (Day 20):** *"Lunch on exam day: ₹30"*, stamped **BILL**. Chacha: "Exams are a month's worth of hungry in one afternoon." Pay it, pick the source. By now the player's own choices decide whether the tumbler can cover it.

### Big Night (only when a fizz bottle has popped)

**Big Night is the player's own refusals coming back.** The marble pops out of the bottle with a thunk and rolls across the table. The things the player passed on (up to three, the most recent first) drift onto the table as faint ghost icons around a phone invitation. Chacha reads them back by name, once. He never says what the player should do.

| ID | Speaker | Text |
| --- | --- | --- |
| 4.0a | Chacha | "There goes the marble. {refused 1}. {refused 2}. Small noes, one after another." |
| 4.0b | Friends (phone), FUN bottle | "Big screen on the terrace tonight, the cricket final. ₹{x} each. Everyone is going. Last chance?" |
| 4.0c | Friends (phone), FRIENDS bottle | "Ayesha's birthday dinner, ₹{x} each. Everyone is going. Last chance?" |
| 4.0d | Hint | "Pick what you can live with. Nobody keeps score." |

(`{refused 1}` and `{refused 2}` are the item names, for example "The game pack" and "The cold drink". In Month 1 the cost is ₹60.)

| Button | Shown beneath | Chacha says |
| --- | --- | --- |
| **Go · ₹60** | "From any jar you choose. The bottle resets." | "Written down. Went." |
| **Join for half · ₹30** | "From any jar you choose. The bottle drops to half." | "Half and home early. Sensible, or sad. Only you know." |
| **Stay in** | "No cost. The bottle stays full and comes with you into next month, bigger." | "Stayed in. The money stayed. So did the fizz." |

Choosing **Go** or **Join** opens the source question ("Where should this ₹{x} come from?") like any payment. Quick Cash is not offered.

**Rules:**

- A bottle that has not popped never triggers a Big Night. There is no timer and no drift: only the player's refusals fill it.
- If both bottles have popped the player gets one combined Big Night (FRIENDS first).
- Staying in costs no money and carries a visible price instead: the stayed-in bottle is described in the Tally, and in Month 2 the Big Night arrives **on Day 1 and costs ₹100**.
- The game never says staying in or going is better. The Tally describes what happened.
- **The fizz is not a bar to maintain.** The player never sees a value, nothing rewards keeping it low, and the Tally never scores it (section 3).

### Teja asks

| ID | Speaker | Text |
| --- | --- | --- |
| 4.1 | Teja | "Hey! You will not believe it. Saturday's match, student stand, ₹100 a ticket. And I am ₹100 short." |
| 4.2 | Teja | "Can you lend me ₹100? I will give it back Friday. Promise." |
| 4.3 | Chacha (aside, polishing the glass) | "Friday is a very popular day in this café." |
| 4.4 | Chacha | "I lend only what I can afford to forget. You should, too." |
| 4.5 | Hint | "Choose what you can afford to wait on." |

### The four choices

Each button shows its effect before the player taps it.

| Button | Shown beneath | Teja says | Chacha says |
| --- | --- | --- | --- |
| **Lend ₹100** | "Out of Spend: ₹100. Back: Teja says Friday." | "You are the best! Friday, I swear." | "₹100 leaves the tumbler. It is with Teja now. Until Friday, it is not yours to use." |
| **Lend ₹50** | "Out of Spend: ₹50. Back: Teja says Friday." | "₹50 is perfect. That covers most of it. Thank you!" | "'I can do ₹50.' Five words. Very useful." |
| **Give ₹30, no strings** | "Out of Spend: ₹30. Not expected back." | "You do not have to! ...Okay, thank you. I owe you a chai." | "A gift is simple. Nobody has to remember anything on Friday." |
| **Say no, kindly** | "No change. Teja hears: 'I cannot this month. Next chai is on me.'" | "Deal! Next chai is yours, then." | "A good friend survives a 'no'. Especially a kind one." |

The player's side of each reply is shown as a short line in a speech bubble, so the player sees *how* to say it:

- Lend ₹100: "Sure, ₹100. Friday, yes?"
- Lend ₹50: "I can do ₹50."
- Give ₹30: "Here, ₹30. Do not worry about it."
- Say no, kindly: "I cannot this month. Next chai is on me."

### If the player cannot afford a choice

Lending comes only from Spend, never from Save or Emergency.

| Spend is | What happens |
| --- | --- |
| ₹100 or more | All four choices are available |
| ₹50 to ₹99 | "Lend ₹100" is greyed out with the label "Not enough in Spend" |
| ₹30 to ₹49 | Only "Give ₹30" and "Say no, kindly" are available |
| Under ₹30 | Only "Say no, kindly". Chacha: "Honest. Money you do not have cannot be lent." |

### After the choice

| ID | Speaker | Text |
| --- | --- | --- |
| 4.6 | Chacha | "Written down." He adds the ledger line (below). |
| 4.7 | Scene | Teja finishes the chai and leaves. A louder rumble. The cloud has moved to the window. |
| 4.8 | Chacha | "Thunder. Mind the window." |

**Ledger lines:**

| Choice | Ledger line | Margin note |
| --- | --- | --- |
| Lend ₹100 | Day 16. Lent to Teja: ₹100. | "Friday." |
| Lend ₹50 | Day 16. Lent to Teja: ₹50. | "Friday, probably." |
| Give ₹30 | Day 16. Gift to Teja: ₹30. | "Gone, gladly." |
| Say no | Day 16. Teja asked. No change. | "Next chai is yours." |
| Lunch bill paid | Day 20. Exam lunch: ₹30. From {source}. | (none) |
| Went to Big Night | Day 14. Big Night: ₹{x}. | "Went." |
| Joined for half | Day 14. Big Night, half: ₹{x}. | "Half and home early." |
| Stayed in | Day 14. Big Night. No change. | "The fizz stayed, too." |

### What is recorded

`bignight_triggered`, `bignight_choice`, `bignight_source`, `bignight_refused_items` (the items it was built from), `fizz_fun_at_pop`, `teja_choice`, `lent_amount`, `gift_amount`, `spend_before_teja`, `bill_n3_source`, and later `lent_out_when_rain_hit`.

### Teaching note for facilitators

The game never says whether lending or refusing, going or staying in, is better. It shows the trade-off. In the Tally, Chacha's rule for lending is stated once, as something he does: "I lend only what I can afford to forget."

## 11. Round 5, Phase 4 · The Rain: the finale (about 75 seconds)

**The monsoon cloud that has crept closer all month finally breaks, the café freezes, the player's phone slips off the table and cracks, the camera pulls back to show everything the player did earlier, and the player has to cover a ₹150 repair from the sources they set up.** This is the centrepiece and the boss phase. It teaches emergency fund, plan for surprises, goals and trade-offs, and the cost of borrowing, all in one scene.

**What the student should notice:** every number on the table was decided earlier. The umbrella stand was made for exactly this. Without it, every other source has a visible price, and the fastest source is the most expensive one.

### The four beats of the finale

| Beat | What the player sees | Purpose |
| --- | --- | --- |
| **1. The calm** (about 6 seconds) | The café is quiet. Fans turn. Chacha polishes the glass. The cloud fills the window. The player may have forgotten it. | Make the player forget, so the hit lands |
| **2. The freeze** (about 3 seconds) | Thunder. Everything stops: the fans, the steam, the coins mid-air. Lights flicker. Chacha stops polishing and looks at the window. Silence. | The signature "boss phase begins" moment |
| **3. The crack** (about 3 seconds) | The phone, buzzing, slides across the marble and off the edge. A sharp crack. The bill card drops onto the table: **"Cracked screen. ₹150."** | The shock |
| **4. The table speaks** (about 6 seconds) | The camera pulls back slowly over the whole table so the player sees their own month: the three jars with their ₹ tags, the tower of plates, any money out with Teja, the two bottles of fizz, the goal card. Each lights up in turn as Chacha reads it. | "Oh. I decided all of these earlier." This is the payoff of the whole game |

Reduced motion replaces beats 2 and 4 with fades and a still pan. The beat timings are presentation only: Pause works at any moment.

### Setup and script

| ID | Speaker | Text or action |
| --- | --- | --- |
| 5.1 | Title card | "ROUND 5 · PHASE 4 OF 4 · THE RAIN". The Month bar reads Day 23. |
| 5.2 | Scene | Beat 1, the calm. The marble floor is dry. The cloud sits in the window. |
| 5.3 | Scene | Beat 2, the freeze. Thunder. All motion stops. |
| 5.4 | Scene | Beat 3, the crack. The phone slides and falls. |
| 5.5 | Chacha | "There. That is what the cloud was carrying." |
| 5.6 | Chacha | "It does not send a letter first. It just rains." |
| 5.7 | Item card | "Cracked screen. Repair: ₹150." (₹100 if the player bought the phone cover in Round 2, with Chacha adding: "The cover took half the fall.") |
| 5.8 | Scene | Beat 4, the table speaks. Chacha reads each part of the table out loud, one short line each (below). |
| 5.9 | Chacha | "Pay it from wherever you like. Every source has a price. Look at them." |
| 5.10 | Hint | "Drag coins into the bill until it is covered." |

**The table speaks (Chacha reads what is there, never what it means):**

| Table object | Line (shown only if it applies) |
| --- | --- |
| Umbrella stand | "By the door: ₹{E}." (or "By the door: nothing. Brave." if ₹0) |
| Tumbler | "In the tumbler: ₹{P}." |
| Gullak | "On the shelf: ₹{S}. The goal says ₹250." |
| Plates | "The little things: ₹{small}. They are still on the table." |
| Teja's chair | "₹{l} is with Teja. Teja is at the match." (only if money was lent) |
| Bottles | "The orange bottle is {stage}." (only if a bottle is bubbling or above, or was stayed-in on) |

If the player lent money to Teja in Round 4, a card also appears beside the pay panel: **"₹{l} is with Teja. Not available."**

### The pay panel

The bill slot sits in the middle. Four sources are arranged around it. Each shows its price before the player drags a coin.

| Source | Available | What the card says |
| --- | --- | --- |
| **Umbrella stand** (Emergency) | ₹E | "Kept for exactly this." |
| **Tumbler** (Spend) | ₹P | "Whatever is left." |
| **Gullak** (Save) | ₹S | "Your goal moves: ₹{a} to ₹{b}." |
| **Phone: Quick Cash** | In steps of ₹50 | "₹{x} now. You pay ₹{y} on payday. Fine print." |

The bill is covered when the coins in the slot equal the repair. Confirm unlocks only then. The bill cannot be skipped in this version.

### Quick Cash and the fine print

Tapping Quick Cash opens a bright pop-up on the phone. The mascot is a smiling lightning bolt, clearly labelled **"A made-up example, not a real company."**

| ID | Speaker | Text |
| --- | --- | --- |
| 5.11 | Quick Cash | "Cracked screen? No stress! Get ₹{x} in 30 seconds! No documents!" |
| 5.12 | Chacha (one eyebrow) | "Instant is always priced instant." |
| 5.13 | Chacha | "Before you flip it: if you borrow ₹150, how much do you pay back?" |

**Predict 3.** Options: ₹150, ₹175, ₹200, ₹250. The player picks, then taps **Fine print** to flip the card. If the player taps **Borrow** without flipping the card, Chacha says: "You did not flip it. Everything has a back." and offers **Fine print** or **Borrow anyway**.

**The back of the card:**

| You borrow | You pay back on payday | Extra | Note |
| --- | --- | --- | --- |
| ₹50 | ₹70 | ₹20 | 40 percent, for a few days |
| ₹100 | ₹135 | ₹35 | 35 percent, for a few days |
| ₹150 | ₹200 | ₹50 | About 33 percent, for a few days |

The card also says, in plain words: "You pay this on payday, whether or not you are ready." and "If you cannot pay it all, the rest is still owed."

| Outcome of Predict 3 | Chacha's line |
| --- | --- |
| Guess lower than the real amount | "You guessed ₹{g}. The card says ₹{r}. ₹{d} for the speed." |
| Guess equal | "You guessed it. Read the back, always." |
| Guess higher | "You guessed ₹{g}. It is ₹{r}. You expected the worst, and it was close." |

**There is no interest-free lender in this game.** Earlier drafts had Chacha lend up to ₹50 at no cost. It is removed so the comparison is clean: the choice is between your own jars, which cost you something visible, and borrowed money, which costs you more later.

### Outcomes (Chacha's line after the bill is covered)

The first row that matches is shown.

| Condition | Chacha's line |
| --- | --- |
| Fully covered by Emergency | "The umbrella stand has earned its place." |
| Covered by Emergency and Spend, Save untouched | "Between the door and the tumbler. The shelf survives." |
| Any amount from Save | "Off the shelf it comes. The goal paid for the rain." |
| Quick Cash used | "Done in 30 seconds. ₹{r} on payday. The extra ₹{e} is the price of the speed." |
| Emergency had more than the bill | "More by the door than the rain needed. The rest stays for next month." |

The umbrella on the stand pops open when Emergency covers the bill, and the rain eases.

**Ledger lines** are written for each source used, for example: "Day 23. Phone repair ₹150. From umbrella stand ₹100, tumbler ₹50." with the margin note "Dry." if Emergency covered at least ₹100, or "Wet." if Emergency covered nothing.

### Surprise bank (for replays)

Run 1 is always the cracked phone. Later runs draw from this table so the player cannot memorise one answer. Each surprise has its own short version of the four beats.

| # | Surprise | Cost | Chacha's first line |
| --- | --- | --- | --- |
| 1 | Cracked phone screen | ₹150 (₹100 with cover) | "There. That is what the cloud was carrying." |
| 2 | Bicycle puncture and a new tyre | ₹120 | "Tyres. They always choose a rainy day." |
| 3 | Sudden college lab fee | ₹200 | "The office never mentions it until the last week." |
| 4 | Cousin's wedding gift plus auto fares | ₹160 | "Weddings arrive on schedule. The money does not." |
| 5 | Doctor's visit and medicines for Ammamma | ₹180 | "Some surprises are not optional. That is what the door is for." (test with students before using) |

### What is recorded

`surprise_id`, `bill`, amounts taken from each source, `fine_print_opened`, `predict3_guess`, `borrowed_without_reading`, `lent_out_when_rain_hit`, `goal_before`, `goal_after`, `table_speaks_viewed` (whether the pull-back was skipped).

## 12. Round 6: The bill, where the learning lands (about 75 seconds)

**Chacha brings the bill, collects any debt, tells the player whether the goal was reached, names what kind of money manager they were this month, and then shows where every rupee went, with margin notes and up to four recap cards written from the player's own numbers.** This is the screen that proves the game is educational. It is where concepts are named for the first time.

### The order of the Tally

| Step | Screen | What happens |
| --- | --- | --- |
| A | Settle | Debts are collected from Spend, then Emergency, then Save. Chacha narrates. |
| B | Headline | One ending from section 3, with a stamp on the wish board card |
| C | The report | The six numbers |
| C2 | The reading | One description of what kind of money manager the player was. Never a ranking. |
| D | Margin notes | The ledger scrolls; Chacha's remarks appear beside key lines |
| E | Chacha's callbacks | Up to two "I said" lines about the player's guesses and patterns |
| F | Recap cards | Up to four, swiped one at a time |
| G | The wall | One of the Regulars, with Chacha's caption |
| H | Chacha's chit | One thing to try this week, on a torn slip |
| I | Close | Same table, new month. Replay or Notebook. |

A **Skip to the end** button is always visible. Cards and chit are saved to My Notebook either way.

### Step A: Settle

| Situation | Chacha's line |
| --- | --- |
| Nothing owed | "Nothing owed. Cleanest page in the book." |
| Quick Cash repaid | "Payday. Quick Cash collects ₹{r}. The extra ₹{e} goes with it." |
| Not enough to repay | "₹{o} still owed. It comes out of next month's money before you see it." |

The clock on the wall still says 4:10. Chacha: "The clock never moves. Your month did."

### Step B: Headline

Use the endings table in section 3. When the goal is reached, Chacha stamps **DONE** on the wish card, a second stamp thunks across the Month bar (**MONTH SURVIVED**, the knockout moment), marigold petals drift across the room (a few, not a shower), and he says: "Goal reached. Here is how you did it." When it is not reached, the Month bar is stamped **NOT YET** (a stamp, never a defeat) and he says what it needs, never what was wrong.

Then one second line, chosen by what the player did with their wants. It exists so that nobody walks away believing that spending nothing is the point:

| Condition | Chacha's second line |
| --- | --- |
| Goal reached and wants plus little things are above ₹0 | "You spent ₹{w} on things you valued and still got there. That is the whole trick." |
| Goal reached and wants plus little things are ₹0 | "You got there by saying no to everything. Look at the bottle. That is what it cost." |
| Goal not reached and wants plus little things are above ₹0 | "You spent on things you valued. The goal needed ₹{x} more. Both are true." |
| Goal not reached and wants plus little things are ₹0 | "Nothing on wants, and the month still got to you. Look at where the bills came from." |

### Step C: The report

Six numbers on one ledger page, each tied to a concept so the player can see the idea in their own figures.

| Number | Shows | Connects to |
| --- | --- | --- |
| **Saved** | Gullak ₹S out of ₹250, as a bar | Pay yourself first, goals |
| **Bills** | The three bills (₹80), with the source each was paid from | Needs, goals and trade-offs, track spending |
| **Wants** | Total of window and Big Night buys, split into big (₹100 or more) and small, by ledger category (food, fun and games, shopping, phone, social) | Track spending, wait before you buy |
| **Little things** | Total from Round 3, next to the player's guess | Small spends add up |
| **Cushion** | Umbrella money used, and money left for next month | Emergency fund, plan for surprises |
| **Cost of money** | Extra paid on Quick Cash, with the amount lent to Teja, if any | Cost of borrowing, lending to friends |

A small line under the report: "Glad: ₹{g}. Meh: ₹{m}." from the Worth-it review, and one about the bottles, in words: "The orange bottle is {stage}. The teal one is {stage}."

If money was lent to Teja, the epilogue from section 13 appears beside the Cost of money row.

### Step C2: What kind of money manager were you this month?

One reading, chosen by the first row that matches, in this order. (The Quiet Holder comes before The Shelf First so a run that refused everything, like the Vault, is described honestly.) It describes what Chacha saw. It is never a rank, never a grade, and every reading ends on a neutral note.

| Order | Reading | Condition | Chacha's line |
| --- | --- | --- | --- |
| 1 | **The Fast Mover** | Quick Cash used | "You moved fast when it mattered. Speed has a price, and you paid it with your eyes open." |
| 2 | **The Open Hand** | Lent or gave ₹50 or more | "You looked after a friend first. I have seen worse plans. I have seen better timing." |
| 3 | **The Window Waiter** | Cooled two or more items | "You let things cool. Some you kept, some you dropped. The pause is yours now." |
| 4 | **The Quiet Holder** | Stayed in at the Big Night, or wants were ₹0 | "You said no all month. It worked, and the bottle is still fizzing. Both are true." |
| 5 | **The Shelf First** | Save was ₹150 or more at payday and the goal was reached | "You paid the shelf first and lived on what was left. The month had to fit around it." |
| 6 | **The Door Watcher** | Emergency was ₹100 or more at payday and the rain was covered by it | "You kept something by the door. The rain came, and the door held." |
| 7 | **The Even Keeper** | None of the above | "A bit of everything. Not a pattern yet. That is fine. Patterns come with the second month." |

### Step D: Chacha's margin notes

Each ledger line gets at most one note, picked from this table. Never more than eight notes on the page.

| Ledger line | Note |
| --- | --- |
| Paid itself first (Save ₹100 or more at payday) | "Paid first." |
| Save was ₹0 at payday | "Shelf was empty." |
| A ₹100-plus purchase made without cooling | "On the spot." |
| An item cooled and then bought | "Waited. Still wanted. Fair." |
| An item cooled and then dropped | "Waited. Lost its shine." |
| Tagged Meh | "Meh. Noted." |
| Tagged Glad | "Glad. That counts." |
| Four or more trolley items in a row | "The little things, in a row." |
| Loan to Teja | "Friday." |
| Gift to Teja | "Gone, gladly." |
| Repair covered by Emergency (₹100 or more) | "Dry." |
| Repair with no Emergency used | "Wet." |
| Quick Cash used | "₹{e} for the speed." |
| A bill paid from Save | "Off the shelf, for a bill." |
| Big Night: went | "Went." |
| Big Night: stayed in | "The fizz stayed, too." |

### Step E: Chacha's callbacks (the unnervingly perceptive part)

The game shows at most two of these. They are built from real data, so they land because they are accurate. None judges.

| Condition | Chacha's line |
| --- | --- |
| Predict 1 was "none" and a surprise came | "You said none. The cloud said one." |
| Predict 1 was "one" and one came | "You said one. Right. Expecting it is its own skill." |
| Predict 1 was "no idea" | "You said no idea. The honest answer. Now you have an idea." |
| Predict 2 guess was too low | "You guessed {range}. It was ₹{x}. Yusuf is a patient man." |
| Emergency was ₹0 at payday and a surprise came | "At the start I said 'brave'. It was an accurate word." |
| Player cooled and dropped at least one item | "You let it cool and walked away from ₹{x}. I notice these things." |
| Player lent ₹100 and then used Save or Quick Cash in Round 5 | "Teja had your ₹100 when the rain came. I mention it only because I am watching." |
| Player borrowed without opening the fine print | "You borrowed without flipping the card. I would flip it next time." |
| Player stayed in at the Big Night | "You said no to the night. The bottle did not forget." |
| Player bought a fizz item early and no Big Night came | "You spent ₹{x} early on what you wanted. The marble never popped." |

### Step F: Recap cards

Every card has three lines: **What happened**, **Why it matters**, **Try this**. Up to four cards are shown, chosen in this priority order from the ones that apply: Cost of borrowing, Emergency fund, Needs and wants, Small spends add up, Wait before you buy, Lending to friends, Goals and trade-offs, Pay yourself first, Track spending, Plan for surprises. All applicable cards are saved to the Notebook.

| Card and variant | What happened | Why it matters | Try this |
| --- | --- | --- | --- |
| **Pay yourself first** (Save ₹150 or more at payday) | "You put ₹{S} in the gullak before the first chai." | "Money set aside first is protected from the small things that show up later." | "On the day money arrives, move a fixed amount to a separate place before you spend any." |
| **Pay yourself first** (Save under ₹150) | "You set aside ₹{S} before spending." | "What you set aside first is what you keep. What you leave for later has many claims on it." | "Decide the amount before the money arrives, even if it is small." |
| **Track spending** | "The ledger has {n} entries. Your {range} guess on the little things was ₹{x} in reality." | "You cannot manage what you cannot see. A list shows the spends you would not have noticed." | "For three days, write down every spend, even ₹10, in your phone's notes." |
| **Small spends add up** (guess was too low) | "The little things came to ₹{x}, above your guess." | "Small amounts feel too small to count, so they skip the checks we use on big ones." | "Pick one small daily spend. Add up its cost for a month." |
| **Small spends add up** (guess correct or high) | "You kept the little things to ₹{x}." | "Noticing is what keeps small spends small." | "Look at one regular small spend and ask: am I glad about this one?" |
| **Emergency fund** (surprise covered by Emergency) | "The umbrella stand covered ₹{c} of the ₹{b} bill." | "A cushion turns a surprise into an inconvenience instead of a debt." | "Start a cushion with even ₹20 a month. Aim first for one small surprise." |
| **Emergency fund** (not covered) | "The ₹{b} bill came from {sources}." | "Without a cushion, a surprise is paid for by your goal, a loan, or both." | "Next payday, set something aside before spending. Even ₹50 helps." |
| **Plan for surprises** | "You guessed {p}. The month sent {n}." | "Surprises are certain. Only their size and timing are unknown." | "Ask: what is the most likely surprise in my month? Put its rough cost aside." |
| **Wait before you buy** (cooled and dropped one or more) | "You let {m} things cool. {d} lost their shine, saving ₹{x}." | "A pause separates 'I want it now' from 'I want it'." | "Wait a night before buying anything unplanned over ₹100." |
| **Wait before you buy** (cooled, still bought) | "You let {m} cool and still bought {y}." | "That is a decision, not an impulse. Waiting is a check, not a rule." | "Keep using the pause. You will learn your wants." |
| **Wait before you buy** (never cooled) | "You decided on the spot every time." | "Sellers say 'today only' because pauses work against them." | "Pick one item to put off for a night and see what happens." |
| **Goals and trade-offs** (goal reached) | "You reached ₹250, spent ₹{x}, and kept ₹{y} for rain." | "Every rupee has many possible uses. A goal helps you choose which one wins." | "Name your next goal and give it a date." |
| **Goals and trade-offs** (not reached) | "You are ₹{x} short. The biggest moves were {top two}." | "Goals move when other things claim the money. Seeing which ones is the first step." | "Pick the biggest single mover and decide in advance how much of it you will allow." |
| **Cost of borrowing** (Quick Cash) | "You borrowed ₹{b} and paid back ₹{r}: ₹{e} extra, about {pct} percent, within days." | "Fast money has its price on the back. A cushion would have cost nothing extra." | "Before borrowing, read what you pay back, not what you get." |
| **Needs and wants** (Big Night, went) | "A want kept building until the Big Night, and you went." | "A want that is refused again and again can grow into one big spend. Small, planned yeses can be cheaper." | "Pick one want you keep refusing. Decide a small amount for it each month." |
| **Needs and wants** (Big Night, stayed in) | "You stayed in, and the money stayed. The bottle is still full." | "Refusing is allowed. It can build pressure, and it helps to notice it instead of pretending it is not there." | "Say out loud one thing you are skipping, and when you might say yes." |
| **Needs and wants** (no Big Night) | "Your bills came to ₹80 and your wants to ₹{w}." | "Bills are not choices. Wants are. Telling them apart is the first move in any budget." | "Write next month's bills first. What is left is yours to plan." |
| **Lending to friends** (lent) | "₹{l} was with Teja when the rain came." | "Lent money is not yours to use until it returns, and friends are sometimes slower than Friday." | "Lend only what you could live without for a while, and say the amount out loud." |
| **Lending to friends** (gift) | "You gave ₹30, no strings." | "A small gift keeps things simple. Nobody has to remember anything." | "If you cannot wait for it back, give less and do not expect it." |
| **Lending to friends** (said no) | "You said no, kindly." | "A kind no protects the friendship and the plan." | "Keep one sentence ready: 'I cannot this month. Next chai is on me.'" |

### Step G: The wall of Regulars

One framed photo lights up. Chacha reads its caption. Selection: Sana if Save was ₹150 or more at payday; Mr. Rao if the little things were more than ₹100; Vicky if the player bought an item they tagged Meh; Farida Aunty if the ledger was opened three or more times; otherwise Sana.

| Regular | Chacha's caption |
| --- | --- |
| Sana, Table 2 | "Sana puts something away on the first, before the first chai. Her chai tastes exactly the same." |
| Mr. Rao, Table 6 | "Mr. Rao, third chai, fourth 'quick' snack. He keeps a register now." |
| Vicky, Table 4 | "Vicky bought the headset twice. He waits a night now." |
| Farida Aunty, Table 1 | "Farida Aunty writes down every rupee. Her month never surprises her. Only the rain does." |

Chacha adds, every time: "Nobody here was born knowing this."

### Step H: Chacha's chit

A slip of paper, in his handwriting, torn from the pad. It names one thing to try this week. The first matching row is used.

| Condition | Chit |
| --- | --- |
| Quick Cash used | "This week: find out what it would cost to keep ₹150 by the door. Start with ₹20." |
| Emergency was ₹0 | "This week: put even ₹20 somewhere you will not touch." |
| Stayed in at the Big Night | "This week: name one thing you are skipping, and one you will say yes to." |
| Little things were over ₹100 | "This week: write down every spend under ₹50 for three days." |
| Never cooled | "This week: wait one night before one unplanned purchase." |
| Lent ₹100 | "This week: practise one sentence: 'I can do ₹50.'" |
| Otherwise | "This week: write down your next goal and a date next to it." |

A **Keep it** button tears the chit off and saves it to the Notebook.

### Step I: Close

| ID | Speaker | Text |
| --- | --- | --- |
| 6.1 | Chacha | "Same table. New month. Change one thing and we go again." |
| 6.2 | Buttons | **See where it went** (opens the ledger), **Play again**, **My Notebook** |

## 13. Replay: where learning shows

**Run 1 is the baseline. Run 2 is the proof. The player picks one thing to change, plays the same table again with a different month, and the game shows what moved.** This is the experiment step of the loop, and it is also the cleanest way to measure learning without a quiz.

### The one-change screen

After the Tally, Chacha says: "Same table. New month. Pick one thing to do differently." The player picks exactly one chip. It is their hypothesis and is stored as `experiment_choice`.

| Chip | What it means in the game |
| --- | --- |
| Put more by the door | Larger Emergency at payday |
| Put more on the shelf | Larger Save at payday |
| Let more things cool | Use the saucers more |
| Skip more of the little things | Fewer trolley purchases |
| Be smarter with Teja | Lend less, or say no kindly |
| Read the fine print | Open it before any borrowing |
| Spend a little on purpose | Say yes to at least one thing you care about |
| Surprise me | No change chosen; the player will improvise |

Chacha reacts: "One change. Good. That is how people learn here. One thing at a time."

### What changes in the new month

Income (₹600) and goal (₹250) stay the same on Month 2 so the comparison is fair. What changes is the month.

| Element | Month 1 | Month 2 and later |
| --- | --- | --- |
| Surprise | Cracked phone, ₹150 | Drawn from the bank in section 11, never the same as last time |
| Fizz bottles | FUN 25, FRIENDS 35 | Start where they ended if the player stayed in (up to 100). If a bottle starts full, the Big Night arrives on Day 1 and costs ₹100. |
| Bills | Auto ₹20, data ₹30, lunch ₹30 | The same three needs; one amount moves by ₹10 |
| Window items | Fixed order | Same items, shuffled order (the four hackathon items reshuffle), ₹10 price shifts on two of them |
| Trolley | Fixed order | Shuffled |
| Teja's reason | Match ticket | A different, equally ordinary reason (a project kit, a bus pass, a birthday gift) |
| Cloud | Visible from Round 1 | Same, but at a slightly different spot, so the player stays alert |
| Chacha | Greets a new customer | "Back again. Good. The chai is still warm." |

### Difficulty ladder (optional months)

Offered only after Month 2. All three are voluntary and say so.

| Month | Name | Change |
| --- | --- | --- |
| 3 | A tighter month | Income ₹500, goal ₹250. The best split is different, so the player must reason, not copy last time's numbers. |
| 4 | Two rains | Two surprises, ₹150 then ₹80, a few days apart |
| 3b | Rush hour (any month after 2) | The trolley advances on its own every 3 seconds. A missed item counts as Skip and costs nothing. |
| 5 | A month for someone else | The player advises Teja on how to split Teja's ₹600 (teach-back). See below. |

**Teach-back (Month 5):** Teja sits at the table and says: "I get ₹600 on the first. Where should it go?" The player drags Teja's coins into the three containers. Chacha then shows what happens to Teja's month using the same rules. This tests transfer: can the player apply the ideas to someone else's situation.

### The Then and Now screen (after Month 2)

Chacha lays last month's page beside this month's. Eight rows, shown as plain numbers with a small arrow. The screen **never colours a change green or red**, and never says better or worse. The player reads it.

| Row | Last month | This month |
| --- | --- | --- |
| Saved (gullak) | ₹{a} | ₹{b} |
| Emergency at payday | ₹{a} | ₹{b} |
| Little things (Round 3) | ₹{a} | ₹{b} |
| Cooled and dropped | {a} of {m1} | {b} of {m2} |
| Borrowed (Quick Cash) | ₹{a} | ₹{b} |
| Lent out | ₹{a} | ₹{b} |
| Bills paid from Save | ₹{a} | ₹{b} |
| Fizz stage at the Big Night | {a} | {b} |

Then one sentence about the experiment the player chose.

| Experiment chosen | Chacha's line when the numbers moved that way | Line when they did not |
| --- | --- | --- |
| Put more by the door | "More by the door. The rain cost you ₹{x} extra this time." | "More by the door, and the rain still needed more. That happens. Look at the bill." |
| Put more on the shelf | "The shelf is fuller by ₹{x}. The goal is closer." | "The shelf is the same. The month had other plans." |
| Let more things cool | "{d} things lost their shine. That is ₹{x} you kept." | "You cooled them and wanted them anyway. That is a decision." |
| Skip more of the little things | "The little things came to ₹{x}, down from ₹{y}." | "The little things are about the same. They are persistent." |
| Be smarter with Teja | "You lent ₹{x} this time. It was an amount you could live without." | "Same as last time. Next time, try one sentence: 'I can do ₹50.'" |
| Read the fine print | "You flipped the card first. Good habit." | "No borrowing this time, so no card to read. That works too." |
| Spend a little on purpose | "You said yes to {n} things you cared about. The bottle stayed quieter." | "The things came and went. The bottle will tell you how that felt." |
| Surprise me | "No plan, no pattern. Let us see what you do next month." | (same) |

### Teja's epilogue (varies by run, so Friday is never a promise)

Shown in the Tally if money was lent.

| Run | Epilogue |
| --- | --- |
| 1 | "Teja said Friday. The game ends before Friday." |
| 2 | "Friday came. Teja paid back ₹{x}, with a chai." |
| 3 | "Friday passed. Teja is 'sorting it out'." |
| 4 and later | Cycles through the three above |

The design intent: lent money returns on a schedule you do not control.

### Observed-behaviour checks

**These are not scores shown to the player, and they are not mastery.** Each is a simple yes or no per run describing what the player *did*. Used on their own they would be weak evidence, so each concept has two signals and the dashboard reads them across runs. A student who never uses the saucer may simply not want the items; a student who has a large Emergency may have been lucky. The dashboard says "observed", never "understands".

| Concept | Observed in a run (either signal counts) |
| --- | --- |
| Pay yourself first | Save at payday is at least ₹100 **and** Save is still at least ₹100 at the Tally |
| Track spending | Ledger opened at least twice, **or** the Predict 2 guess is within one band of the actual total |
| Small spends add up | Predict 2 guess within one band of actual, **or** little things lower than the previous run |
| Emergency fund | Emergency at payday is at least ₹100, **or** the rain was covered without Save or Quick Cash |
| Plan for surprises | Emergency at payday is greater than ₹0 |
| Wait before you buy | Used a saucer at least once, **or** bought no item of ₹100 or more on the spot |
| Goals and trade-offs | Took money from Save for wants at most once, **and** chose a source (rather than only dismissing the prompt) for every bill |
| Cost of borrowing | Opened the fine print before borrowing, **or** did not borrow |
| Lending to friends | Lent no more than half of Spend, **or** gave, **or** declined |

The headline learning measure per player is the **number of these nine that flip from no in Month 1 to yes in Month 2**, read alongside the Then and Now screen. A flip is a prompt to look at what changed, not a certificate.

## 14. Assessment, data and the NGO dashboard

**The game logs only choices, never identities, and turns them into nine observed-behaviour checks, four skill levels and a cohort view the NGO can read at a glance.** There is no quiz. The evidence is what the player did, run by run. It is behaviour, not mastery, and every panel says so.

### Privacy rules

- No names, no phone numbers, no free text, no location.
- A **cohort code** (for example a class or batch) is the only link between a player and a group. A player without one is stored on their own device only.
- The entry card says: "We save only your game choices, not who you are."
- Players can clear their data from Pause at any time.

### Event log

Every event carries `cohort`, `run`, `persona`, `language` and a timestamp. These fields are on top of that.

| Event | When | Fields |
| --- | --- | --- |
| `session_start` | Café entered | device class (phone or desktop) |
| `goal_picked` | Round 0 | goal |
| `predict1` | Round 0 | answer (none, one, two or more, no idea) |
| `payday_confirmed` | End of Round 1 | spend, save, emergency |
| `bill_paid` | Phase 1, 2 and 3 | bill id, amount, source (spend, save, emergency, quick) |
| `window_item` | Round 2, per item | item, kind, action (get, cool, pass), spend after, taken from Save |
| `fizz` | End of each phase | FUN and FRIENDS values |
| `bignight` | Round 4 | triggered (yes or no), choice (go, half, stay), source |
| `cool_result` | After a saucer | item, result (still wanted, dropped, sold out) |
| `trolley_item` | Round 3, per item | item, action (ok, skip), taken from Save |
| `predict2` | Round 3 | guess band, actual total |
| `worth_it` | Round 3 | item, tag (glad, meh) |
| `teja` | Round 4 | choice, lent, gift, spend before |
| `rain_start` | Round 5 | surprise id, bill |
| `fineprint` | Round 5 | opened (yes or no), predict 3 guess, borrowed after |
| `pay` | Round 5 | amount from each source |
| `tally` | Round 6 | headline, reading (money-manager type), saved, bills by source, wants, cushion used, cushion kept, lent out, borrowing cost |
| `card_viewed` | Round 6 | card id |
| `chit_kept` | Round 6 | chit id |
| `experiment` | Replay | chip chosen |
| `run_end` | Any exit | run number, duration in seconds, completed (yes or no) |

### From events to evidence

The nine observed-behaviour checks from section 13 are computed from these events. Each is yes or no per run, and a check needs to be yes in at least two runs before the dashboard calls it "consistent". One run is a moment, not a trait.

### Four skill levels (feeds the hidden skill tracker)

This pillar contributes to four of the six skills. Levels are based on how many of that skill's checks were observed **in the latest run**, not on a score, and they describe behaviour seen, not ability.

| Skill | Checks from this pillar | Starting | Growing | Confident |
| --- | --- | --- | --- | --- |
| Planning ahead | Pay yourself first, Plan for surprises | 0 of 2 | 1 of 2 | 2 of 2 |
| Keeping a buffer | Emergency fund, Plan for surprises | 0 of 2 | 1 of 2 | 2 of 2 |
| Prioritising | Goals and trade-offs, Wait before you buy, Track spending | 0 or 1 of 3 | 2 of 3 | 3 of 3 |
| Cost of borrowing | Cost of borrowing, Lending to friends | 0 of 2 | 1 of 2 | 2 of 2 |

The other two skills (risk and diversification, spotting scams) come from the other pillars.

### The NGO dashboard for this pillar

One page, filterable by cohort code, language and persona. Until real data arrives, every panel shows **clearly labelled sample data**.

| Panel | Question it answers | Metric |
| --- | --- | --- |
| Reach | How many students played, and how many finished? | Players, completion rate, median run time |
| Observed change | What behaviour changed between Month 1 and Month 2? | Share who replayed; average number of the nine checks that flipped to yes |
| Behaviour by behaviour | Which of the nine behaviours is most and least often observed in this cohort? | Share of yes per check, Month 1 beside Month 2 |
| Pressure and sources | How do students answer "where should this come from?" and what do they do with pressure? | Share of bills paid from Save, Emergency and Spend; share who went, joined for half or stayed in at the Big Night; most common fizz stage at the Big Night |
| Common patterns | What do students do most? | Share with Emergency at ₹0 at payday; share who underestimated small spends; share who used Quick Cash; share who opened the fine print first; split of Teja choices |
| Hard moments | Where do students get stuck or drop out? | Drop-off by round, average time per round |
| Skills | How are the four skills distributed? | Counts at Starting, Growing and Confident |
| Facilitator prompts | What should the class discuss tomorrow? | The two weakest concepts, each with a three question discussion guide (section 16) |

## 15. Look, motion, sound and the island

**The café is one hand-painted stage, lit warm, with ink-outlined rubber-hose characters who move at about 10 frames a second, and it is presented like a boss fight: name cards, phase transitions, a thunder freeze and a knockout stamp.** It is warm and calm to look at, like the island map, and the old-cartoon feel comes from the line and the motion, not from noise or clutter. The tension comes from the decisions, never from shouting at the player.

### Art direction

- **Stage:** a side-on café interior painted in watercolour and gouache, one backdrop with paper texture. Marble tables, bentwood chairs, an aged mirror, slow fans, a glass case of biscuits, black and white floor tiles, a window onto a rainy lane.
- **Characters:** rubber-hose limbs, big round heads, thin ink outlines in `#3A2A24`, flat colour with a hint of shading. Original designs only. Nothing is copied from any existing game or cartoon.
- **Texture:** very light paper grain over everything. No scratches, no heavy vignette, no shake.
- **Colour (café tokens, to sit with the island palette):**

| Token | Hex | Used for |
| --- | --- | --- |
| Marble cream | `#EFE6D2` | Tables, notes, cards |
| Café teal | `#6FA3A0` | Walls, window frame |
| Tile green | `#5E8A5A` | Floor, plants |
| Wood | `#8A5A3C` | Chairs, counter |
| Chai amber | `#D9A84E` | Warm light, tea glasses, coins |
| Terracotta | `#C97B4A` | Gullak, accents |
| Rain grey-blue | `#8FA7B3` | Cloud, rain, window |
| Ink | `#3A2A24` | Outlines, handwriting |

- **Type:** a vintage display serif for title cards, a clean sans (Noto Sans, with Devanagari and Telugu) for body text, and a handwriting face for Chacha's margin notes. Kalam covers Latin and Devanagari; pick a Telugu handwriting font from Google Fonts and check every glyph renders.

### Boss presentation

| Moment | Treatment |
| --- | --- |
| Boss name card | At the start of Round 0: "POCKET PANIC · THE MONTH" on a vintage frame, with the small cloud. A quick wipe in, held one second, wipe out. |
| Phase card | At the start of each phase: "PHASE 2 OF 4 · LITTLE LEAKS", the Month bar sliding into place, the cloud one stage closer. The same wipe. |
| Cloud stages | Five stages: far (R0 to R1), small (R2), medium (R3), at the window (R4), overhead (R5). It never moves backwards. |
| Bill entrance | A paper slip slides onto the table and a BILL stamp thunks onto it. A different sound and silhouette from a vendor, so a need never looks like a want. |
| Fizz | Bubbles rise inside the bottle in stepped frames. At 100 the marble pops out with a thunk and rolls across the table. |
| Rain finale | Held frames: everything stops for the freeze, the phone slides in six frames, the camera pans back over the table. See section 11. |
| Knockout | At the Tally a rubber stamp thunks MONTH SURVIVED (or NOT YET) across the Month bar. Marigold petals drift. No fireworks, no fanfare. |
| Reduced motion | Wipes become fades, the freeze becomes a still beat, the camera pan becomes a cross-fade. Nothing is lost: every beat is also text on screen. |

### Animation list (kept small enough to build in a few hours)

All characters are layered SVG or image parts moved with stepped transforms at about 10 fps. No sprite sheets are needed.

| Element | Animation | When |
| --- | --- | --- |
| Chacha | Polishes the glass (looped), taps the counter twice, raises one eyebrow, nods slowly, writes in the ledger (pencil jitter) | Idle, before key lines, on Quick Cash, on every ledger write |
| Yusuf | Pushes the trolley, small wave | Round 3 |
| Teja | Walks in, sits, hands wave | Round 4 |
| Vendors | Walk in, a small bounce on the pitch, walk off | Round 2 |
| Coins | Flip, drop with a small bounce into a container, a quick shine when counted | Round 1 and every transfer |
| Gullak | Rises to the high shelf on confirm. A tiny wobble when a coin lands. | Round 1, Round 5 |
| Umbrella stand | The umbrella pops open when Emergency covers the bill | Round 5 |
| Saucer | Steam fades over 10 seconds in steps | Round 2 |
| Plates | Fly in and stack into a wobbling tower, then the bill slip unrolls | Round 3 |
| Cloud and rain | Cloud creeps closer at each phase. Rain falls in stepped frames. One thunder flash and a held freeze. | Rounds 1 to 5 |
| Fizz bottles | Bubbles rise in stepped frames; marble pop at 100 | Rounds 1 to 4 |
| Bills | Paper slip slides in, BILL stamp thunks | Rounds 2 to 4 |
| Month bar | A pointer steps along the 30 days | Throughout |
| Table pull-back | A slow camera pan back over the whole table | Round 5 |
| Knockout stamp | MONTH SURVIVED thunks onto the Month bar | Round 6 |
| Phone | Buzzes, slides and cracks (crack drawn as an overlay) | Round 5 |
| Ledger | Page flip, margin notes writing in letter by letter | Round 6 |
| Wish card | A rubber stamp thunks on "DONE" | Round 6 |
| Title cards | A quick wipe in, held for one second, wipe out | Start of each round |

### Sound

Off by default, so the game works silently in a classroom. If time allows, five effects only: bell, rain, coin clink, pencil scratch, thunder. No music.

### Asset list for art generation

| Group | Items |
| --- | --- |
| Backdrop | One café interior plate, 2400 by 1350 |
| Props | Tumbler, gullak, umbrella stand, saucer, ledger, phone (whole and cracked), coin, plate, tea glass, trolley, wish board with three goal cards, rain overlay, cloud (five sizes), two goli soda bottles with marbles, paper bill slip, BILL stamp, MONTH SURVIVED and NOT YET stamps, Month bar |
| Characters | Chacha (idle, talking, eyebrow, writing), Yusuf (2), Teja (3), three player personas (seated, 2 poses each), four vendors (1 each), Quick Cash mascot, four framed Regulars |
| Items | The 8 window items, 12 trolley items and 3 bills as small icons (no brand marks) |

**Generating the art:** make the backdrop and character heads with an image generator using one fixed style line so they match, keep bodies simple, and animate with transforms. A good style line: "hand-painted watercolour and gouache, thin warm-brown ink outline, flat colour, old animated-cartoon feel, muted palette, paper texture, no text". Describe each character by role and costume, never by naming another game or character.

### Layouts

| Device | Layout |
| --- | --- |
| Desktop and tablet landscape | The full 16:9 stage. Containers sit on the stage; the HUD floats on top. |
| Phone portrait | A 4:5 crop centred on the table. The window sits at top left as a small picture-in-picture. The three containers become a tray along the bottom with their ₹ tags. Chacha's caption bar sits above the tray. |
| Phone landscape | Same as desktop, scaled down |

### How it plugs into the island

- On the island map, the Irani café node shows "Save & Manage, about 6 minutes". Tapping walks the token to the door and cross-fades into the café.
- Leaving the café returns to the island with the café flag turned gold after any completed run, and a small steam wisp above the roof.
- My Notebook is reachable from the island's menu, not only from the café.

## 16. Languages, access, guardrails and the facilitator guide

**The game ships in English, Hindi and Telugu from one set of string keys, works without audio, and follows a short list of rules that keep it honest, kind and safe.**

### Language

Every string in sections 5 to 12 is a key in `en.json`, `hi.json` and `te.json`. No text is baked into any image. The strings below are **drafts written by Claude and must be reviewed by native speakers** before use; list anything uncertain in `TRANSLATION_REVIEW.md`.

| English | Hindi (draft) | Telugu (draft) |
| --- | --- | --- |
| Take a seat | बैठिए | కూర్చోండి |
| One month. ₹600. One table. Let's see where it goes. | एक महीना। ₹600। एक मेज़। देखते हैं पैसा कहाँ जाता है। | ఒక నెల. ₹600. ఒక బల్ల. డబ్బు ఎటు వెళ్తుందో చూద్దాం. |
| Chai first. Panic later. | पहले चाय, घबराहट बाद में। | ముందు చాయ్. కంగారు తర్వాత. |
| Little things have long bills. | छोटी चीज़ों के बिल लंबे होते हैं। | చిన్న ఖర్చులకు పొడవైన బిల్లులు ఉంటాయి. |
| Let it cool | ठंडा होने दें | చల్లారనివ్వండి |
| Instant is always priced instant. | जल्दी की कीमत हमेशा ज़्यादा होती है। | తక్షణం అంటే ఎప్పుడూ ఎక్కువ ధరే. |
| I lend only what I can afford to forget. You should, too. | मैं उतना ही उधार देता हूँ जितना भूल सकूँ। आप भी ऐसा ही कीजिए। | మర్చిపోగలిగినంతే అప్పు ఇస్తాను. మీరు కూడా అలాగే చేయండి. |
| Goal reached. Here is how you did it. | लक्ष्य पूरा हुआ। देखिए, कैसे हुआ। | లక్ష్యం చేరుకున్నారు. ఎలా చేశారో చూద్దాం. |
| Where should this ₹{x} come from? | यह ₹{x} कहाँ से आना चाहिए? | ఈ ₹{x} ఎక్కడినుండి రావాలి? |
| Bills do not ask. They arrive. | बिल पूछकर नहीं आते। बस आ जाते हैं। | బిల్లులు అడిగి రావు. అలా వచ్చేస్తాయి. |
| Big Night | बड़ी रात | పెద్ద రాత్రి |
| MONTH SURVIVED | महीना पार | నెల దాటాం |
| Same table. New month. Change one thing and we go again. | वही मेज़, नया महीना। एक चीज़ बदलिए और फिर से शुरू करें। | అదే బల్ల. కొత్త నెల. ఒక్క విషయం మార్చండి, మళ్లీ మొదలుపెడదాం. |

**Localisation rules:** keep ₹ and Western numerals everywhere. Chacha addresses the player respectfully ("आप" in Hindi, the polite form in Telugu). His lines stay short and dry in every language. A line that is much longer in translation is rewritten, not squeezed.

### Accessibility

| Area | Rule |
| --- | --- |
| Input | Every drag has a plus and minus alternative. Everything works with the keyboard. Tap targets are at least 48 px. |
| Time | **No decision has a deadline.** Offers wait on the window until the player acts, trolley items wait at the pay line, and bills wait to be paid. Only the cooling saucer counts time (10 seconds of steam, by choice) and Rush hour (optional, and a missed item is free). Pause freezes everything, including saucers and the cloud. Slow mode slows the animations. |
| Vision | Contrast meets WCAG AA. Colour is never the only signal (tags also carry words and icons). Text is at least 16 px. A dyslexia-friendly font option is available. |
| Hearing | The game is silent by default. Every line is on screen. |
| Motion | Reduced motion removes rain, wobble and wipes and swaps them for fades. Lite mode removes paper grain. |
| Reading level | Chacha's lines are 18 words or fewer, written at about a grade 5 to 6 level. |
| Devices | Total download under 5 MB with the generated art compressed. Plays offline after the first load. Smooth on a mid-range Android phone. |
| Screen readers | Each container, item and button has a label that includes its ₹ amount. |

### Guardrails

- **No real brands or products.** Quick Cash is a made-up example and says so on screen. Check that "Café Meherban" does not clash with a real café.
- **Illustrative amounts.** Every screen that shows money carries "Illustrative amounts. Real prices differ." somewhere on the page.
- **No shaming, no right answers.** The game never says wrong or bad. It shows what each choice cost and bought.
- **No chance-based rewards.** Nothing in the game pays out by luck, so it does not feel like gambling.
- **Chacha is not a caricature.** No accents played for laughs, no jokes about a community. He is perceptive and kind. Have a few Hyderabadi reviewers read his lines.
- **Dignity.** Chacha never jokes about being poor. For a player with little spare money, the Tighter month is offered as a challenge, not as a punishment.
- **Sensitive surprises.** The medical surprise (bank item 5) is tested with students and teachers before it ships.
- **Hunger is valid.** Food is never framed as a temptation to resist.
- **Not financial advice.** The entry card says so.
- **Pressure is not a command.** The fizz never says "you must buy". Staying in costs no money and is never described as a mistake. Some wants have no fizz at all and can be ignored forever.
- **Needs are small and dignified.** Nobody jokes about not being able to afford lunch or data. Bills are shown as ordinary things that arrive.
- **Observed behaviour is not a verdict.** The dashboard never labels a student; it reports what they did and that one run is a moment.
- **The boss never hurts anyone.** No health bars, no damage, no failure screens. Stamps, not defeats.

### Facilitator guide (for a class, 13 minutes)

1. Everyone plays one month (6 minutes).
2. Pick two concepts from the dashboard's weakest list and use the questions below (5 minutes).
3. Everyone reads their Chacha's chit aloud to a partner (2 minutes).

| Concept | Three questions |
| --- | --- |
| Pay yourself first | 1. Who decided where your money went before you played Round 2? 2. What did the shelf protect you from? 3. What would you set aside first in real life? |
| Track spending | 1. What surprised you in the ledger? 2. Which spend would you not have remembered? 3. How could you track this week without it feeling like work? |
| Small spends add up | 1. What was your guess, and what was the total? 2. Which small spend do you make most often? 3. Which small spends are you always glad about? |
| Emergency fund | 1. What did the umbrella stand do for you, or what would it have done? 2. How much cushion feels reasonable for your own month? 3. What surprises have you or your family had? |
| Plan for surprises | 1. Did you expect a surprise? 2. Which surprise is most likely in your own month? 3. What would you stop doing to make room for one? |
| Wait before you buy | 1. Which item lost its shine in the saucer? 2. Which one did you still want? 3. What is one thing you could put in a saucer this week? |
| Goals and trade-offs | 1. What did you give up to move your goal? 2. Which choice moved the goal the most? 3. What is a goal of yours, and what would you trade for it? |
| Cost of borrowing | 1. How much did Quick Cash charge? 2. How would you check the price of borrowing before saying yes? 3. What is the difference between paying from your cushion and borrowing? |
| Needs, wants and pressure | 1. Which payments could you not pass? 2. Which wants kept building, and what happened at the Big Night? 3. What is one want you could plan a small yes for? |
| Where should it come from? | 1. Which jar paid for your bills? 2. What did taking from Save do to your goal? 3. When is it sensible to take from the cushion, and when is it not? |
| Lending to friends | 1. What did you do when Teja asked? 2. How do you say no and keep a friend? 3. How much can you lend without it hurting your plan? |

## 17. Build spec for the team

**Build the game logic as a small pure engine with no UI in it, drive every line of text and every rule from data files, and add the café art last.** That way the educational content can be tested and changed without touching animation code, and a better painted backdrop can be dropped in at any time.

### The hackathon build (what to actually make)

**Build less, and make the finale spectacular.** The design above is a full product. The hackathon prototype is a deliberately narrow slice that still shows the boss structure, the needs and fizz systems, the replay and the evidence engine. Everything else stays in the architecture and the roadmap.

| Part | Hackathon build | Full build |
| --- | --- | --- |
| Round 0 | Walk in, pick a goal, Predict 1 | Same |
| Round 1 | Three jars, drag and plus/minus | Same |
| Needs | All three bills (Auto, recharge, lunch) | Same |
| Round 2, window | **4 items** (Game pack, Jacket, Match ticket, Phone cover) in 3 waves | 8 items in 5 waves |
| Round 3, trolley | **6 items**, Predict 2, plates reveal, Worth it | 12 items, Rush hour option |
| Fizz | FUN bottle fully working; FRIENDS shown and filled by the match ticket | Both bottles, all items |
| Round 4 | Big Night (when the FUN bottle pops) and Teja | Same, plus Month 2 carry-over |
| Round 5 | **The rain finale: all four beats, the pay panel, Quick Cash and the fine print** | Same, plus the surprise bank |
| Round 6 | Headline, the six-number report, the money-manager reading, three recap cards, Chacha's chit | Full Tally with callbacks, the wall |
| Replay | One-change chips, Month 2 with a different surprise, Then and Now | Difficulty ladder and teach-back |
| Dashboard | Sample data, clearly labelled, with observed behaviour panels | Live data |
| Languages | English complete; Hindi and Telugu for the title cards, bills, Chacha's lines | All three complete |

### How to use this doc with Claude Code

Export this doc as Markdown, put it in the project as `docs/cafe-game.md`, and tell Claude Code: "Build the Save & Manage game exactly as specified in docs/cafe-game.md, the hackathon build column of section 17. Follow the build order in section 17. All text comes from locale files. Keep the engine free of UI." Keep the existing project (router, i18n, Zustand store, island map) and add `src/games/cafe/`.

### File plan

| Path | Purpose |
| --- | --- |
| `src/games/cafe/engine/state.ts` | Types and the initial state for a run |
| `src/games/cafe/engine/economy.ts` | Allocation, the source rule, purchases, bills, Big Night, lending, Quick Cash, repayment order, endings |
| `src/games/cafe/engine/pressure.ts` | The two fizz bottles: pull, release, drift, pop, carry-over |
| `src/games/cafe/engine/phases.ts` | The boss structure: the four phases, their waves and the bill schedule |
| `src/games/cafe/engine/conditions.ts` | Named condition functions used by the data files (for example `saveIsZero`, `bottleFull`) |
| `src/games/cafe/engine/pick.ts` | `pickLine`, `pickCards`, `pickRegular`, `pickChit`, `pickCallbacks`, `pickArchetype` |
| `src/games/cafe/engine/evidence.ts` | The nine observed-behaviour checks and the four skill levels |
| `src/games/cafe/data/items.json` | Window items, trolley items, bills, surprise bank |
| `src/games/cafe/data/rules.json` | Line tables, card variants, callbacks, archetypes, regulars, chits |
| `src/games/cafe/screens/` | One component per screen in section 5 |
| `src/games/cafe/stage/` | Backdrop, characters, props, the fizz bottles, the rain finale |
| `src/locales/{en,hi,te}.json` | Every string, keyed (cafe.\*) |
| `src/games/cafe/analytics.ts` | The event log in section 14 |

### State (simplified)

```ts
type Phase = 'entry' | 'r0' | 'r1' | 'bill1' | 'r2' | 'bill2' | 'r3' | 'r3guess' | 'r3plates' | 'r3worth'
  | 'r4bignight' | 'r4teja' | 'bill3' | 'r5calm' | 'r5freeze' | 'r5crack' | 'r5table' | 'r5pay' | 'r5fine'
  | 'r6' | 'oneChange' | 'notebook';

type Source = 'spend' | 'save' | 'emergency' | 'quick';

interface Run {
  run: number; seed: number;
  goal: 'earphones' | 'trip' | 'controller';
  predict1?: 'none' | 'one' | 'two' | 'idk';
  predict2?: 0 | 1 | 2 | 3;
  predict3?: 150 | 175 | 200 | 250;
  jars: { spend: number; save: number; emergency: number };
  fizz: { fun: number; friends: number };          // internal only, never shown. Starts 25 and 35 (or carried over). No drift.
  refused: string[];                               // fizz items the player declined, newest first (feeds the Big Night text)
  bigNight?: { triggered: boolean; choice?: 'go' | 'half' | 'stay'; cost: 60 | 100 };
  bills: { id: 'auto' | 'data' | 'lunch'; amount: number; paidFrom: Partial<Record<Source, number>> }[];
  lent: number; gift: number;
  loan?: { borrowed: number; repay: number };
  window: { itemId: string; action: 'get' | 'cool' | 'pass'; result?: 'still' | 'dropped' | 'soldout' }[];
  trolley: { itemId: string; action: 'ok' | 'skip'; from?: Source }[];
  worth: Record<string, 'glad' | 'meh'>;
  surprise: { id: number; bill: number };
  paidFrom: Record<Source, number>;                // the rain
  ledgerOpened: number; fineOpened: boolean; borrowedWithoutReading: boolean;
  ledger: { day: number; text: string; note?: string }[];
}
```

### Data shapes

```json
// items.json (one window item)
{ "id": "w1", "vendor": "gamepack", "price": 50, "category": "fun",
  "kind": "fizz", "fizz": { "bottle": "fun", "pull": 30 },
  "soldOut": false, "hackathon": true,
  "keys": { "pitch": "cafe.w1.pitch", "get": "cafe.w1.get",
            "coolYes": "cafe.w1.coolYes", "coolNo": "cafe.w1.coolNo" } }

// a bill (a need): cannot be passed
{ "id": "auto", "day": 3, "amount": 20, "keys": { "title": "cafe.bill.auto", "line": "cafe.bill.auto.chacha" } }

// rules.json (first match wins)
{ "table": "payday_reaction",
  "rules": [ { "when": "saveIsZero", "key": "cafe.r1.saveZero" },
             { "when": "saveGte250", "key": "cafe.r1.saveFull" },
             { "when": "always",     "key": "cafe.r1.balanced" } ] }

// a money-manager archetype
{ "id": "shelffirst", "when": "paidShelfFirstAndKeptIt", "priority": 4,
  "keys": { "name": "cafe.arch.shelffirst.name", "line": "cafe.arch.shelffirst.line" } }

// a recap card variant
{ "card": "emergency", "variant": "covered", "when": "coveredByEmergency",
  "priority": 2, "keys": { "happened": "cafe.card.emergency.covered.a",
  "why": "cafe.card.emergency.covered.b", "try": "cafe.card.emergency.covered.c" } }
```

Placeholders such as `{S}`, `{x}` and `{r}` are filled from the run state when a string is rendered.

### Tests to write before any UI (they protect the learning)

1. Payday: Confirm is impossible until jars sum to ₹600.
2. Take-from-Save moves the goal by exactly the amount taken.
3. Lending is impossible from Save or Emergency.
4. Quick Cash: ₹50 gives ₹70, ₹100 gives ₹135, ₹150 gives ₹200. Quick Cash is never offered for a want.
5. Repayment order is Spend, then Emergency, then Save, and any remainder is shown as owed.
6. Endings match the table in section 3 at the boundaries (₹249, ₹250, ₹150, ₹149).
7. The phone cover reduces the Round 5 bill to ₹100 and only on the cracked-phone surprise.
8. Month 2 never repeats the surprise from Month 1.
9. Every `key` in the data files exists in `en.json`, `hi.json` and `te.json`.
10. No Chacha line is longer than 18 words in English.
11. **A bill can never be passed or cooled.** Each of the three bills must be paid from a source before the phase continues.
12. **All-in-Save is not a free win.** With ₹600 in Save and nothing in Spend, Bill N1 forces the source question and the goal moves back by ₹20.
13. **Fizz arithmetic and margin.** Declining the ₹50 Game pack (pull 40) raises FUN by 40 and buying it lowers FUN by 60, never below 0; a FUN trolley item has pull 15 (decline +15, buy −22). There is no phase drift. In the hackathon build, refusing every FUN item takes the bottle from 25 to **110** (a margin of at least 10 over the pop), and buying the Game pack alone, or any single FUN trolley item, keeps it below 100. The margin is asserted so a later tuning change cannot silently stop the Big Night from firing.
14. **Big Night rules.** It triggers only when a bottle is at 100 or more, at most once per bottle per month, and its text names items the player actually refused; "Stay in" leaves the bottle at 100, carries it into Month 2, and Month 2's Big Night costs ₹100 on Day 1.
15. **No dominant strategy.** Replay the five reference playstyles in section 3 through the engine. A, C and D must reach "Goal reached"; B and E must not. Style C (spends nothing on wants) must end with the FUN bottle at 100 and a Big Night carry-over, so refusing everything is visibly different from spending thoughtfully.
16. **No timers hide in the engine.** Offers never expire without an input; Pause freezes saucers, the cloud and the trolley queue.
17. **Archetype picker is deterministic** and returns exactly one archetype for every run in the reference set.
18. **The fizz is never shown as a number.** No screen, string or accessibility label may contain a fizz value; only the five stage words appear. (The dashboard may aggregate internal values.)

### Build order

Times assume about 5 hours of build. Each step ends with something you can see and test.

| Step | Time | What | Done when |
| --- | --- | --- | --- |
| 1 | 0:00 to 0:45 | Engine, state, economy (source rule, bills, fizz, Big Night), tests 1 to 8 and 11 to 17. Greybox stage: boxes for table, shelf, door, window, counter. HUD with Month bar and two bottles. | You can move coins between jars and pay a bill in a plain page, and the numbers match the reference playstyles |
| 2 | 0:45 to 1:30 | Rounds 0 and 1: intro, goal pick, Predict 1, allocator with drag and plus and minus, Chacha caption bar | Payday works end to end with the reaction lines |
| 3 | 1:30 to 2:30 | Phases 1 and 2: Bill N1, the 4 window waves with saucers, Bill N2, the 6 item trolley, Predict 2, plates reveal, Worth it | A full run reaches the end of Phase 2 with the right numbers and the bottles moving |
| 4 | 2:30 to 3:30 | Phases 3 and 4: Big Night, Teja, Bill N3, **the rain finale in four beats**, pay panel, Quick Cash and fine print | A full run reaches the end of Round 5 with every source working. Spend the extra time here. |
| 5 | 3:30 to 4:15 | Round 6: settle, headline, six-number report, margin notes, money-manager reading, three recap cards, chit | The Tally shows correct, personal numbers for the five reference playstyles |
| 6 | 4:15 to 4:45 | Replay: one-change chips, Month 2 variation (carry-over fizz), Then and Now, evidence checks | Two runs in a row produce a Then and Now screen |
| 7 | 4:45 to 5:30 | Swap in the painted backdrop and characters, Hindi and Telugu strings, phone portrait layout, analytics events, QA pass | Plays on a phone in all three languages |

### Cut list (cut from the top first)

1. Month 5 teach-back and the difficulty ladder
2. The wall of Regulars
3. The Notebook screen (keep saving cards, drop the screen)
4. Then and Now (keep the replay)
5. Chacha's callbacks (keep margin notes)
6. The FRIENDS bottle and the group gift (keep FUN only)
7. Sound
8. Rush hour mode

**Never cut:** the three bills, the source question, the FUN bottle and Big Night, the rain finale beats, and Quick Cash with its fine print. Those are what make this a game and not a quiz.

## 18. Open decisions, change log and what to test

**Seven decisions need a human, and seven things should be tested with real students before the pitch.** Everything else in this document is ready to build.

### Change log: v1 to v2

| # | Problem in v1 | What v2 does | Where |
| --- | --- | --- | --- |
| 1 | No boss identity: a scenario simulator in a café | The month is the boss: loadout, four named phases with signature moves, escalation, a finale, a knockout stamp, a scorecard | Sections 1, 5, 8 to 12, 15 |
| 2 | Rounds were "person appears, you choose, consequence" | Patterns (single, pair, pressure), a queue at the pay line, two pulls at once in Phase 3, a four beat finale | Sections 8 to 11 |
| 3 | "Never spend" was the best strategy | Three bills cannot be passed; the source question; the Vault run shows why jars exist; refusing wants builds the fizz | Section 3 |
| 4 | Wants either did nothing or were not modelled | Three behaviours: ignorable wants, fizz wants (pressure), needs. Wants never become needs. | Section 3 |
| 5 | Ignoring wants had no visible cost | Goli soda fizz bottles; Big Night; staying in carries a bigger Big Night into next month | Sections 3, 10, 13 |
| 6 | "No timer" but vendors left after 8 seconds | Offers wait for the player; animation is decoration; Pause freezes everything; Rush hour is optional and costs nothing | Sections 3, 5, 8, 9, 16 |
| 7 | Chacha's interest-free Book made borrowing look free | Removed. Borrowing always has a price. Chacha's lending rule now lives in Teja's scene. | Sections 3, 4, 11 |
| 8 | Evidence checks read like mastery scores | Renamed "observed behaviour", with two signals per check and the honest caveat that behaviour is not mastery | Sections 13, 14 |
| 9 | ₹600 described as realistic | Described as a fictional game economy | Sections 1, 3 |
| 10 | Too much content to build | A hackathon scope: 4 window items, 6 trolley items, one spectacular finale, one replay | Section 17 |
| 11 | The FUN bottle reached the pop with a margin of exactly 0 and relied on arbitrary phase drift (found in review) | Drift removed. Pulls raised (Game pack 40, trolley items 15) and FUN starts at 25: refusing every FUN item now reaches 110. A test protects the margin. | Sections 3, 8, 9, 17 |
| 12 | The fizz could become another bar to optimise | The player never sees a number, only five visual stages; nothing rewards a low bottle; the Tally never scores it | Section 3 |
| 13 | Big Night felt like "meter full, next screen" | It is built from the specific items the player refused, which appear as ghosts and are read back by Chacha | Sections 3, 10 |
| 14 | A reference table row said the Cushion-light run went to a Big Night, but that run never triggers one | Corrected; the table was re-run through the engine rules | Section 3 |

### Decisions for the team

| # | Decision | My recommendation |
| --- | --- | --- |
| 1 | Title: Pocket Panic, Café Meherban, or Chacha's Ledger | Keep "Pocket Panic" as the pillar name, with the café as the setting |
| 2 | Money numbers (₹600 income, ₹250 goal, ₹80 of bills) | Keep. Check them against the brief and what the NGO's students actually handle. They are labelled fictional. |
| 3 | The fizz mechanic: is a bottle of pressure a good way to show wants that build up? | Keep, but playtest. If students read it as "you must buy things", lower the pull values and drop the carry-over. |
| 4 | The medical surprise (bank item 5) | Keep out of Month 1. Test it first. |
| 5 | Goal items (earphones, trip, controller) | Replace any that do not fit your students; keep the price the same |
| 6 | Café name "Meherban" | Check for clashes with real cafés; rename if needed |
| 7 | Who reviews Hindi and Telugu | A native speaker for each language, before any public demo |

Audio is off by default; add the five effects only if time allows. The nine concepts come from your source brief as you summarised it. I have not read the original, so check the wording against it.

### Known limits

- A student can discover a good split (roughly 40 percent to the gullak, a sixth by the door, the rest in the tumbler) in one run. The month variations, the carry-over fizz and the Tighter month are there so the player has to reason again, not copy a formula.
- The Vault playstyle can still reach the goal. That is deliberate: it is allowed, and it is shown honestly (the bottle pops, nothing is spent on wants, a bigger Big Night waits next month).
- Because bottle values are hidden, a very careful player could still try to guess the fizz. It is a consequence system, not a score, and staying in is free, so the cost of "optimising" it is one extra yes.
- Behaviour in the game is evidence, not proof. A student who never uses the saucer may simply not want the items.
- The dashboard shows sample data until real play exists.
- Translations are drafts.

### Test with 5 to 10 students before the pitch

| Question | How to tell |
| --- | --- |
| Do they read Chacha's lines or tap through? | Watch whether the caption bar is skipped. If so, shorten lines. |
| Do they understand "let it cool"? | Do they use the saucer without being told? |
| Is the fizz understood? | Ask: "What was the bottle telling you?" Do they say "I kept saying no" rather than "I had to buy"? |
| Does the rain finale land? | Watch the table-speaks beat. Do they react ("oh, I did that")? Do they skip it? |
| Do they open the fine print before borrowing? | `fineprint.opened` in the event log |
| Does the Tally feel long? | Time from Step A to the close. Target under 90 seconds. |
| Do they feel judged? | Ask three questions after: "Did the game say you did something wrong?" "Did anything make you feel bad?" "What would you tell a friend about it?" |
| Do they replay without being asked? | `run_end` count |
| Is the trolley boring at 6 items? | Drop-off in Round 3; extend to 8 if it feels thin |

### Pilot targets (suggested starting points, not benchmarks)

- At least 70 percent finish Run 1.
- At least 40 percent start Run 2.
- Among those who replay, at least two of the nine checks flip to yes on average.
- Fewer than 1 in 20 say they felt judged.
- Fewer than 1 in 10 describe the fizz as "the game wants me to buy things".
