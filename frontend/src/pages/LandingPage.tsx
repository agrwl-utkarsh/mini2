import { GitBranch, Brain, Search, Zap, Shield, Code2 } from 'lucide-react'
import { URLInput } from '../components/landing/URLInput'
import { Card } from '../components/common'
import { motion } from 'framer-motion'

const features = [
  { icon: Search, title: 'Smart Analysis', desc: 'Automatically detects languages, frameworks, and project structure' },
  { icon: Code2, title: 'Code Explorer', desc: 'Interactive file tree with syntax highlighting and navigation' },
  { icon: Brain, title: 'AI Explanations', desc: 'Get plain-English explanations of any file or function' },
  { icon: Zap, title: 'Instant Answers', desc: 'Ask questions about the codebase and get contextual responses' },
  { icon: Shield, title: 'Secure & Private', desc: 'No code execution, sandboxed analysis, your data stays local' },
  { icon: GitBranch, title: 'GitHub Native', desc: 'Works with any public GitHub repository, no auth required' },
]

export function LandingPage() {
  return (
    <div className='min-h-screen flex flex-col'>
      {/* Header */}
      <header className='border-b border-navy-700 bg-navy-950/80 backdrop-blur-sm sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center'>
                <GitBranch className='w-5 h-5 text-navy-950' />
              </div>
              <span className='text-xl font-bold text-navy-100'>RepoSense</span>
            </div>
            <nav className='hidden md:flex items-center gap-6'>
              <a href='#features' className='text-navy-300 hover:text-navy-100 transition-colors text-sm font-medium'>Features</a>
              <a href='#how-it-works' className='text-navy-300 hover:text-navy-100 transition-colors text-sm font-medium'>How it Works</a>
              <a href='https://github.com/agrwl-utkarsh/mini2' target='_blank' rel='noopener noreferrer' className='text-navy-300 hover:text-navy-100 transition-colors text-sm font-medium'>GitHub</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className='flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl w-full text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='mb-8'
          >
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6'>
              <span className='w-2 h-2 rounded-full bg-cyan-500 animate-pulse' />
              AI-Powered Codebase Understanding
            </div>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-navy-100 mb-6'>
              Understand Any{' '}
              <span className='gradient-text'>GitHub Repository</span>{' '}
              in Seconds
            </h1>
            <p className='text-lg sm:text-xl text-navy-300 max-w-2xl mx-auto mb-10 leading-relaxed'>
              Paste a GitHub URL and get an interactive map of the codebase with AI-powered explanations,
              file exploration, and a chat assistant that knows the code.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <URLInput />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='mt-16'
          >
            <div className='flex items-center justify-center gap-4 text-sm text-navy-500'>
              <span className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-800 border border-navy-700'>
                <GitBranch className='w-3.5 h-3.5' />
                Public repos only
              </span>
              <span className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-800 border border-navy-700'>
                <Shield className='w-3.5 h-3.5' />
                No code execution
              </span>
              <span className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-800 border border-navy-700'>
                <Zap className='w-3.5 h-3.5' />
                {'<'} 30s analysis
              </span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features */}
      <section id='features' className='py-20 px-4 sm:px-6 lg:px-8 bg-navy-900/30'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold text-navy-100 mb-4'>Why RepoSense?</h2>
            <p className='text-lg text-navy-300 max-w-2xl mx-auto'>
              Built for developers who need to quickly understand unfamiliar codebases
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card variant='hover' padding='lg' className='h-full'>
                  <div className='w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4'>
                    <feature.icon className='w-6 h-6' />
                  </div>
                  <h3 className='text-lg font-semibold text-navy-100 mb-2'>{feature.title}</h3>
                  <p className='text-navy-400'>{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id='how-it-works' className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold text-navy-100 mb-4'>How It Works</h2>
            <p className='text-lg text-navy-300 max-w-2xl mx-auto'>
              Three simple steps from URL to understanding
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              { step: '01', title: 'Enter URL', desc: 'Paste any public GitHub repository URL. We validate and prepare for analysis.' },
              { step: '02', title: 'Analyze', desc: 'We clone the repo, scan structure, detect languages/frameworks, and index files.' },
              { step: '03', title: 'Explore & Ask', desc: 'Browse the file tree, view code with explanations, or chat with the AI assistant.' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Card variant='hover' padding='lg' className='relative h-full'>
                  <div className='absolute -top-3 left-6 w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-lg'>
                    {item.step}
                  </div>
                  <div className='pt-6'>
                    <h3 className='text-xl font-semibold text-navy-100 mb-3'>{item.title}</h3>
                    <p className='text-navy-400'>{item.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - URLInput removed from here to avoid duplicate */}
      <section className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-3xl mx-auto text-center'>
          <Card variant='glass' padding='lg' className='border-gradient'>
            <h2 className='text-3xl font-bold text-navy-100 mb-4'>Ready to Explore?</h2>
            <p className='text-navy-300 mb-8'>Try RepoSense with any public GitHub repository</p>
            <p className='text-navy-400'>Enter a GitHub URL in the input above to get started</p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-navy-700 bg-navy-950 py-8 px-4'>
        <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-navy-500'>
          <p>RepoSense - College Mini Project</p>
          <div className='flex items-center gap-4'>
            <a href='https://github.com/agrwl-utkarsh/mini2' target='_blank' rel='noopener noreferrer' className='hover:text-navy-300 transition-colors'>
              GitHub
            </a>
            <a href='#' className='hover:text-navy-300 transition-colors'>Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
