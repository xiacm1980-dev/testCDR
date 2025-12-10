
import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, Download, Trash } from 'lucide-react';
import { LogEntry } from '../types';
import { LogService } from '../services/logService';

export const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshLogs = () => {
    setLogs(LogService.getLogs());
  };

  useEffect(() => {
    // Initial load
    refreshLogs();
    
    // Listen for log updates
    const handleUpdate = () => refreshLogs();
    window.addEventListener('log-update', handleUpdate);
    
    // Fallback polling to ensure consistency
    const interval = setInterval(refreshLogs, 2000);
    
    return () => {
        window.removeEventListener('log-update', handleUpdate);
        clearInterval(interval);
    };
  }, []);

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear the system audit log? This cannot be undone.')) {
        LogService.clearLogs();
    }
  };

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)]">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <Database className="w-5 h-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-bold text-slate-800">System Logs (Persistent SQLite)</h2>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search audit trail..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
            />
          </div>
          <button 
            onClick={handleClearLogs}
            className="p-2 border border-slate-300 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600" 
            title="Clear Logs"
          >
            <Trash className="w-4 h-4" />
          </button>
          <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-0 scrollbar-hide">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-3 border-b border-slate-200">Timestamp</th>
              <th className="px-6 py-3 border-b border-slate-200">Level</th>
              <th className="px-6 py-3 border-b border-slate-200">Module</th>
              <th className="px-6 py-3 border-b border-slate-200 w-full">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length > 0 ? filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors font-mono">
                <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    log.level === 'INFO' ? 'bg-blue-100 text-blue-700' :
                    log.level === 'WARN' ? 'bg-amber-100 text-amber-700' :
                    log.level === 'ERROR' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {log.level}
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-700 font-bold">{log.module}</td>
                <td className="px-6 py-3 text-slate-600 break-all">{log.message}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  {logs.length === 0 ? "No logs found in persistent storage." : "No logs match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
