import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useOnboarding } from '../../features/onboarding/hooks'
import { useGame } from '../../store/game'
import { LANGS, PERSONAS, FESTIVALS, type Lang, type PersonaId, type Avatar } from '../../content/data'

/**
 * Plain wireframe onboarding. 
 * TODO(final-ui): wireframe, replaced by real design.
 */
export function OnboardingScreen() {
  const { t } = useTranslation()
  const {
    stepIndex, totalSteps, currentStep, next, back, skip, canNext, choices
  } = useOnboarding()
  const storySeen = useGame((s) => s.storySeen)
  const setLanguage = useGame((s) => s.setLanguage)
  const currentLang = useGame((s) => s.language)

  // If already done onboarding, navigating here will just redirect to / or /hub later (home for now)
  if (storySeen) {
    return <Navigate to="/" replace />
  }

  return (
    <div data-testid="onboarding-screen" className="absolute inset-0 overflow-y-auto bg-jasmine text-ink p-4">
      <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16 }}>
          <span data-testid="onboarding-step-counter">
            {stepIndex + 1} / {totalSteps}
          </span>
          <button type="button" onClick={skip} className="ink-btn cream" data-testid="onboarding-skip">
            {t('onboarding.skip', { defaultValue: 'Skip' })}
          </button>
        </header>

        <main style={{ flex: 1, display: 'grid', gap: 16, alignContent: 'center' }}>
          <h1 data-testid={`onboarding-title-${currentStep.kind}`}>{t(currentStep.copyKey)}</h1>
          {currentStep.subKey && <p>{t(currentStep.subKey)}</p>}

          {currentStep.kind === 'welcome' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {(LANGS as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`ink-btn ${currentLang === l ? 'pink' : 'cream'}`}
                  data-testid={`onboarding-lang-${l}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {currentStep.choice === 'persona' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {Object.keys(PERSONAS).map((pKey) => {
                const pid = pKey as PersonaId
                return (
                  <label key={pid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '2px solid var(--color-ink)', borderRadius: 8 }}>
                    <input type="radio" name="persona" checked={choices.persona === pid} onChange={() => choices.setPersona(pid)} data-testid={`onboarding-persona-${pid}`} />
                    <span>{t(`personas.${pid}.name`)} - {t(`personas.${pid}.desc`, { defaultValue: 'Change this' })}</span>
                  </label>
                )
              })}
            </div>
          )}

          {currentStep.choice === 'festival' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {FESTIVALS.map((f) => (
                <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '2px solid var(--color-ink)', borderRadius: 8 }}>
                  <input type="radio" name="festival" checked={choices.festival === f} onChange={() => choices.setFestival(f)} data-testid={`onboarding-festival-${f}`} />
                  <span>{t(`festivals.${f}`, { defaultValue: f })}</span>
                </label>
              ))}
            </div>
          )}

          {currentStep.choice === 'avatar' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {['male', 'female'].map((a) => {
                const av = a as Avatar
                return (
                  <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '2px solid var(--color-ink)', borderRadius: 8 }}>
                    <input type="radio" name="avatar" checked={choices.avatar === av} onChange={() => choices.setAvatar(av)} data-testid={`onboarding-avatar-${a}`} />
                    <span>{t(`avatars.${a}`, { defaultValue: a })}</span>
                  </label>
                )
              })}
            </div>
          )}
        </main>

        <footer style={{ display: 'flex', gap: 12, paddingTop: 16 }}>
          <button type="button" onClick={back} disabled={stepIndex === 0} className="ink-btn cream" style={{ flex: 1 }} data-testid="onboarding-back">
            {t('onboarding.back', { defaultValue: 'Back' })}
          </button>
          <button type="button" onClick={next} disabled={!canNext} className="ink-btn pink" style={{ flex: 2 }} data-testid="onboarding-next">
            {t('onboarding.next', { defaultValue: 'Next' })}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default OnboardingScreen
