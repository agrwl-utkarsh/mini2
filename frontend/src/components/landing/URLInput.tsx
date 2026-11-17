import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { Button, Input } from '../common'
import { isValidGithubUrl, extractRepoInfo } from '../../services/api'
import { useAnalyzeRepo } from '../../hooks/useRepo'
import { useRepo } from '../../context/RepoContext'

export function URLInput() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState(false)
  const navigate = useNavigate()
  const { mutate: analyze, isPending } = useAnalyzeRepo()
  const { setRepo } = useRepo()

  const validateUrl = (value: string) => {
    setUrl(value)
    const valid = isValidGithubUrl(value)
    setIsValid(valid)
    if (value && !valid) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)')
    } else {
      setError('')
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValid || isPending) return

    const repoInfo = extractRepoInfo(url)
    analyze({ url }, {
      onSuccess: (response) => {
        setRepo({
          id: response.repoId,
          name: repoInfo?.name || 'Unknown',
          url,
          status: 'cloning',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        // Navigate to analysis page after successful API call
        navigate('/analyze')
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
          error={error}
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

      {error && !isValid && (
        <div className='mt-3 flex items-center gap-2 text-red-400 text-sm' role='alert'>
          <AlertCircle className='w-4 h-4 flex-shrink-0' />
          <span>{error}</span>
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

      <p className='mt-6 text-center text-sm text-navy-500'>
        Supports public GitHub repositories only. Private repos and GitHub Enterprise not supported.
      </p>
    </form>
  )
}
