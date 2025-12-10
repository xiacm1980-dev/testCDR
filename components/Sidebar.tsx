import React from 'react';
import { Shield, FileText, Video, Server, Settings, Terminal } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const NavItem = ({ view, icon, label }: { view: ViewState; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => setView(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        currentView === view 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className={currentView === view ? 'text-white' : 'text-slate-400 group-hover:text-white'}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col border-r border-slate-800 flex-shrink-0 sticky top-0">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">AEGIS CDR</h1>
          <p className="text-slate-500 text-xs font-mono">v2.4.0 (Linux)</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold text-slate-500 uppercase px-4 py-2 mt-2">Core Services</div>
        <NavItem view="FILES" icon={<FileText className="w-5 h-5" />} label="File Sanitization" />
        <NavItem view="STREAMS" icon={<Video className="w-5 h-5" />} label="Stream Proxies" />
        
        <div className="text-xs font-bold text-slate-500 uppercase px-4 py-2 mt-6">System</div>
        <NavItem view="LOGS" icon={<Server className="w-5 h-5" />} label="System Logs" />
        <NavItem view="SETTINGS" icon={<Settings className="w-5 h-5" />} label="Configuration" />
        <NavItem view="DASHBOARD" icon={<Terminal className="w-5 h-5" />} label="API Status" />
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">System Load</span>
            <span className="text-xs text-green-400">Normal</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full w-[24%]"></div>
          </div>
          <div className="flex items-center justify-between mt-3 mb-1">
            <span className="text-xs text-slate-400">Memory</span>
            <span className="text-xs text-indigo-400">1.2GB / 8GB</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-[15%]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};