import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * The route table for every screen built on the headless layers (src/host, src/features). App.tsx reads this and nothing else
 * for these routes, so a new UI replaces the wireframes by pointing these entries at its own components (or by editing
 * src/ui/wire/*). The legacy screens (/, /story, /dashboard, /kit) are still registered directly in App.tsx.
 */
export interface ScreenRoute {
  path: string
  Component: LazyExoticComponent<ComponentType>
}

export const SCREENS: ScreenRoute[] = [
  // the page a pillar game runs inside: entry, the game, then the result
  { path: '/play/:pillar', Component: lazy(() => import('./wire/GameHostScreen')) },
  // how am I doing: goal meter, a card per pillar, the Happy Index and its explanation
  { path: '/progress', Component: lazy(() => import('./wire/ProgressScreen')) },
  // the facilitator desk for NGOs and teachers (reads only progress that students share)
  { path: '/ngo', Component: lazy(() => import('../ngo/NgoScreen')) },
  // developer index of every wireframe (only reachable with ?dev=1)
  { path: '/wire', Component: lazy(() => import('./wire/WireIndex')) },
  // onboarding flow
  { path: '/welcome', Component: lazy(() => import('./wire/OnboardingScreen')) },
  // hub screen
  { path: '/hub', Component: lazy(() => import('./wire/HubScreen')) },
]
