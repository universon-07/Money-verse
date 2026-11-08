import { createElement } from 'react'
// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Auth } from './Auth'

const signUp = vi.hoisted(() => vi.fn(async () => ({ needsConfirm: true })))
vi.mock('./cloud', () => ({ cloud: { signUp }, cloudEnabled: true }))
afterEach(() => { cleanup(); signUp.mockClear() })

it('registers a teacher using email and password only', async () => {
  render(createElement(Auth, { onBack: () => {}, onDemo: () => {} }))
  fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
  expect(screen.getByRole('heading', { name: 'Create a teacher account' })).toBeTruthy()
  expect(screen.getAllByRole('textbox')).toHaveLength(1)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'teacher@example.com' } })
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'test-password-123' } })
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
  await waitFor(() => expect(signUp).toHaveBeenCalledWith('teacher@example.com', 'test-password-123'))
  expect(signUp.mock.calls[0]).toHaveLength(2)
})
