import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConfigChange {
  description: string;
  preview: string;
}

interface AIChatProps {
  onConfigApplied?: () => void;
}

function AIChat({ onConfigApplied }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingChange, setPendingChange] = useState<ConfigChange | null>(null);
  const [applyingChange, setApplyingChange] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load conversation history on mount
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await api.getConfigHistory();
      const history: Message[] = response.history.map((msg: any) => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(),
      }));
      setMessages(history);
    } catch (err) {
      // Ignore errors loading history
      console.error('Failed to load history:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');
    setPendingChange(null);

    try {
      const response = await api.chatWithConfigAssistant(userMessage.content);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.change) {
        setPendingChange(response.change);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChange = async () => {
    if (!pendingChange) return;

    setApplyingChange(true);
    setError('');

    try {
      const result = await api.applyConfigChange(pendingChange);

      let confirmContent = '✅ Configuration changes applied successfully!';
      
      if (result.requiresRestart) {
        confirmContent += '\n\n⚠️ Note: Server restart required for these changes to take effect.';
      } else {
        confirmContent += ' The changes are now active.';
      }

      const confirmMessage: Message = {
        role: 'assistant',
        content: confirmContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, confirmMessage]);
      setPendingChange(null);

      // Notify parent component
      if (onConfigApplied) {
        onConfigApplied();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply changes');
    } finally {
      setApplyingChange(false);
    }
  };

  const handleRejectChange = () => {
    setPendingChange(null);

    const rejectMessage: Message = {
      role: 'assistant',
      content: 'Changes rejected. What else would you like to configure?',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, rejectMessage]);
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the conversation? This will clear all chat history.')) {
      return;
    }

    try {
      await api.resetConfigConversation();
      setMessages([]);
      setPendingChange(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset conversation');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-cyan-400">AI Configuration Assistant</h3>
          <p className="text-sm text-gray-400">Configure your BBS through natural language</p>
        </div>
        <button
          onClick={handleReset}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
        >
          Reset Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="mb-4">👋 Hi! I'm your AI Configuration Assistant.</p>
            <p className="mb-4">I can help you configure your BBS settings through conversation.</p>
            <p className="text-sm">Try asking me to:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Change the BBS name or tagline</li>
              <li>• Update AI SysOp settings</li>
              <li>• Add or modify message bases</li>
              <li>• Adjust security settings</li>
            </ul>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-cyan-900 text-cyan-100'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <div className="text-xs text-gray-400 mb-1">
                {msg.role === 'user' ? 'You' : 'AI Assistant'}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2">
              <div className="text-xs text-gray-400 mb-1">AI Assistant</div>
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Change Preview */}
      {pendingChange && (
        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
          <div className="bg-yellow-900/30 border border-yellow-700 rounded p-4">
            <h4 className="font-bold text-yellow-300 mb-2">📋 Proposed Changes</h4>
            <p className="text-sm text-yellow-200 mb-2">{pendingChange.description}</p>
            <pre className="text-xs bg-gray-800 p-3 rounded overflow-x-auto text-gray-300 mb-3">
              {pendingChange.preview}
            </pre>
            <div className="flex space-x-2">
              <button
                onClick={handleApplyChange}
                disabled={applyingChange}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applyingChange ? 'Applying...' : '✓ Apply Changes'}
              </button>
              <button
                onClick={handleRejectChange}
                disabled={applyingChange}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✗ Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 border-t border-gray-700">
          <div className="bg-red-900/50 border border-red-500 rounded px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to configure something..."
            disabled={loading}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

export default AIChat;
