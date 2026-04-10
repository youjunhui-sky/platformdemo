import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

type PermissionType = string | string[]

let isRegistered = false

export const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionType>) {
    const { value, modifiers } = binding
    const userStore = useUserStore()

    if (!value) {
      return
    }

    const permissions = Array.isArray(value) ? value : [value]

    const hasPermission = permissions.some((perm) => userStore.hasPermission(perm))

    if (!hasPermission) {
      if (modifiers.disable) {
        el.setAttribute('disabled', 'true')
        el.classList.add('is-disabled')
        el.addEventListener('click', preventClick, true)
      } else {
        el.parentNode?.removeChild(el)
      }
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<PermissionType>) {
    const { value, oldValue, modifiers } = binding
    const userStore = useUserStore()

    if (!value) {
      return
    }

    if (JSON.stringify(value) === JSON.stringify(oldValue)) {
      return
    }

    const permissions = Array.isArray(value) ? value : [value]

    const hasPermission = permissions.some((perm) => userStore.hasPermission(perm))

    if (!hasPermission) {
      if (modifiers.disable) {
        el.setAttribute('disabled', 'true')
        el.classList.add('is-disabled')
        el.addEventListener('click', preventClick, true)
      } else {
        el.parentNode?.removeChild(el)
      }
    } else {
      el.removeEventListener('click', preventClick, true)
      el.classList.remove('is-disabled')
      el.removeAttribute('disabled')
    }
  },

  unmounted(el: HTMLElement) {
    el.removeEventListener('click', preventClick, true)
  }
}

const preventClick = (e: MouseEvent) => {
  e.stopImmediatePropagation()
  e.preventDefault()
}

// Register directive globally
export const setupPermissionDirective = () => {
  if (!isRegistered) {
    // Will be registered in main.ts
    isRegistered = true
  }
}
