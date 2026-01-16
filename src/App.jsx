import { useState } from 'react'
import Navbar from './components/Navbar'
import AdminTab from './components/AdminTab'
import CoachTab from './components/CoachTab'
import AthleteTab from './components/AthleteTab'
import PDPAModal from './components/PDPAModal'

function App() {
  const [activeTab, setActiveTab] = useState('athlete')

  return (
    <div className="min-h-screen bg-gray-50">
      <PDPAModal />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'admin' && <AdminTab />}
        {activeTab === 'coach' && <CoachTab />}
        {activeTab === 'athlete' && <AthleteTab />}
      </main>
    </div>
  )
}

export default App
