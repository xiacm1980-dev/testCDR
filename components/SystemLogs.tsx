import React from 'react';
import { Database, Search, Filter, Download } from 'lucide-react';
import { LogEntry } from '../types';

const MOCK_LOGS: LogEntry[] = [
  { id: '1', timestamp: '2023-10-27 10:42:12', level: 'INFO', module: 'SYSTEM', message: 'C++ Backend Service initialized (PID: 4302)' },
  { id: '2', timestamp: '2023-10-27 10:42:15', level: 'INFO', module: 'API', message: 'RESTful API listening on port 3000' },
  { id: '3', timestamp: '2023-10-27 10:45:00', level: 'INFO', module: 'STREAM', message: 'Stream [Main Entrance] connection established via ONVIF' },
  { id: '4', timestamp: '2023-10-27 10:51:22', level: 'SECURITY', module: 'ENGINE', message: 'Malicious macro detected in uploaded file "Annual_Report.doc". Macro stripped.' },
  { id: '5', timestamp: '2023-10-27 10:51:23', level: 'INFO', module: 'ENGINE', message: 'File "Annual_Report.doc" converted to PDF successfully.' },
  { id: '6', timestamp: '2023-10-27 11:05:01', level: 'WARN', module: 'STREAM', message: 'Frame drop detected on Stream [Perimeter GB/T]. Compressing FPS.' },
  { id: '7', timestamp: '2023-10-27 11:12:44', level: 'INFO', module: 'API', message: 'Async task #9923 status queried by client.' },
  { id: '8', timestamp: '2023-10-27 11:15:30', level: 'SECURITY', module: 'ENGINE', message: 'Steganography check passed for "profile_pic.jpg". Resized to 95%.' },
];

export const SystemLogs: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)]">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <Database className="w-5 h-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-bold text-slate-800">System Logs (SQLite)</h2>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50">
            <Filter className="w-4 h-4 text-slate-600" />
          </button>
          <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50">
            <Download className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-0">
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
            {MOCK_LOGS.map(log => (
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
                <td className="px-6 py-3 text-slate-600">{log.message}</td>
              </tr>
            ))}
            {/* Generate some filler logs to show scrolling */}
            {[...Array(10)].map((_, i) => (
               <tr key={`filler-${i}`} className="hover:bg-slate-50 transition-colors font-mono">
                <td className="px-6 py-3 text-slate-500 whitespace-nowrap">2023-10-27 09:{10 + i}:00</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">INFO</span>
                </td>
                <td className="px-6 py-3 text-slate-700 font-bold">SYSTEM</td>
                <td className="px-6 py-3 text-slate-600">Routine health check passed. Memory usage normal.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};