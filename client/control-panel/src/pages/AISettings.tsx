function AISettings() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-cyan-400 mb-6">AI Settings</h2>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">AI SysOp Configuration</h3>
        <p className="text-gray-400 mb-4">Configure the AI-powered system operator</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Provider
            </label>
            <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100">
              <option>Anthropic Claude</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Model
            </label>
            <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100">
              <option>claude-3-5-haiku-20241022</option>
              <option>claude-3-5-sonnet-20241022</option>
            </select>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="form-checkbox" defaultChecked />
              <span className="text-gray-300">Enable AI SysOp</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="form-checkbox" defaultChecked />
              <span className="text-gray-300">Welcome new users</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">AI Configuration Assistant</h3>
        <p className="text-gray-400">Chat with the AI to configure your BBS settings (coming soon)</p>
      </div>
    </div>
  );
}

export default AISettings;
