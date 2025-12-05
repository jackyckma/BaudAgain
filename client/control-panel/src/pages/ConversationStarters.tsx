import { useEffect, useState } from 'react';
// Backend API base URL
const API_BASE_URL = 'http://localhost:8080';

interface Question {
  id: string;
  messageBaseId: string;
  messageBaseName: string;
  question: string;
  style: string;
  generatedAt: string;
  postedAt?: string;
  messageId?: string;
  engagementMetrics?: {
    views: number;
    replies: number;
    uniqueRepliers: number;
  };
}

interface TaskStatus {
  configured: boolean;
  enabled: boolean;
  schedule?: string;
  lastRun?: string;
  nextRun?: string;
}

interface Stats {
  totalQuestions: number;
  totalReplies: number;
  averageRepliesPerQuestion: number;
  mostEngagingStyle: string;
}

interface DailyQuestionConfig {
  enabled: boolean;
  schedule: string;
  targetMessageBaseId: string | null;
  questionStyle: 'auto' | 'open-ended' | 'opinion' | 'creative' | 'technical' | 'fun';
  aiPersonality: string | null;
}

function ConversationStarters() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [config, setConfig] = useState<DailyQuestionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [questionsData, statusData, statsData, configData] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/conversation-starters?limit=20`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/v1/conversation-starters/task/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/v1/conversation-starters/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/v1/conversation-starters/config`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        }).then(r => r.json()),
      ]);

      if (questionsData.success) {
        setQuestions(questionsData.questions || []);
      }
      if (statusData.success) {
        setTaskStatus(statusData);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
      if (configData.success) {
        setConfig(configData.config);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNow = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/conversation-starters/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        await loadData();
        setError('');
      } else {
        setError(data.message || 'Failed to generate question');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate question');
    } finally {
      setGenerating(false);
    }
  };

  const handleTriggerTask = async () => {
    setTriggering(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/conversation-starters/task/trigger`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        await loadData();
        setError('');
      } else {
        setError(data.message || 'Failed to trigger task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger task');
    } finally {
      setTriggering(false);
    }
  };

  const handleToggleTask = async (enable: boolean) => {
    try {
      const endpoint = enable ? 'enable' : 'disable';
      const response = await fetch(`${API_BASE_URL}/api/v1/conversation-starters/task/${endpoint}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        await loadData();
        setError('');
      } else {
        setError(data.message || `Failed to ${endpoint} task`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStyleColor = (style: string) => {
    const colors: Record<string, string> = {
      'open-ended': 'text-blue-400',
      'opinion': 'text-purple-400',
      'creative': 'text-pink-400',
      'technical': 'text-green-400',
      'fun': 'text-yellow-400',
      'auto': 'text-gray-400',
    };
    return colors[style] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading conversation starters...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-cyan-400 mb-6">Conversation Starters</h2>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded px-4 py-3 text-red-200 mb-6">
          {error}
        </div>
      )}

      {/* Task Status Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Scheduled Task</h3>
        
        {taskStatus?.configured ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p className={`font-medium ${taskStatus.enabled ? 'text-green-400' : 'text-red-400'}`}>
                  {taskStatus.enabled ? '● Enabled' : '○ Disabled'}
                </p>
              </div>
              {taskStatus.schedule && (
                <div>
                  <p className="text-gray-400 text-sm">Schedule</p>
                  <p className="text-white font-medium">{taskStatus.schedule} daily</p>
                </div>
              )}
              {taskStatus.lastRun && (
                <div>
                  <p className="text-gray-400 text-sm">Last Run</p>
                  <p className="text-white font-medium">{formatDate(taskStatus.lastRun)}</p>
                </div>
              )}
              {taskStatus.nextRun && (
                <div>
                  <p className="text-gray-400 text-sm">Next Run</p>
                  <p className="text-white font-medium">{formatDate(taskStatus.nextRun)}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggleTask(!taskStatus.enabled)}
                className={`px-4 py-2 rounded ${
                  taskStatus.enabled
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white transition-colors`}
              >
                {taskStatus.enabled ? 'Disable' : 'Enable'} Task
              </button>
              <button
                onClick={handleTriggerTask}
                disabled={triggering}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {triggering ? 'Triggering...' : 'Trigger Now'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">
            Daily question task is not configured. Enable it in config.yaml.
          </p>
        )}
      </div>

      {/* Stats Card */}
      {stats && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h3 className="text-xl font-bold text-cyan-400 mb-4">Engagement Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Total Questions</p>
              <p className="text-3xl font-bold text-cyan-400">{stats.totalQuestions}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Replies</p>
              <p className="text-3xl font-bold text-green-400">{stats.totalReplies}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg Replies/Question</p>
              <p className="text-3xl font-bold text-yellow-400">
                {stats.averageRepliesPerQuestion.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Most Engaging Style</p>
              <p className={`text-2xl font-bold ${getStyleColor(stats.mostEngagingStyle)}`}>
                {stats.mostEngagingStyle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      {config && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-cyan-400">Configuration</h3>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {showConfig ? '▼ Hide' : '▶ Show'}
            </button>
          </div>

          {showConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Schedule</p>
                  <p className="text-white">{config.schedule} daily</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Question Style</p>
                  <p className={`${getStyleColor(config.questionStyle)}`}>
                    {config.questionStyle}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Target Message Base</p>
                  <p className="text-white">
                    {config.targetMessageBaseId || 'Auto (first available)'}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                💡 To modify these settings, edit the <code className="bg-gray-900 px-2 py-1 rounded">config.yaml</code> file and restart the server.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Generation */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Manual Generation</h3>
        <p className="text-gray-300 mb-4">
          Generate and post a question immediately without waiting for the scheduled time.
        </p>
        <button
          onClick={handleGenerateNow}
          disabled={generating}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors disabled:opacity-50"
        >
          {generating ? 'Generating...' : '✨ Generate Question Now'}
        </button>
      </div>

      {/* Question History */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Question History</h3>
        
        {questions.length === 0 ? (
          <p className="text-gray-400">No questions generated yet.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="bg-gray-900 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">{question.question}</p>
                    <p className="text-gray-400 text-sm">
                      {question.messageBaseName} • {formatDate(question.generatedAt)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStyleColor(question.style)}`}>
                    {question.style}
                  </span>
                </div>

                {question.engagementMetrics && (
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-gray-400">
                      💬 {question.engagementMetrics.replies} replies
                    </span>
                    <span className="text-gray-400">
                      👥 {question.engagementMetrics.uniqueRepliers} participants
                    </span>
                  </div>
                )}

                {question.postedAt && (
                  <p className="text-gray-500 text-xs mt-2">
                    Posted: {formatDate(question.postedAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationStarters;
