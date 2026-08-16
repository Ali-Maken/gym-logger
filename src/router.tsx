import { createHashRouter } from 'react-router'
import { HistoryPage } from './features/history/HistoryPage'
import { SessionDetailPage } from './features/history/SessionDetailPage'
import { HomePage } from './features/home/HomePage'
import { SessionPage } from './features/session/SessionPage'

export const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/session', element: <SessionPage /> },
  { path: '/history', element: <HistoryPage /> },
  { path: '/history/:sessionId', element: <SessionDetailPage /> },
])
