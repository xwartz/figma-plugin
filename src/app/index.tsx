import { createRoot } from 'react-dom/client'

import Container from './container'
import 'react-figma-ui/ui/styles.css'

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-page')

  if (!container) {
    throw new Error('React root container not found.')
  }

  const root = createRoot(container)
  root.render(<Container />)
})
