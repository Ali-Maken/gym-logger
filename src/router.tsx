import { createHashRouter } from 'react-router'
import { HomePage } from './features/home/HomePage'

export const router = createHashRouter([{ path: '/', element: <HomePage /> }])
