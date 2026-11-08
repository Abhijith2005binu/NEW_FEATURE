import React, { useRef, useEffect } from 'react'
import { Headphones, Volume2, WifiOff, Radio, FileText, Check, CircleCheck, Clock, Zap, ArrowRight, ShieldCheck } from 'lucide-react'
import { Ico } from './icons'

export default function AudioOnlyViewport({
  isLiveStream = false,
  liveTranscript = '',
  currentQuestion = null,
  timeLeft = 0,
  selectedOptions = [],
  onSelectOption,
  onSubmitAnswer,
  submitted = false,
  isMobile = false,
  onSwitchToVideo
}) {
  const transcriptScrollRef = useRef(null)

  // Auto-scroll transcript container as new chunks arrive
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight
    }
  }, [liveTranscript])

  return (
    <div
      data-testid="audio-only-viewport"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg, 16px)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow, 0 4px 20px rgba(0,0,0,0.06))',
        marginBottom: '24px',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Top Banner / Stream Status Indicator */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(124, 58, 237, 0.08))',
          borderBottom: '1px solid var(--border-color)',
          padding: isMobile ? '12px 16px' : '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--accent-solid, #2563eb)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Headphones size={18} aria-hidden="true" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                Audio Only Mode Active — Stream Paused
              </span>
              {isLiveStream && (
                <span
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  LIVE
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Video decoding paused · Audio playback & live transcriptions active
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'var(--tint-info-bg, rgba(37, 99, 235, 0.1))',
              color: 'var(--tint-info-fg, #2563eb)',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '600'
            }}
          >
            <Zap size={12} /> Low Bandwidth Saved
          </span>
          {onSwitchToVideo && (
            <button
              onClick={onSwitchToVideo}
              title="Resume standard video mode"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Resume Video <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main Body: 2 Columns on Desktop (Transcriptions & Dynamic Poll HUD) */}
      <div
        style={{
          padding: isMobile ? '16px' : '20px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
          gap: '16px'
        }}
      >
        {/* Left Column: Live Speech-to-Text Transcription */}
        <div
          style={{
            background: 'var(--bg-secondary, rgba(0,0,0,0.02))',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '220px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: 'var(--accent, #2563eb)' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Live Speech-to-Text Transcription
              </span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#10b981'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981'
                }}
              />
              Synced
            </span>
          </div>

          <div
            ref={transcriptScrollRef}
            data-testid="live-transcript-stream"
            style={{
              flex: 1,
              maxHeight: '180px',
              overflowY: 'auto',
              fontSize: '14px',
              lineHeight: '1.6',
              color: liveTranscript ? 'var(--text-primary)' : 'var(--text-secondary)',
              paddingRight: '4px'
            }}
          >
            {liveTranscript ? (
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{liveTranscript}</p>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '24px 12px'
                }}
              >
                Listening to audio... Transcriptions will stream here in real time as the lecture progresses.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Poll HUD Card (PR #148) */}
        <div
          data-testid="poll-hud-card"
          style={{
            background: currentQuestion
              ? 'linear-gradient(135deg, #6d28d9, #8b5cf6)'
              : 'var(--bg-secondary, rgba(0,0,0,0.02))',
            color: currentQuestion ? 'white' : 'var(--text-primary)',
            borderRadius: '12px',
            border: `1px solid ${currentQuestion ? '#7c3aed' : 'var(--border-color)'}`,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: currentQuestion ? '0 8px 24px rgba(109, 40, 217, 0.25)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          {currentQuestion ? (
            <div>
              {/* Poll Active HUD Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ffd700',
                      animation: 'blink 1s infinite'
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>
                    LIVE POLL HUD
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(0,0,0,0.25)',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  <Clock size={12} /> {timeLeft}s
                </div>
              </div>

              {/* Question Preview */}
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  margin: '0 0 12px 0',
                  lineHeight: '1.4',
                  maxHeight: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {typeof currentQuestion.question === 'string' ? currentQuestion.question : (currentQuestion.question?.question || '')}
              </p>

              {/* Quick Options Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {(currentQuestion.options || []).map((opt, idx) => {
                  const isMSQ = currentQuestion.type === 'MSQ'
                  const isSelected = isMSQ
                    ? selectedOptions.includes(idx)
                    : selectedOptions.length === 1 && selectedOptions[0] === idx
                  const letter = String.fromCharCode(65 + idx)
                  const text = typeof opt === 'string' ? opt : opt.text

                  return (
                    <button
                      key={idx}
                      onClick={() => onSelectOption && onSelectOption(idx, isMSQ)}
                      disabled={submitted}
                      style={{
                        padding: '8px 10px',
                        background: isSelected ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)',
                        border: `1.5px solid ${isSelected ? '#ffd700' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: submitted ? 'default' : 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: isSelected ? '#ffd700' : 'rgba(255,255,255,0.2)',
                          color: isSelected ? '#1f2937' : 'white',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '800',
                          flexShrink: 0
                        }}
                      >
                        {letter}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
                    </button>
                  )
                })}
              </div>

              {/* Submit Action */}
              {submitted ? (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CircleCheck size={14} /> Answer Submitted
                </div>
              ) : (
                <button
                  onClick={onSubmitAnswer}
                  disabled={selectedOptions.length === 0}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: selectedOptions.length > 0 ? '#ffd700' : 'rgba(255,255,255,0.2)',
                    color: selectedOptions.length > 0 ? '#1f2937' : 'rgba(255,255,255,0.6)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: selectedOptions.length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  Submit Answer ({selectedOptions.length} selected)
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '16px'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--tint-info-bg, rgba(37, 99, 235, 0.1))',
                  color: 'var(--accent, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}
              >
                <Radio size={20} />
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '700' }}>
                Poll Monitor Active
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '260px' }}>
                Real-time poll triggers, audio chimes, and haptic alerts remain active while video is paused.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
