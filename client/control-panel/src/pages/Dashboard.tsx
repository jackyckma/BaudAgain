function Dashboard() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-cyan-400 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Current Callers</h3>
          <p className="text-3xl font-bold text-cyan-400">0</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-green-400">0</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Messages Today</h3>
          <p className="text-3xl font-bold text-yellow-400">0</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Recent Activity</h3>
        <p className="text-gray-400">No recent activity</p>
      </div>
    </div>
  );
}

export default Dashboard;
