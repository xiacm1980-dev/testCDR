
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { FileSanitization } from './components/FileSanitization';
import { StreamMonitor } from './components/StreamMonitor';
import { SystemLogs } from './components/SystemLogs';
import { ViewState } from './types';
import { LogService } from './services/logService';
import { Bell, User, CheckCircle, Code } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('FILES');
  
  // Settings State
  const [rotationPolicy, setRotationPolicy] = useState('4');
  const [resizePolicy, setResizePolicy] = useState('95');

  const handleSettingChange = (setting: string, value: string) => {
    LogService.addLog('SYSTEM', 'INFO', `Global configuration updated: ${setting} changed to ${value}`);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'FILES': return <FileSanitization />;
      case 'STREAMS': return <StreamMonitor />;
      case 'LOGS': return <SystemLogs />;
      case 'DASHBOARD': 
        return (
          <div className="bg-white p-8 rounded-xl border border-slate-200">
            <h2 className="text-2xl font-bold mb-4 flex items-center"><Code className="w-6 h-6 mr-2 text-indigo-600"/> API Documentation</h2>
            <p className="mb-6 text-slate-600">
              The Aegis CDR System exposes a RESTful API for integration. The backend service runs on C++ and handles heavy lifting.
            </p>
            <div className="bg-slate-900 rounded-lg p-6 font-mono text-sm text-slate-300 overflow-x-auto">
              <p className="text-green-400 mb-2"># Synchronous File Clean</p>
              <p className="mb-4">POST /api/v1/clean/sync</p>
              
              <p className="text-green-400 mb-2"># Asynchronous File Clean (Task ID returned)</p>
              <p className="mb-4">POST /api/v1/clean/async</p>
              
              <p className="text-green-400 mb-2"># Check Task Status</p>
              <p className="mb-4">GET /api/v1/task/{`{task_id}`}</p>

              <p className="text-green-400 mb-2"># Video Stream Control</p>
              <p>POST /api/v1/streams/config</p>
            </div>
          </div>
        );
      case 'SETTINGS':
        return (
           <div className="bg-white p-8 rounded-xl border border-slate-200">
             <h2 className="text-2xl font-bold mb-6">Global Configuration</h2>
             <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Image Processing Policy</h3>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                    <label className="flex items-center justify-between">
                       <span className="text-slate-600">Rotation Iterations</span>
                       <select 
                         className="border border-slate-300 rounded px-2 py-1 bg-white"
                         value={rotationPolicy}
                         onChange={(e) => {
                           setRotationPolicy(e.target.value);
                           handleSettingChange('ImageRotation', e.target.value);
                         }}
                       >
                         <option value="1">1 (90°)</option>
                         <option value="2">2 (180°)</option>
                         <option value="4">4 (360° - Full Sanitization)</option>
                       </select>
                    </label>
                    <label className="flex items-center justify-between">
                       <span className="text-slate-600">Resize Target</span>
                       <select 
                         className="border border-slate-300 rounded px-2 py-1 bg-white"
                         value={resizePolicy}
                         onChange={(e) => {
                           setResizePolicy(e.target.value);
                           handleSettingChange('ImageResize', e.target.value);
                         }}
                       >
                         <option value="100">100% (No resize)</option>
                         <option value="95">95% (Strip Metadata)</option>
                         <option value="90">90%</option>
                       </select>
                    </label>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Document Policy</h3>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                    <label className="flex items-center justify-between">
                       <span className="text-slate-600">Target Format</span>
                       <span className="text-slate-800 font-mono text-sm">PDF (Flattened)</span>
                    </label>
                    <label className="flex items-center justify-between">
                       <span className="text-slate-600">Macro Removal</span>
                       <span className="text-green-600 font-bold text-sm">FORCED</span>
                    </label>
                  </div>
                </div>
             </div>
           </div>
        );
      default: return <FileSanitization />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center text-slate-400 text-sm">
             <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
             <span>System Status: <strong className="text-green-600">Operational</strong></span>
             <span className="mx-3">|</span>
             <span>Backend: C++ Service (PID 4920)</span>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center space-x-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-700">Admin Console</p>
                <p className="text-xs text-slate-400">Security Officer</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center border border-slate-300">
                <User className="w-6 h-6 text-slate-500" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
