// @vitest-environment jsdom
import { createElement } from 'react'
import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import './lib/fastBoot'
import './i18n'
import App from './App'

it('renders the new-game home screen without missing-export failures', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({}) })))
  render(createElement(BrowserRouter, null, createElement(App)))
  expect(await screen.findByRole('button', { name: /begin|start|new game/i })).toBeTruthy()
  vi.unstubAllGlobals()
})
