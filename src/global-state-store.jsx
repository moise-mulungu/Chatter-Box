// store.js
import create from 'zustand'

export const globalStateStore = create((set) => ({
  testKey: 'testValue',
  setTestKey: (value) => set({ testKey: value }),
}))
