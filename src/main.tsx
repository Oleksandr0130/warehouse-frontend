import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import {ToastContainer} from "react-toastify";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
      <ToastContainer containerId="app"
                      position="top-center"
                      autoClose={4000}
                      hideProgressBar={false}
                      newestOnTop
                      closeOnClick
                      draggable
                      pauseOnHover
                      pauseOnFocusLoss={false}
                      theme="colored"
                      limit={3} />

  </StrictMode>,
)
