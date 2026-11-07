import { useState } from 'react'
import { useGame } from '../../store/game'
import { ONBOARDING_SCRIPT } from './script'

export function useOnboarding() {
  const [stepIndex, setStepIndex] = useState(0)
  const currentStep = ONBOARDING_SCRIPT[stepIndex]

  const persona = useGame((s) => s.persona)
  const festival = useGame((s) => s.festival)
  const avatar = useGame((s) => s.avatar)

  const setPersona = useGame((s) => s.setPersona)
  const setFestival = useGame((s) => s.setFestival)
  const setAvatar = useGame((s) => s.setAvatar)
  const setStorySeen = useGame((s) => s.setStorySeen)

  let canNext = true
  if (currentStep.choice === 'persona' && !persona) canNext = false
  if (currentStep.choice === 'festival' && !festival) canNext = false
  if (currentStep.choice === 'avatar' && !avatar) canNext = false

  const next = () => {
    if (!canNext) return
    if (stepIndex < ONBOARDING_SCRIPT.length - 1) {
      setStepIndex(stepIndex + 1)
    } else {
      setStorySeen(true)
    }
  }

  const back = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1)
  }

  const skip = () => {
    // Need a persona if we skip? Defaulting to school if not set, 
    // but typically skipping just marks it seen. Let's make sure it's valid.
    if (!persona) setPersona('school')
    setStorySeen(true)
  }

  return {
    stepIndex,
    totalSteps: ONBOARDING_SCRIPT.length,
    currentStep,
    progressPercent: Math.round((stepIndex / (ONBOARDING_SCRIPT.length - 1)) * 100),
    next,
    back,
    skip,
    canNext,
    choices: {
      persona,
      setPersona,
      festival,
      setFestival,
      avatar,
      setAvatar,
    },
  }
}
