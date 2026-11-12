# Money-verse

Our interactive financial-literacy project, built to help students understand money through play.

**[Explore the repository](https://github.com/universon-07/Money-verse)** · [Demo video](#demo) · [Design system](DESIGN.md)

<!-- HERO IMAGE SLOT
     Add your main island / home-screen screenshot as docs/screenshots/home.jpg
     Then replace this comment with:
     ![Money-verse: the illustrated learning world](docs/screenshots/home.jpg)
-->

Money-verse is a financial-literacy experience for students. Players enter an illustrated world, explore themed locations and play interactive experiences built around four everyday money skills: **planning, saving, investing and staying financially safe**.

The idea is simple: instead of only reading what a budget or a scam is, players make decisions, see the consequences and learn through the experience. The project also considers the player's happiness and balance, not just the amount of money they accumulate.

All in-game amounts, people, businesses and scenarios are fictional and are used for educational practice. Money-verse is not personal financial advice.

## Demo

<!-- Replace this section with a YouTube link or a GitHub-hosted MP4 when the demo is ready. -->
*Demo video coming soon.*

<!-- SCREENSHOT GALLERY
     Upload your own screenshots into docs/screenshots/.
     Keep the filenames below, or update the paths to match your uploaded images.
-->

| The opening story | The Money-verse world |
| --- | --- |
| <!-- ![Opening story](docs/screenshots/story.jpg) --> **Screenshot slot** | <!-- ![Island map](docs/screenshots/home.jpg) --> **Screenshot slot** |

| Bangle Bazaar — Plan & Budget | Café Meherban — Save & Manage |
| --- | --- |
| <!-- ![Festival budgeting game](docs/screenshots/play-budget.jpg) --> **Screenshot slot** | <!-- ![Café Meherban game](docs/screenshots/play-save.jpg) --> **Screenshot slot** |

| The Pearl Exchange — Investing | Helpline Kiosk — Financial Safety |
| --- | --- |
| <!-- ![Investing game](docs/screenshots/play-invest.jpg) --> **Screenshot slot** | <!-- ![Case Files game](docs/screenshots/play-safe.jpg) --> **Screenshot slot** |

| Teacher portal | Mobile experience |
| --- | --- |
| <!-- ![Teacher portal](docs/screenshots/teacher-dashboard.jpg) --> **Screenshot slot** | <!-- ![Mobile home screen](docs/screenshots/phone-home.jpg) --> **Screenshot slot** |

## The four places

| Place | Lesson | Experience |
| --- | --- | --- |
| **Bangle Bazaar** | Plan & Budget | **Festival Showdown:** take the role of a festival treasurer, plan a budget and make choices as costs and available money change |
| **Café Meherban** | Save & Manage | **Pocket Panic:** navigate a month of spending decisions, recurring needs, unexpected costs and requests from friends |
| **The Pearl Exchange** | Understand Investing | **Deal Board:** explore fictional investment opportunities, compare information and make decisions using judgement rather than luck |
| **Helpline Kiosk** | Stay Financially Safe | **Case Files:** investigate suspicious situations, inspect clues and learn to recognise common financial scams |

Each place focuses on a different skill while contributing to the player's overall learning journey. The four experiences are connected through the shared world and progress system.

## How money and happiness work

Money-verse is not designed around saving the largest possible amount at any cost. It encourages players to make thoughtful choices while keeping a balance between progress and personal well-being.

- **Money / goal progress:** each of the four learning pillars contributes to the overall goal. A fully bright result contributes its full share; dim and flickering results contribute a smaller share.
- **Happiness:** the Happy Index starts at 70 and is tracked on a 10–100 scale. Game sessions can reduce it, while balanced choices and life moments can help restore it.
- **Lamp brightness:** a pillar's lamp reflects the player's Happy level when the experience is completed. A bright, dim or flickering lamp changes how much that pillar contributes to goal progress.
- **Replay:** players can revisit a pillar and improve its result; a replay is designed to improve rather than downgrade the recorded pillar result.
- **Progress summary:** after completing the learning journey, the dashboard brings the pillar states and progress together and offers a shareable summary card.

The values and rules are configurable in the source: see `src/progress/config.ts` and `src/happy/config.ts`.

## Run it yourself

Requirements: Node.js 20.19 or newer with npm, and a modern browser.

```bash
git clone https://github.com/universon-07/Money-verse.git
cd Money-verse
npm install
npm run dev
```

Vite prints a local address, usually `http://localhost:5173`.

```bash
npm run build      # content validation, type-check and production build
npm run preview    # serve the production build locally
```

The production build is generated in `dist/`. Money-verse is a Vite-powered web application and can be deployed to a static hosting provider. Configure your host to serve the app's entry point for client-side routes.

## Optional: Teacher portal

The teacher portal is available at `/teacher`. Teachers can sign in, create classes, receive student progress summaries and review class reports. Students can play without creating an account and share progress using a class code.

To configure the optional Supabase backend:

1. Create a Supabase project.
2. For a fresh database, run [supabase/schema.sql](supabase/schema.sql). If the database already exists, follow the migration instructions in [docs/TEACHER_BACKEND.md](docs/TEACHER_BACKEND.md) instead.
3. Add the following values to an uncommitted `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

4. Configure the allowed authentication redirect URLs in Supabase for your local and deployed teacher portal.
5. Restart the development server and verify teacher login, class creation and student progress submission.

See [docs/TEACHER_BACKEND.md](docs/TEACHER_BACKEND.md) for the full backend contract and setup notes.

Students do not need an account to play. The teacher backend receives a class code, student code, roll number and progress summary; student names remain in the teacher's browser. Review the privacy and access-control requirements before using the portal with a real class.

## Useful URLs and developer switches

| Route / switch | What it does |
| --- | --- |
| `/` | Main illustrated world / island |
| `/story` | Opening story |
| `/teacher` | Teacher portal |
| `/play/safe` | Stay Financially Safe — Case Files |
| `?dev=1` | Enables developer mode and controlled placeholder game results |
| `?dev=1&real=1` | Uses the real game modules while developer mode is enabled |

## Tests

```bash
npm test               # unit and integration tests
npm run lint           # lint the codebase
npm run p4:validate    # validate Case Files content
npm run p4:test        # run Case Files engine and audit tests
npm run check:tokens   # check design tokens
npm run build          # validate, type-check and build
```

Additional browser-based test scripts are available under `tools/` and in the relevant game modules.

## Where things are

| Folder | What lives there |
| --- | --- |
| `src/games/showdown/` | Bangle Bazaar — Festival Showdown budgeting experience |
| `src/games/cafe/` | Café Meherban — Pocket Panic saving and money-management experience |
| `src/games/dealboard/` | The Pearl Exchange — Deal Board investing experience |
| `src/pillar4/` | Helpline Kiosk — Case Files financial-safety experience |
| `src/host/` | Shared game host, adapters, game loading and result flow |
| `src/island/` | The explorable island world |
| `src/home/`, `src/screens/` | Home, story, landing and progress screens |
| `src/progress/` | Goal progress, saved progress and pillar result rules |
| `src/happy/` | Happy Index, life moments and well-being signals |
| `src/teacher/` | Teacher portal and classroom tools |
| `src/components/`, `src/ui/` | Shared interface components and UI |
| `src/locales/` | Application language strings |
| `src/art/`, `public/art/` | Art loading, illustrations and visual assets |
| `supabase/` | Database schema and migrations for the optional teacher backend |
| `docs/` | Project, design, integration and backend documentation |
| `tools/` | Validation, art import and development utilities |

## Built with

- **Frontend:** React 19, TypeScript and Vite
- **Routing:** React Router
- **Styling:** Tailwind CSS 4 and custom CSS
- **Animation:** Framer Motion
- **State management:** Zustand
- **Internationalisation framework:** i18next and react-i18next
- **Backend (teacher portal):** Supabase Auth, database and realtime features
- **Testing:** Vitest, Testing Library and Playwright
- **Pathfinding:** EasyStar.js

The visual direction uses hand-inked outlines, warm saturated colours, illustrated environments and deliberately stepped animation. The design rules and palette are documented in [DESIGN.md](DESIGN.md).

## Team

Built by **[add your team name]**.

- [Team member 1](https://github.com/username)
- [Team member 2](https://github.com/username)
- [Team member 3](https://github.com/username)
- [Team member 4](https://github.com/username)

<!-- Replace the placeholders with the actual team name and member profiles before publishing. -->

## Credits

Money-verse uses open-source libraries and tools under their respective licences. See [package.json](package.json) and the upstream projects for dependency details.

## License

See [LICENSE](LICENSE) for the project's licence.
