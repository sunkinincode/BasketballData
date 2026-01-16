const Navbar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'athlete', label: 'นักกีฬา' },
    { id: 'coach', label: 'โค้ช' },
    { id: 'admin', label: 'ผู้ดูแลระบบ' },
  ]

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-bold text-gray-800">
            ระบบจัดการนักกีฬาบาสเกตบอล
          </h1>
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
