import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'


function App(){

  const [count, setCount] = useState(0)

  function handleCount(){
    setCount(count + 1)
  }

  return(
    <div>
       <h1 className="text-4xl font-bold underline">Hello, Tailwind v4!</h1>

        <button
        onClick={handleCount}
        >
          count {count}
        </button>
        <div>
          <img>{viteLogo}</img>
          <img>{reactLogo}</img>
        </div>
    </div>

  )
}

export default App
