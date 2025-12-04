import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import MessageBases from './pages/MessageBases';
import AISettings from './pages/AISettings';
import ConversationStarters from './pages/ConversationStarters';
import Login from './components/Login';
import { api } from './services/api';

type Page = 'dashboard' | 'users' | 'messageBases' | 'aiSettings' | 'conversationStarters';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(api.isAuthenticated());
    
    // Set up token expiration handler
    api.setOnTokenExpired(() => {
      setIsAuthenticated(false);
      alert('Your session has expired. Please log in again.');
    });
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    api.clearToken();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <Users />;
      case 'messageBases':
        return <MessageBases />;
      case 'aiSettings':
        return <AISettings />;
      case 'conversationStarters':
        return <ConversationStarters />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-cyan-500">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-400">
            BaudAgain BBS - SysOp Control Panel
          </h1>
          <button
            onClick={handleLogout}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-gray-800 min-h-screen border-r border-gray-700">
          <ul className="py-4">
            <li>
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`w-full text-left px-6 py-3 hover:bg-gray-700 transition-colors ${
                  currentPage === 'dashboard' ? 'bg-gray-700 text-cyan-400' : 'text-gray-300'
                }`}
              >
                📊 Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentPage('users')}
                className={`w-full text-left px-6 py-3 hover:bg-gray-700 transition-colors ${
                  currentPage === 'users' ? 'bg-gray-700 text-cyan-400' : 'text-gray-300'
                }`}
              >
                👥 Users
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentPage('messageBases')}
                className={`w-full text-left px-6 py-3 hover:bg-gray-700 transition-colors ${
                  currentPage === 'messageBases' ? 'bg-gray-700 text-cyan-400' : 'text-gray-300'
                }`}
              >
                💬 Message Bases
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentPage('aiSettings')}
                className={`w-full text-left px-6 py-3 hover:bg-gray-700 transition-colors ${
                  currentPage === 'aiSettings' ? 'bg-gray-700 text-cyan-400' : 'text-gray-300'
                }`}
              >
                🤖 AI Settings
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentPage('conversationStarters')}
                className={`w-full text-left px-6 py-3 hover:bg-gray-700 transition-colors ${
                  currentPage === 'conversationStarters' ? 'bg-gray-700 text-cyan-400' : 'text-gray-300'
                }`}
              >
                💭 Conversation Starters
              </button>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
