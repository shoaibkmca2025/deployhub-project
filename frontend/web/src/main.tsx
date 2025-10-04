import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './ui/App'
import Register from './ui/Register'
import FancyDashboard from './ui/FancyDashboard'
import Hardware from './ui/Hardware'
import Deployments from './ui/Deployments'
import DeployPage from './ui/DeployPage'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/register', element: <Register /> },
  { path: '/fancy', element: <FancyDashboard /> },
  { path: '/hardware', element: <Hardware /> },
  { path: '/deployments', element: <Deployments /> },
  { path: '/deploy/:linkId', element: <DeployPage /> },
])

const container = document.getElementById('root')!
createRoot(container).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)


