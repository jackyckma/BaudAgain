import { useEffect, useState } from 'react';
import { api, type DashboardData } from '../services/api';

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
    // Refresh every 5 seconds
    const interval = setInterval(loadDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await api.getDashboard();
      setData(dashboardData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500 rounded px-4 py-3 text-red-200">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <h2 className="text-3xl font-bold text-cyan-400 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Current Callers</h3>
          <p className="text-3xl font-bold text-cyan-400">{data.currentCallers}</p>
          <p className="text-xs text-gray-500 mt-2">
            {data.nodeUsage.active}/{data.nodeUsage.total} nodes in use
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-green-400">{data.totalUsers}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Messages Today</h3>
          <p className="text-3xl font-bold text-yellow-400">{data.messagesToday}</p>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">System Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Uptime</p>
            <p className="text-white font-medium">{formatUptime(data.uptime)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Status</p>
            <p className="text-green-400 font-medium">● Online</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Recent Activity</h3>
        {data.recentActivity.length === 0 ? (
          <p className="text-gray-400">No recent activity</p>
        ) : (
          <ul className="space-y-2">
            {data.recentActivity.map((activity, index) => (
              <li key={index} className="text-gray-300">
                {activity}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
