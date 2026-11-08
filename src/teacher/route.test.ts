// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import App from '../App'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('opens the teacher desk without starting a student game', async () => {
  sessionStorage.clear()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })))
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })))
  render(createElement(MemoryRouter, { initialEntries: ['/teacher'] }, createElement(App)))
  expect((await screen.findAllByText('MONEY VERSE Insights')).length).toBeGreaterThan(0)
  expect(screen.queryByRole('button', { name: /start your story/i })).toBeNull()
})
