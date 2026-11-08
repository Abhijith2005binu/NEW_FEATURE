// Response Vault: Client-side offline response persistence and background synchronization
import { API_URL } from '../config.js'

const VAULT_KEY = 'spandan.responseVault'

export function getPendingResponses() {
  try {
    const raw = localStorage.getItem(VAULT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function savePendingResponse(payload) {
  try {
    const vault = getPendingResponses()
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      payload
    }
    // Prevent duplicate entries for the same question
    const filtered = vault.filter(v => v.payload.questionId !== payload.questionId)
    filtered.push(item)
    localStorage.setItem(VAULT_KEY, JSON.stringify(filtered))
    return item
  } catch (e) {
    console.error('[ResponseVault] Failed to save pending response:', e)
    return null
  }
}

export function removePendingResponse(id) {
  try {
    const vault = getPendingResponses()
    const updated = vault.filter(v => v.id !== id)
    localStorage.setItem(VAULT_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('[ResponseVault] Failed to remove response:', e)
  }
}

export async function syncPendingResponses(token, onSynced) {
  const pending = getPendingResponses()
  if (!pending.length) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of pending) {
    try {
      const res = await fetch(`${API_URL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(item.payload)
      })

      // 200/201 = success, 400 with 'already answered' or closed poll also means we can retire the vault item
      if (res.ok || res.status === 400) {
        removePendingResponse(item.id)
        synced++
      } else {
        failed++
      }
    } catch (err) {
      failed++
    }
  }

  if (synced > 0 && typeof onSynced === 'function') {
    onSynced(synced)
  }

  return { synced, failed }
}

