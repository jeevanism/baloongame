import { useState } from 'react'
import './App.css'
import Button from './components/Button'
import GameContainer from './components/GameContainer'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div id="gamescore">
        <Button />
        <GameContainer />

      </div>
    </>
  )
}

export default App
