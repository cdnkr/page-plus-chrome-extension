import Main from "./components/Main"
import { LanguageProvider } from "./contexts/LanguageContext"

function App() {
  return (
    <LanguageProvider>
      <Main />
    </LanguageProvider>
  )
}

export default App
