import { useEffect, useState } from 'react';
import { api, type User } from '../services/api';

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAccessLevel, setEditAccessLevel] = useState<number>(0);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const userData = await api.getUsers();
      setUsers(userData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditAccessLevel(user.accessLevel);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditAccessLevel(0);
  };

  const saveAccessLevel = async (userId: string) => {
    try {
      await api.updateUserAccessLevel(userId, editAccessLevel);
      setEditingUserId(null);
      await loadUsers();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access level');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading users...</p>
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

  return (
    <div>
      <h2 className="text-3xl font-bold text-cyan-400 mb-6">User Management</h2>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded px-4 py-3 text-red-200 mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Handle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Access Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Calls
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Posts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-white font-medium">{user.handle}</span>
                    {user.accessLevel >= 255 && (
                      <span className="ml-2 px-2 py-1 text-xs bg-cyan-900 text-cyan-300 rounded">
                        SysOp
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUserId === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editAccessLevel}
                        onChange={(e) => setEditAccessLevel(parseInt(e.target.value))}
                        className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100"
                        min="0"
                        max="255"
                      />
                    </div>
                  ) : (
                    <span className="text-gray-300">{user.accessLevel}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {user.totalCalls}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {user.totalPosts}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUserId === user.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveAccessLevel(user.id)}
                        className="text-green-400 hover:text-green-300"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(user)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      Edit Access
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Users;
