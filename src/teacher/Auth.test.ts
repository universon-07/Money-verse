// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Auth } from './Auth'

const { signUp, signIn } = vi.hoisted(() => ({
  signUp: vi.fn(async () => ({ needsConfirm: true })),
  signIn: vi.fn(async () => {}),
}))
vi.mock('./cloud', () => ({ cloud: { signUp, signIn }, cloudEnabled: true }))
afterEach(() => { cleanup(); vi.clearAllMocks() })

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

it.each(['login', 'signup'])('reveals and hides the %s password without changing it or submitting', (view) => {
  render(createElement(Auth, { onBack: () => {}, onDemo: () => {} }))
  if (view === 'signup') fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'teacher@example.com' } })
  const input = screen.getByLabelText('Password') as HTMLInputElement
  fireEvent.change(input, { target: { value: 'MiStyped-123!' } })
  if (view === 'signup') fireEvent.click(screen.getByRole('checkbox'))
  expect(input.type).toBe('password')
  expect(input.autocomplete).toBe(view === 'signup' ? 'new-password' : 'current-password')
  const toggle = screen.getByRole('button', { name: 'Show password' })
  expect(toggle.textContent).toBe('Show')
  expect(toggle.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 24 24')
  expect(toggle.getAttribute('type')).toBe('button')
  expect(toggle.getAttribute('aria-controls')).toBe(input.id)
  fireEvent.click(toggle)
  expect(input.type).toBe('text')
  expect(screen.getByRole('button', { name: 'Hide password' }).textContent).toBe('Hide')
  expect(input.value).toBe('MiStyped-123!')
  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
  expect(input.type).toBe('password')
  expect(input.value).toBe('MiStyped-123!')
  expect(signIn).not.toHaveBeenCalled()
  expect(signUp).not.toHaveBeenCalled()
})

it('hides the password again when switching forms and omits the toggle during reset', () => {
  render(createElement(Auth, { onBack: () => {}, onDemo: () => {} }))
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
  fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
  expect((screen.getByLabelText('Password') as HTMLInputElement).type).toBe('password')
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
  fireEvent.click(screen.getByRole('button', { name: 'Back to sign in' }))
  expect((screen.getByLabelText('Password') as HTMLInputElement).type).toBe('password')
  fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))
  expect(screen.queryByLabelText('Password')).toBeNull()
  expect(screen.queryByRole('button', { name: /show password|hide password/i })).toBeNull()
})

it('submits the unchanged password and masks it again after revealing it', async () => {
  render(createElement(Auth, { onBack: () => {}, onDemo: () => {} }))
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'teacher@example.com' } })
  const input = screen.getByLabelText('Password') as HTMLInputElement
  fireEvent.change(input, { target: { value: 'test-password-123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await waitFor(() => expect(signIn).toHaveBeenCalledWith('teacher@example.com', 'test-password-123'))
  expect(input.type).toBe('password')
})
