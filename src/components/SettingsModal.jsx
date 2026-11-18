import { useState } from 'react'

export default function SettingsModal({ isOpen, onClose, apiKeys, onSave }) {
  const [form, setForm] = useState(apiKeys || {})
  const [saveStatus, setSaveStatus] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
    setSaveStatus('Settings saved successfully!')
    setTimeout(() => {
      setSaveStatus('')
      onClose()
    }, 1200)
  }

  const handleClear = () => {
    const emptyKeys = {
      gemini: '',
      grok: '',
      openrouter: '',
      deepseek: '',
      huggingface: '',
      github: '',
    }
    setForm(emptyKeys)
    onSave(emptyKeys)
    setSaveStatus('All keys cleared!')
    setTimeout(() => setSaveStatus(''), 1500)
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>⚙️ API & Provider Settings</h3>
            <p className="modal-sub">
              Keys are stored securely in your browser's <code>localStorage</code> and passed only with your direct requests.
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="settings-grid">
            {/* Gemini */}
            <div className="form-group">
              <label>
                Google Gemini API Key
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="link-help">
                  Get Free Key ↗
                </a>
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={form.gemini || ''}
                onChange={(e) => setForm({ ...form, gemini: e.target.value.trim() })}
                autoComplete="off"
              />
            </div>

            {/* Grok */}
            <div className="form-group">
              <label>
                xAI Grok API Key
                <a href="https://console.x.ai" target="_blank" rel="noreferrer" className="link-help">
                  Get Key ↗
                </a>
              </label>
              <input
                type="password"
                placeholder="xai-..."
                value={form.grok || ''}
                onChange={(e) => setForm({ ...form, grok: e.target.value.trim() })}
                autoComplete="off"
              />
            </div>

            {/* OpenRouter */}
            <div className="form-group">
              <label>
                OpenRouter API Key (Free models available)
                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="link-help">
                  Get Key ↗
                </a>
              </label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={form.openrouter || ''}
                onChange={(e) => setForm({ ...form, openrouter: e.target.value.trim() })}
                autoComplete="off"
              />
            </div>

            {/* DeepSeek */}
            <div className="form-group">
              <label>
                DeepSeek API Key
                <a href="https://platform.deepseek.com" target="_blank" rel="noreferrer" className="link-help">
                  Get Key ↗
                </a>
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={form.deepseek || ''}
                onChange={(e) => setForm({ ...form, deepseek: e.target.value.trim() })}
                autoComplete="off"
              />
            </div>

            {/* Hugging Face */}
            <div className="form-group">
              <label>
                Hugging Face Token
                <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="link-help">
                  Get Token ↗
                </a>
              </label>
              <input
                type="password"
                placeholder="hf_..."
                value={form.huggingface || ''}
                onChange={(e) => setForm({ ...form, huggingface: e.target.value.trim() })}
                autoComplete="off"
              />
            </div>

            {/* GitHub Token */}
            <div className="form-group">
              <label>
                GitHub Personal Access Token (Increases rate limit to 5000/hr)
                <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="link-help">
                  Generate Token ↗
                </a>
              </label>
              <input
                type="password"
                placeholder="ghp_..."
                value={form.github || ''}
                onChange={(e) => setForm({ ...form, github: e.target.value.trim() })}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="modal-actions space-between">
            <button type="button" className="btn-tool text-danger" onClick={handleClear}>
              Clear All Keys
            </button>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {saveStatus && <span className="copy-feedback">{saveStatus}</span>}
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
