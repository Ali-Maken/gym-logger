import { createHashRouter } from 'react-router'
import { HomePage } from './features/home/HomePage'
import { SessionPage } from './features/session/SessionPage'

export const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/session', element: <SessionPage /> },
])
