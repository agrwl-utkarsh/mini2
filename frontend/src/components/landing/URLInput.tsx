import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, ArrowRight, CheckCircle, AlertCircle, Settings, Check } from 'lucide-react'
import { Button, Input } from '../common'
import { isValidGithubUrl, extractRepoInfo, getApiBase, setCustomApiUrl } from '../../services/api'
import { useAnalyzeRepo } from '../../hooks/useRepo'
import { useRepo } from '../../context/RepoContext'

export function URLInput() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [backendUrl, setBackendUrl] = useState('')
  const [savedBackend, setSavedBackend] = useState(false)
  const navigate = useNavigate()
  const { mutate: analyze, isPending } = useAnalyzeRepo()
  const { setRepo } = useRepo()

  useEffect(() => {
    setBackendUrl(getApiBase())
  }, [])

  const validateUrl = (value: string) => {
    setUrl(value)
    let checkValue = value.trim()
    if (checkValue && !checkValue.startsWith('http://') && !checkValue.startsWith('https://')) {
      checkValue = 'https://' + checkValue
    }
    const valid = isValidGithubUrl(checkValue)
    setIsValid(valid)
    if (value && !valid) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)')
    } else {
      setError('')
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    let trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a GitHub repository URL')
      return
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed
      setUrl(trimmed)
    }

    if (!isValidGithubUrl(trimmed)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)')
      return
    }

    if (isPending) return

    setError('')
    const repoInfo = extractRepoInfo(trimmed)
    analyze({ url: trimmed }, {
      onSuccess: (response) => {
        setRepo({
          id: response.repoId,
          name: repoInfo?.name || 'Unknown',
          url: trimmed,
          status: response.status || 'cloning',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        navigate('/analyze')
      },
      onError: (err: any) => {
        const msg = err?.message || 'Failed to reach backend server. Please verify your backend URL.'
        setError(msg)
        if (msg.includes('405') || msg.includes('Cannot connect')) {
          setShowConfig(true)
        }
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className='w-full max-w-2xl mx-auto'>
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-navy-500'>
          <GitBranch className='w-5 h-5' />
        </div>
        <Input
          type='url'
          value={url}
          onChange={(e) => validateUrl(e.target.value)}
          placeholder='https://github.com/owner/repository'
          className='pl-12 pr-4 py-3.5 text-lg bg-navy-900/80 border-navy-700 focus:border-cyan-500'
          disabled={isPending}
          error={error ? ' ' : undefined}
          aria-label='GitHub repository URL'
          autoComplete='off'
          autoFocus
        />
        {isValid && !isPending && (
          <div className='absolute inset-y-0 right-0 pr-4 flex items-center text-green-400'>
            <CheckCircle className='w-5 h-5' />
          </div>
        )}
      </div>

      {error && (
        <div className='mt-3 p-3.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-sm text-left' role='alert'>
          <div className='flex items-start gap-2.5'>
            <AlertCircle className='w-4 h-4 flex-shrink-0 mt-0.5 text-red-400' />
            <div className='flex-1'>
              <p className='font-medium'>{error}</p>
              {!showConfig && (
                <button
                  type='button'
                  onClick={() => setShowConfig(true)}
                  className='mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline font-medium'
                >
                  <Settings className='w-3.5 h-3.5' />
                  Configure Render Backend URL
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfig && (
        <div className='mt-4 p-4 rounded-xl bg-navy-900/90 border border-cyan-500/40 text-left space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-cyan-400 flex items-center gap-1.5'>
              <Settings className='w-3.5 h-3.5' />
              Backend API URL Configuration
            </span>
            <button
              type='button'
              onClick={() => setShowConfig(false)}
              className='text-xs text-navy-400 hover:text-navy-200'
            >
              Hide
            </button>
          </div>
          <p className='text-xs text-navy-400'>
            Enter your deployed Render backend URL (e.g., <code className='text-cyan-300'>https://reposense-api.onrender.com</code>):
          </p>
          <div className='flex gap-2'>
            <input
              type='url'
              value={backendUrl}
              onChange={(e) => {
                setBackendUrl(e.target.value)
                setSavedBackend(false)
              }}
              placeholder='https://your-service.onrender.com'
              className='flex-1 px-3 py-2 bg-navy-950 border border-navy-700 rounded-lg text-sm text-navy-100 placeholder-navy-600 focus:outline-none focus:border-cyan-500'
            />
            <Button
              type='button'
              size='sm'
              variant='primary'
              onClick={() => {
                if (backendUrl.trim()) {
                  setCustomApiUrl(backendUrl)
                  setSavedBackend(true)
                  setError('')
                  setTimeout(() => setSavedBackend(false), 2500)
                }
              }}
            >
              {savedBackend ? <Check className='w-4 h-4' /> : 'Save'}
            </Button>
          </div>
          {savedBackend && (
            <p className='text-xs text-green-400 flex items-center gap-1'>
              <Check className='w-3.5 h-3.5' /> Backend URL saved! Now click Analyze Repository.
            </p>
          )}
        </div>
      )}

      <div className='mt-6 flex justify-center'>
        <Button
          type='submit'
          variant='primary'
          size='lg'
          loading={isPending}
          disabled={!isValid || isPending}
          className='w-full sm:w-auto min-w-[200px]'
        >
          <ArrowRight className='w-5 h-5' />
          Analyze Repository
        </Button>
      </div>

      <div className='mt-4 flex items-center justify-center gap-2'>
        <button
          type='button'
          onClick={() => setShowConfig(!showConfig)}
          className='inline-flex items-center gap-1 text-xs text-navy-500 hover:text-cyan-400 transition-colors'
        >
          <Settings className='w-3.5 h-3.5' />
          {showConfig ? 'Hide Backend Settings' : 'Backend Settings'}
        </button>
      </div>

      <p className='mt-4 text-center text-sm text-navy-500'>
        Supports public GitHub repositories only. Private repos and GitHub Enterprise not supported.
      </p>
    </form>
  )
}
