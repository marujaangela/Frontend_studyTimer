import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import TodoComponent from '../TodoList.vue'

/**
 * Stubbing des globalen Fetch – verhindert echte Netzwerkzugriffe
 */
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((_url, options) => {
    if (options?.method === 'GET' || !options?.method) {
      return Promise.resolve({ ok: true, json: async () => [] })
    }

    if (options.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: Math.floor(Math.random() * 10000),
          taskDescription: JSON.parse(options.body as string).taskDescription,
          completed: false,
        })
      })
    }

    return Promise.resolve({ ok: true, json: async () => ({}) })
  }))
})

/**
 * Erstellt ein Beispiel-Todo
 */
const createExampleTodo = async (wrapper: ReturnType<typeof mount>, text: string) => {
  const input = wrapper.find('input[type="text"]')
  const button = wrapper.find('button')

  await input.setValue(text)
  await button.trigger('click')
  await flushPromises()
}

describe('TodoComponent', () => {
  /**
   * 1. Fügt ein neues Todo hinzu
   */
  it('fügt ein neues Todo hinzu', async () => {
    const wrapper = mount(TodoComponent)
    await createExampleTodo(wrapper, 'Test-Aufgabe')
    expect(wrapper.html()).toContain('Test-Aufgabe')
  })

  /**
   * 2. Markiert ein Todo als erledigt
   */
  it('markiert ein Todo als erledigt', async () => {
    const wrapper = mount(TodoComponent)
    await createExampleTodo(wrapper, 'Erledigen')

    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    await flushPromises()

    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  /**
   * 3. Bearbeitet ein Todo
   */
  it('bearbeitet ein Todo', async () => {
    const wrapper = mount(TodoComponent)
    await createExampleTodo(wrapper, 'Ursprünglich')

    const task = wrapper.find('.cursor-pointer')
    await task.trigger('click')

    const editInput = wrapper.find('input[type="text"]')
    await editInput.setValue('Bearbeitet')
    await editInput.trigger('keyup.enter')
    await flushPromises()

    expect(wrapper.html()).toContain('Bearbeitet')
  })

  /**
   * 4. Löscht ein Todo
   */
  it('löscht ein Todo', async () => {
    const wrapper = mount(TodoComponent)
    await createExampleTodo(wrapper, 'Zum Löschen')

    const deleteBtn = wrapper.find('button.text-red-500')
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(wrapper.html()).not.toContain('Zum Löschen')
  })
})
