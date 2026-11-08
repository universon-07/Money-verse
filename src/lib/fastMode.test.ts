// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { installFastMode } from './fastMode'
import { isDevMode } from './dev'

afterEach(() => {
  window.history.replaceState(null, '', '/')
  sessionStorage.clear()
  document.getElementById('mm-fast-mode')?.remove()
})

it('leaves normal play unchanged and installs optional fast styling once', () => {
  installFastMode()
  expect(document.getElementById('mm-fast-mode')).toBeNull()
  window.history.replaceState(null, '', '/?fast=1')
  installFastMode()
  installFastMode()
  expect(document.querySelectorAll('#mm-fast-mode')).toHaveLength(1)
})

it('remembers developer mode across navigation and supports turning it off', () => {
  window.history.replaceState(null, '', '/?dev=1')
  expect(isDevMode()).toBe(true)
  window.history.replaceState(null, '', '/story')
  expect(isDevMode()).toBe(true)
  window.history.replaceState(null, '', '/?dev=0')
  expect(isDevMode()).toBe(false)
})
