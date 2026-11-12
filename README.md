# Money-verse

An interactive financial-literacy game that turns everyday money decisions into a world players can explore, experiment with and learn from.

**[Play Money-verse](https://money-verse-nu.vercel.app/)** · [Demo video](#demo) · [Project design](DESIGN.md)

<!--
  HERO IMAGE SLOT
  Add your main gameplay / island screenshot at: docs/screenshots/home.jpg
  Then uncomment the line below:
  ![Money-verse — the island world](docs/screenshots/home.jpg)
-->

Money-verse is built around a simple idea: **learning about money should feel like making decisions, not reading a textbook.** Players explore an illustrated world, visit themed locations and play short games that introduce budgeting, saving, investing and financial safety. Choices have visible consequences, and progress is carried across the experience.

The project is designed primarily for students and young people. It uses fictional in-game situations and amounts for practice; it is an educational game, not personal financial advice.

## Demo

Play the current build in your browser: **[money-verse-nu.vercel.app](https://money-verse-nu.vercel.app/)**

<!-- DEMO VIDEO SLOT
     Upload a demo video to YouTube / GitHub, then replace this note with an embed:
     [![Watch the Money-verse demo](docs/screenshots/demo-thumbnail.jpg)](YOUR_VIDEO_URL)
-->

*Demo video coming soon.*

<!-- SCREENSHOT GALLERY
     Add screenshots to docs/screenshots/ and uncomment / update the image paths below.
     Suggested shots: opening story, island map, each learning game, teacher dashboard, mobile view.
-->

| The opening story | The Money-verse world |
| --- | --- |
| <!-- ![Opening story](docs/screenshots/story.jpg) --> **Screenshot coming soon** | <!-- ![Island map](docs/screenshots/home.jpg) --> **Screenshot coming soon** |

| Budgeting & planning | Saving & managing |
| --- | --- |
| <!-- ![Budgeting game](docs/screenshots/play-budget.jpg) --> **Screenshot coming soon** | <!-- ![Saving game](docs/screenshots/play-save.jpg) --> **Screenshot coming soon** |

| Understanding investing | Staying financially safe |
| --- | --- |
| <!-- ![Investing game](docs/screenshots/play-invest.jpg) --> **Screenshot coming soon** | <!-- ![Financial safety game](docs/screenshots/play-safe.jpg) --> **Screenshot coming soon** |

| Teacher dashboard | Mobile experience |
| --- | --- |
| <!-- ![Teacher dashboard](docs/screenshots/teacher-dashboard.jpg) --> **Screenshot coming soon** | <!-- ![Mobile gameplay](docs/screenshots/phone-home.jpg) --> **Screenshot coming soon** |

## The learning world

Money-verse brings four core money skills into four themed experiences:

| Experience | What it teaches | What players do |
| --- | --- | --- |
| **Bangle Bazaar** | Plan & budget | Take the role of a festival treasurer, plan a budget and make choices as costs and available money change |
| **Café Meherban** | Save & manage | Make it through a month of spending decisions, recurring needs, unexpected costs and social requests |
| **The Pearl Exchange** | Understand investing | Explore fictional investment opportunities, compare information and make decisions based on judgement rather than luck |
| **Helpline Kiosk — Case Files** | Stay financially safe | Investigate suspicious situations, inspect clues and identify common financial scams |

Completing the four learning experiences contributes to the player's overall progress and goal. Each experience is designed to make a concept tangible through interaction, feedback and reflection.

## How the experience works

- **Explore:** Move around the illustrated island and discover its learning locations.
- **Play:** Each location contains a focused mini-game built around a real-world money skill.
- **Make decisions:** Choices affect the in-game outcome, so players can see trade-offs instead of memorising rules.
- **Track progress:** The game records progress locally and brings the learning journey together in a summary.
- **Replay and improve:** Players can revisit experiences and try different decisions.
- **Share progress with a class:** Students can use a class code to share a progress summary with a teacher. Students do not need to create an account to play.

All money values and scenarios inside the student game are fictional and intended for learning.

## Run it locally

### Requirements

- Node.js 20.19 or newer
- npm
- A modern desktop or mobile browser

### Installation

```bash
git clone https://github.com/universon-07/Money-verse.git
cd Money-verse
npm install
npm run dev
```

Vite prints a local development URL, usually `http://localhost:5173`.

### Production build

```bash
npm run build
npm run preview
```

The production build is generated in `dist/`. Money-verse is a Vite-powered web application and can be deployed to a static hosting provider such as Vercel.

## Teacher dashboard (optional backend)

The student experience works without a student account. The optional teacher portal is available at `/teacher` and uses Supabase for teacher authentication, class management and receiving student progress summaries.

To enable the teacher backend:

1. Create a Supabase project.
2. Configure the database using [supabase/schema.sql](supabase/schema.sql) for a fresh installation. For an existing deployment, follow the migration instructions in [docs/TEACHER_BACKEND.md](docs/TEACHER_BACKEND.md) instead of rerunning the fresh-install schema.
3. Copy the required values from `.env.example` into an uncommitted `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

4. Configure the allowed authentication redirect URLs in Supabase for your local and deployed teacher portal.
5. Restart the development server.

See [docs/TEACHER_BACKEND.md](docs/TEACHER_BACKEND.md) for the backend contract, setup details and verification steps.

**Privacy model:** Students can play without signing in. The teacher backend receives a class code, student code, roll number and progress summary; student names remain in the teacher's browser. Review the backend documentation and your deployment's access controls before using it with a real class.

## Useful routes

| Route | Purpose |
| --- | --- |
| `/` | Main island / learning world |
| `/story` | Opening story |
| `/teacher` | Optional teacher portal |
| `/play/safe` | Stay Financially Safe — Case Files experience |

## Tests and project checks

Run the available checks with:

```bash
npm test
npm run lint
npm run p4:validate
npm run p4:test
npm run check:tokens
```

For the production build:

```bash
npm run build
```

The build runs the Case Files content validator before TypeScript and Vite production compilation. Additional browser-based checks and instructions are documented alongside the relevant tools and game modules.

## Project structure

| Path | What it contains |
| --- | --- |
| `src/games/showdown/` | Bangle Bazaar — planning and budgeting game |
| `src/games/cafe/` | Café Meherban — saving and money-management game |
| `src/games/dealboard/` | The Pearl Exchange — investing game |
| `src/pillar4/` | Helpline Kiosk — Case Files financial-safety experience |
| `src/island/` | The explorable island world |
| `src/screens/` | Main screens, story and progress summary |
| `src/components/`, `src/ui/` | Shared interface components and HUD |
| `src/progress/`, `src/happy/` | Player progress and happiness systems |
| `src/teacher/` | Teacher portal and classroom tools |
| `src/locales/` | Application language strings |
| `src/art/`, `public/art/` | Art loading, assets and illustrations |
| `supabase/` | Database schema and migrations for the optional teacher backend |
| `docs/` | Design notes, integration details and project documentation |
| `tools/` | Validation, import and development utilities |

## Built with

- **Frontend:** React 19, TypeScript, Vite
- **Routing:** React Router
- **Styling:** Tailwind CSS 4 and custom CSS
- **Animation:** Framer Motion
- **State management:** Zustand
- **Internationalisation framework:** i18next and react-i18next
- **Backend (optional):** Supabase Auth, database and realtime features for the teacher portal
- **Testing:** Vitest, Testing Library and Playwright

The visual direction combines hand-inked outlines, warm saturated colours, illustrated environments and deliberately stepped animation. See [DESIGN.md](DESIGN.md) for the design system and visual rules.

## Team

Built by **[add your team name]**.

- [Team member 1](https://github.com/username)
- [Team member 2](https://github.com/username)
- [Team member 3](https://github.com/username)
- [Team member 4](https://github.com/username)

<!-- Replace the placeholders above with the final team name and GitHub profiles. -->

## Credits

Money-verse is built with open-source libraries and tools. Each dependency is used under its respective licence; see [package.json](package.json) and the relevant upstream projects for details.

## License

This project is licensed under the terms in [LICENSE](LICENSE).
