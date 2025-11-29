import { useEffect, useState } from 'react';
import { api, type MessageBase, type CreateMessageBaseData } from '../services/api';

function MessageBases() {
  const [bases, setBases] = useState<MessageBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBase, setEditingBase] = useState<MessageBase | null>(null);
  const [formData, setFormData] = useState<CreateMessageBaseData>({
    name: '',
    description: '',
    accessLevelRead: 0,
    accessLevelWrite: 10,
    sortOrder: 0,
  });

  useEffect(() => {
    loadBases();
  }, []);

  const loadBases = async () => {
    try {
      const basesData = await api.getMessageBases();
      setBases(basesData.sort((a, b) => a.sortOrder - b.sortOrder));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load message bases');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMessageBase(formData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        accessLevelRead: 0,
        accessLevelWrite: 10,
        sortOrder: 0,
      });
      await loadBases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create message base');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBase) return;
    
    try {
      await api.updateMessageBase(editingBase.id, formData);
      setEditingBase(null);
      setFormData({
        name: '',
        description: '',
        accessLevelRead: 0,
        accessLevelWrite: 10,
        sortOrder: 0,
      });
      await loadBases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message base');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message base? This cannot be undone.')) {
      return;
    }
    
    try {
      await api.deleteMessageBase(id);
      await loadBases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message base');
    }
  };

  const startEdit = (base: MessageBase) => {
    setEditingBase(base);
    setFormData({
      name: base.name,
      description: base.description || '',
      accessLevelRead: base.accessLevelRead,
      accessLevelWrite: base.accessLevelWrite,
      sortOrder: base.sortOrder,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingBase(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      description: '',
      accessLevelRead: 0,
      accessLevelWrite: 10,
      sortOrder: 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading message bases...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-cyan-400">Message Bases</h2>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingBase(null);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded transition-colors"
        >
          Create New Base
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded px-4 py-3 text-red-200 mb-4">
          {error}
        </div>
      )}

      {(showCreateForm || editingBase) && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-xl font-bold text-cyan-400 mb-4">
            {editingBase ? 'Edit Message Base' : 'Create New Message Base'}
          </h3>
          <form onSubmit={editingBase ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Read Access Level
                </label>
                <input
                  type="number"
                  value={formData.accessLevelRead}
                  onChange={(e) => setFormData({ ...formData, accessLevelRead: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
                  min="0"
                  max="255"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Write Access Level
                </label>
                <input
                  type="number"
                  value={formData.accessLevelWrite}
                  onChange={(e) => setFormData({ ...formData, accessLevelWrite: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
                  min="0"
                  max="255"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded transition-colors"
              >
                {editingBase ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Posts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Read/Write
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {bases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                  No message bases yet. Create one to get started!
                </td>
              </tr>
            ) : (
              bases.map((base) => (
                <tr key={base.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-white font-medium">{base.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300">{base.description || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {base.postCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {base.accessLevelRead} / {base.accessLevelWrite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => startEdit(base)}
                      className="text-cyan-400 hover:text-cyan-300 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(base.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MessageBases;
