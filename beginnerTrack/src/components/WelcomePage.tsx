import '../styles/welcome.css'
import Confetti from './Confetti'

export default function WelcomePage() {
  return (
    <div className="welcome-page">
      <Confetti />
      <h1 className="welcome-page__heading">Welcome to OpenSlava 2026</h1>
      <p className="welcome-page__subtitle">Powered by IBM Bob</p>
    </div>
  )
}
