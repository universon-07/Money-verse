// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Pillar4 from './Pillar4'
import CaseRunner from './ui/CaseRunner'
import { HostProvider } from './host'
import { CASES, EN } from './content'
import { usePillar4 } from './store'

const host = { language: 'en' as const, setLanguage: vi.fn(), onExit: vi.fn(), onComplete: vi.fn() }
afterEach(cleanup)

it('opens the kiosk, enters the tutorial, and renders its phone', () => {
  usePillar4.setState({ profile: { ...usePillar4.getState().profile, introSeen: false }, progress: {}, completed: [] })
  render(createElement(Pillar4, host))
  expect(screen.getByText(EN['ui.story.b1'])).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: EN['ui.story.skip'] }))
  fireEvent.click(screen.getByRole('button', { name: EN['ui.intro.start'] }))
  fireEvent.click(document.querySelector('button[data-case="TUT"]')!)
  expect(screen.getAllByText(EN['TUT.brief'])[0]).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: EN['ui.case.openPhone'] }))
  expect(screen.getByText(EN['ui.app.messages'])).toBeTruthy()
})

it.each(Object.keys(CASES))('renders the %s briefing with usable English content', (id) => {
  usePillar4.getState().resetCase(id)
  usePillar4.getState().beginCase(id)
  render(createElement(HostProvider, { value: host }, createElement(CaseRunner, { caseId: id, onExit: vi.fn() })))
  expect(screen.getAllByText(EN[`${id}.brief`])[0]).toBeTruthy()
  expect(screen.getByRole('button', { name: EN['ui.case.openPhone'] })).toBeTruthy()
})
