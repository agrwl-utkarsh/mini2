import { http, HttpResponse, delay } from 'msw'
import { mockFileTree, mockFileContent, mockExplanation, mockChatResponse, mockStats } from './data'

const DEMO_REPO_ID = 'demo-repo-123'

export const handlers = [
  http.post('/api/repo/analyze', async ({ request }) => {
    await delay(1000)
    const body = await request.json() as { url?: string }
    if (!body.url || !body.url.includes('github.com')) {
      return HttpResponse.json({ message: 'Invalid GitHub URL' }, { status: 400 })
    }
    return HttpResponse.json({ repoId: DEMO_REPO_ID, status: 'processing' })
  }),

  http.get(`/api/repo/${DEMO_REPO_ID}/status`, async () => {
    await delay(500)
    return HttpResponse.json({ status: 'complete' })
  }),

  http.get(`/api/repo/${DEMO_REPO_ID}/structure`, async () => {
    await delay(300)
    return HttpResponse.json(mockFileTree)
  }),

  http.get(`/api/repo/${DEMO_REPO_ID}/stats`, async () => {
    await delay(300)
    return HttpResponse.json(mockStats)
  }),

  http.get(`/api/repo/${DEMO_REPO_ID}/files/*`, async ({ request }) => {
    await delay(200)
    const url = new URL(request.url)
    const path = url.pathname.replace(`/api/repo/${DEMO_REPO_ID}/files/`, '')
    return HttpResponse.json({ ...mockFileContent, path })
  }),

  http.post(`/api/repo/${DEMO_REPO_ID}/explain`, async () => {
    await delay(800)
    return HttpResponse.json(mockExplanation)
  }),

  http.post(`/api/repo/${DEMO_REPO_ID}/chat`, async ({ request }) => {
    await delay(1200)
    const body = await request.json() as { question?: string }
    return HttpResponse.json({
      ...mockChatResponse,
      answer: `This is a mock response to: "${body.question || ''}". In production, this would use the Gemini API to analyze your repository and provide contextual answers with file references.`,
    })
  }),

  http.delete(`/api/repo/${DEMO_REPO_ID}`, async () => {
    await delay(200)
    return new HttpResponse(null, { status: 204 })
  }),
]