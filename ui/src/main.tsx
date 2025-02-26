import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { store } from './store/store.ts'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import "./style.css"
import "./lang/locale.ts"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster position='top-left' />
    </Provider>
  </StrictMode>,
)