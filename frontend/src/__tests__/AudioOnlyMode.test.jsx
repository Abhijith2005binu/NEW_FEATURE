import React from 'react'
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { setMediaStreamsAudioOnly } from '../lib/mediaStreamControl'
import { getPendingResponses, savePendingResponse, removePendingResponse, syncPendingResponses } from '../lib/responseVault'

const mockListeners = {}
const mockSocket = {
  on: jest.fn((ev, fn) => { (mockListeners[ev] ||= []).push(fn) }),
  off: jest.fn((ev, fn) => { mockListeners[ev] = (mockListeners[ev] || []).filter(f => f !== fn) }),
  emit: jest.fn(),
  connected: true
}
const fire = (ev, data) => (mockListeners[ev] || []).forEach(fn => fn(data))

jest.mock('../stores/authStore', () => () => ({ user: { _id: 'stu1', name: 'Test Student', role: 'student' }, token: 'tok-xyz', logout: jest.fn() }))
jest.mock('../stores/socketStore', () => () => ({ socket: mockSocket, isConnected: true, joinRoom: jest.fn(), leaveRoom: jest.fn() }))
jest.mock('../stores/roomStore', () => () => ({
  joinRoomByCode: jest.fn().mockResolvedValue({
    _id: 'room1',
    code: 'ROOM99',
    name: 'Physics 101',
    settings: { mode: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
  }),
  setAuthToken: jest.fn()
}))
jest.mock('../config.js', () => ({ BASE_PATH: '/spandan', API_URL: '/spandan/api', SOCKET_URL: 'http://localhost' }))
jest.mock('../components/Sidebar', () => () => null)
jest.mock('../components/ThemeToggle', () => () => null)
jest.mock('../components/ProfileDropdown', () => () => null)
jest.mock('../components/Leaderboard', () => () => null)
jest.mock('../components/YouTubeVideo', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-youtube-video">YouTube Player</div>,
  extractYouTubeId: () => 'dQw4w9WgXcQ'
}))
jest.mock('../hooks/useIsMobile', () => ({ __esModule: true, default: () => false }))
jest.mock('../lib/sounds', () => ({
  installUnlockOnInteraction: jest.fn(),
  playStudentQuestion: jest.fn().mockResolvedValue('played'),
  unlockAudio: jest.fn().mockResolvedValue(true),
  isSoundEnabled: () => true
}))

import StudentRoomPage from '../pages/StudentRoomPage'

const mount = () => render(
  <MemoryRouter initialEntries={['/student/room/ROOM99']}>
    <Routes><Route path="/student/room/:roomCode" element={<StudentRoomPage />} /></Routes>
  </MemoryRouter>
)

