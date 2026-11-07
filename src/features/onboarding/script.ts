
export type StepKind = 'welcome' | 'problem' | 'persona' | 'festival' | 'avatar' | 'skills' | 'win' | 'happy' | 'controls'

export interface StepDef {
  id: string
  kind: StepKind
  /** Main copy key */
  copyKey: string
  /** Sub-copy key, if any */
  subKey?: string
  /** If this step requires a choice, what kind of choice it is */
  choice?: 'persona' | 'festival' | 'avatar'
}

/**
 * The onboarding script as an ordered list of steps. The UI determines how to display them.
 */
export const ONBOARDING_SCRIPT: StepDef[] = [
  { id: 'welcome', kind: 'welcome', copyKey: 'onboarding.welcome.title', subKey: 'onboarding.welcome.body' },
  { id: 'problem', kind: 'problem', copyKey: 'onboarding.problem.title', subKey: 'onboarding.problem.body' },
  { id: 'persona', kind: 'persona', copyKey: 'onboarding.persona.title', subKey: 'onboarding.persona.body', choice: 'persona' },
  { id: 'festival', kind: 'festival', copyKey: 'onboarding.festival.title', subKey: 'onboarding.festival.body', choice: 'festival' },
  { id: 'avatar', kind: 'avatar', copyKey: 'onboarding.avatar.title', subKey: 'onboarding.avatar.body', choice: 'avatar' },
  { id: 'skills', kind: 'skills', copyKey: 'onboarding.skills.title', subKey: 'onboarding.skills.body' },
  { id: 'win', kind: 'win', copyKey: 'onboarding.win.title', subKey: 'onboarding.win.body' },
  { id: 'happy', kind: 'happy', copyKey: 'onboarding.happy.title', subKey: 'onboarding.happy.body' },
  { id: 'controls', kind: 'controls', copyKey: 'onboarding.controls.title', subKey: 'onboarding.controls.body' },
]

/**
 * Text that explains controls, editable here because final controls are not yet decided.
 */
export const CONTROLS_TEXT_KEY = 'onboarding.controls.text'
