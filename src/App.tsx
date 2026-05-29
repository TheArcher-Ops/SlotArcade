import { SlotMachine } from './components/SlotMachine';
import './styles/app.css';

export default function App() {
  return (
    <main className="app">
      <SlotMachine />
      <footer className="footer">
        Play money only · No real-money gambling · Built with React + Vite
      </footer>
    </main>
  );
}