describe('Low-Bandwidth Audio Only Mode for Student Classroom View', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    for (const k of Object.keys(mockListeners)) delete mockListeners[k]
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ responses: [], transcripts: [{ text: 'Welcome to Physics class.' }] })
    })
    navigator.vibrate = jest.fn()
  })

  it('renders the Audio Only toggle in the control bar with default OFF and toggles ON with persistence', async () => {
    mount()
    await screen.findByRole('heading', { name: 'Physics 101' })
    await act(async () => { fire('room:joined', { roomCode: 'ROOM99' }) })

    const toggle = screen.getByTestId('audio-only-toggle')
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveTextContent('OFF')
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    // Click toggle to enable Audio Only Mode
    fireEvent.click(toggle)

    expect(toggle).toHaveTextContent('ON')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(localStorage.getItem('spandan.audioOnlyMode')).toBe('true')

    // Audio-Only Viewport is mounted
    const viewport = screen.getByTestId('audio-only-viewport')
    expect(viewport).toBeInTheDocument()
    expect(within(viewport).getByText(/Audio Only Mode Active — Stream Paused/i)).toBeInTheDocument()

    // Floating toast feedback notification appears
    expect(screen.getByTestId('audio-only-toast')).toHaveTextContent(/Audio Only Mode Active/i)

    // Toggling again restores Standard Mode
    fireEvent.click(toggle)
    expect(toggle).toHaveTextContent('OFF')
    expect(localStorage.getItem('spandan.audioOnlyMode')).toBe('false')
    expect(screen.getByTestId('audio-only-toast')).toHaveTextContent(/Standard Video Mode Restored/i)
  })

  it('preserves audio only preference across page reloads from localStorage', async () => {
    localStorage.setItem('spandan.audioOnlyMode', 'true')
    mount()
    await screen.findByRole('heading', { name: 'Physics 101' })

    const toggle = screen.getByTestId('audio-only-toggle')
    expect(toggle).toHaveTextContent('ON')
    expect(screen.getByTestId('audio-only-viewport')).toBeInTheDocument()
  })

  it('auto-switches to Audio Only after a burst of socket reconnects (runtime probe)', async () => {
    mount()
    await screen.findByRole('heading', { name: 'Physics 101' })
    await act(async () => { fire('room:joined', { roomCode: 'ROOM99' }) })

    const toggle = screen.getByTestId('audio-only-toggle')
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    // Two reconnects stay under the trigger threshold
    await act(async () => {
      fire('disconnect', 'transport close')
      fire('disconnect', 'transport close')
    })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    // Third reconnect inside the window trips the probe
    await act(async () => { fire('disconnect', 'transport close') })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(localStorage.getItem('spandan.audioOnlyMode')).toBe('true')
    expect(screen.getByTestId('audio-only-toast')).toHaveTextContent(/Unstable connection detected/i)
  })

  it('streams live speech-to-text transcriptions into the viewport', async () => {
    localStorage.setItem('spandan.audioOnlyMode', 'true')
    mount()
    await screen.findByRole('heading', { name: 'Physics 101' })
    await act(async () => { fire('room:joined', { roomCode: 'ROOM99' }) })

    // Initial transcript fetched
    await waitFor(() => {
      expect(screen.getByTestId('live-transcript-stream')).toHaveTextContent(/Welcome to Physics class/i)
    })

    // New live transcription chunk arrives over WebSocket
    await act(async () => {
      fire('transcription:chunk', { text: 'Today we discuss thermodynamics.', segmentIndex: 1 })
    })

    expect(screen.getByTestId('live-transcript-stream')).toHaveTextContent(/Today we discuss thermodynamics/i)
  })

  it('renders dynamic poll HUD card and allows answering during Audio Only mode', async () => {
    localStorage.setItem('spandan.audioOnlyMode', 'true')
    mount()
    await screen.findByRole('heading', { name: 'Physics 101' })
    await act(async () => { fire('room:joined', { roomCode: 'ROOM99' }) })

    // HUD starts in standby
    expect(screen.getByText(/Poll Monitor Active/i)).toBeInTheDocument()

    // Question triggered by teacher
    await act(async () => {
      fire('question:started', {
        questionId: 'q123',
        question: {
          id: 'q123',
          question: 'Is heat a form of energy?',
          type: 'TF',
          options: [{ text: 'True' }, { text: 'False' }],
          timeToAnswer: 30
        },
        timer: 30
      })
    })

    // Dynamic poll HUD card activates with countdown and poll alert
    const hud = screen.getByTestId('poll-hud-card')
    expect(hud).toHaveTextContent('Is heat a form of energy?')
    expect(within(hud).getByText('True')).toBeInTheDocument()
    expect(within(hud).getByText('False')).toBeInTheDocument()
    expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100])

    // Select option A (True) from HUD
    fireEvent.click(within(hud).getByText('True'))

    // Submit answer from HUD
    const submitBtn = within(hud).getByRole('button', { name: /Submit Answer/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    expect(within(hud).getByText(/Answer Submitted/i)).toBeInTheDocument()
  })

  it('Response Vault: safely saves responses locally when offline and syncs on reconnect', async () => {
    const payload = { roomId: 'r1', questionId: 'q9', studentId: 'stu1', selectedOptions: [0] }

    // Save pending response
    const saved = savePendingResponse(payload)
    expect(saved).not.toBeNull()
    expect(getPendingResponses().length).toBe(1)

    // Sync successfully with server
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) })
    const syncedCallback = jest.fn()
    const result = await syncPendingResponses('mock-token', syncedCallback)

    expect(result.synced).toBe(1)
    expect(syncedCallback).toHaveBeenCalledWith(1)
    expect(getPendingResponses().length).toBe(0)
  })

  it('WebRTC MediaStream control toggles video tracks without muting audio', () => {
    const videoTrack = { kind: 'video', enabled: true }
    const audioTrack = { kind: 'audio', enabled: true }
    const mockMediaStream = {
      getVideoTracks: () => [videoTrack],
      getAudioTracks: () => [audioTrack]
    }

    const mockVideoEl = document.createElement('video')
    mockVideoEl.srcObject = mockMediaStream
    document.body.appendChild(mockVideoEl)

    // Enable audio-only mode
    setMediaStreamsAudioOnly(true)
    expect(videoTrack.enabled).toBe(false)
    expect(audioTrack.enabled).toBe(true)

    // Restore standard mode
    setMediaStreamsAudioOnly(false)
    expect(videoTrack.enabled).toBe(true)
    expect(audioTrack.enabled).toBe(true)

    document.body.removeChild(mockVideoEl)
  })
})
