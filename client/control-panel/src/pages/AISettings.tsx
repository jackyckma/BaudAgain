import { useEffect, useState } from 'react';
import { api, type AISettings as AISettingsType } from '../services/api';

function AISettings() {
  const [settings, setSettings] = useState<AISettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getAISettings();
      setSettings(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading AI settings...</p>
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

  if (!settings) {
    return (
      <div className="bg-yellow-900/50 border border-yellow-500 rounded px-4 py-3 text-yellow-200">
        No AI settings available
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-cyan-400 mb-6">AI Settings</h2>

      {/* Provider & Model Info */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">AI Provider Configuration</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provider
            </label>
            <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100">
              {settings.provider === 'anthropic' ? 'Anthropic Claude' : settings.provider}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Model
            </label>
            <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100">
              {settings.model}
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded">
          <p className="text-sm text-blue-200">
            <strong>Note:</strong> AI provider and model are configured in <code className="bg-gray-700 px-2 py-1 rounded">config.yaml</code>.
            Changes require server restart.
          </p>
        </div>
      </div>

      {/* AI SysOp Settings */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">AI SysOp Configuration</h3>
        <p className="text-gray-400 mb-4">Configure the AI-powered system operator</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded">
            <div>
              <div className="font-medium text-gray-200">Enable AI SysOp</div>
              <div className="text-sm text-gray-400">Allow AI to welcome users and provide assistance</div>
            </div>
            <div className={`px-3 py-1 rounded ${settings.sysop.enabled ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>
              {settings.sysop.enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded">
            <div>
              <div className="font-medium text-gray-200">Welcome New Users</div>
              <div className="text-sm text-gray-400">Generate personalized welcome messages for new registrations</div>
            </div>
            <div className={`px-3 py-1 rounded ${settings.sysop.welcomeNewUsers ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>
              {settings.sysop.welcomeNewUsers ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded">
            <div>
              <div className="font-medium text-gray-200">Participate in Chat</div>
              <div className="text-sm text-gray-400">Allow AI to respond to user pages</div>
            </div>
            <div className={`px-3 py-1 rounded ${settings.sysop.participateInChat ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>
              {settings.sysop.participateInChat ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className="p-4 bg-gray-700/50 rounded">
            <div className="font-medium text-gray-200 mb-2">Chat Frequency</div>
            <div className="text-sm text-gray-400 mb-2">How often the AI SysOp responds</div>
            <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100">
              {settings.sysop.chatFrequency}
            </div>
          </div>

          <div className="p-4 bg-gray-700/50 rounded">
            <div className="font-medium text-gray-200 mb-2">Personality</div>
            <div className="text-sm text-gray-400 mb-2">AI SysOp personality prompt</div>
            <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
              {settings.sysop.personality}
            </div>
          </div>
        </div>
      </div>

      {/* Door Games AI Settings */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Door Games AI Configuration</h3>
        <p className="text-gray-400 mb-4">Configure AI for door games like The Oracle</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded">
            <div>
              <div className="font-medium text-gray-200">Enable AI Doors</div>
              <div className="text-sm text-gray-400">Allow AI-powered door games</div>
            </div>
            <div className={`px-3 py-1 rounded ${settings.doors.enabled ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>
              {settings.doors.enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className="p-4 bg-gray-700/50 rounded">
            <div className="font-medium text-gray-200 mb-2">Max Tokens Per Turn</div>
            <div className="text-sm text-gray-400 mb-2">Maximum response length for door games</div>
            <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100">
              {settings.doors.maxTokensPerTurn} tokens
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Note */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Configuration Management</h3>
        <div className="space-y-3 text-gray-300">
          <p>
            AI settings are currently read-only and configured in <code className="bg-gray-700 px-2 py-1 rounded">config.yaml</code>.
          </p>
          <p>
            To modify these settings:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Edit the <code className="bg-gray-700 px-2 py-1 rounded">config.yaml</code> file in your BBS directory</li>
            <li>Restart the BBS server to apply changes</li>
            <li>Refresh this page to see updated settings</li>
          </ol>
          <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700 rounded">
            <p className="text-sm text-yellow-200">
              <strong>Future Enhancement:</strong> The AI Configuration Assistant will allow you to modify these settings
              through a conversational interface without editing files directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AISettings;
