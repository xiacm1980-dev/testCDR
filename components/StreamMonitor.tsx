import React, { useState } from 'react';
import { Video, Radio, Activity, Settings, Plus, PlayCircle, StopCircle, Trash2 } from 'lucide-react';
import { StreamConfig } from '../types';

export const StreamMonitor: React.FC = () => {
  const [streams, setStreams] = useState<StreamConfig[]>([
    {
      id: '1',
      name: 'Main Entrance - ONVIF',
      protocol: 'ONVIF',
      sourceUrl: 'rtsp://192.168.1.10:554/stream1',
      targetPort: 8080,
      status: 'ACTIVE',
      codec: 'H264',
      noiseLevel: 'LOW',
      fpsCompression: true
    },
    {
      id: '2',
      name: 'Perimeter GB/T',
      protocol: 'GB28181',
      sourceUrl: 'gb28181://34020000001320000001',
      targetPort: 8081,
      status: 'STOPPED',
      codec: 'H264',
      noiseLevel: 'MEDIUM',
      fpsCompression: true
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStream, setNewStream] = useState<Partial<StreamConfig>>({
    protocol: 'ONVIF',
    codec: 'H264',
    noiseLevel: 'LOW',
    fpsCompression: true
  });

  const toggleStatus = (id: string) => {
    setStreams(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'ACTIVE' ? 'STOPPED' : 'ACTIVE' };
      }
      return s;
    }));
  };

  const deleteStream = (id: string) => {
    setStreams(prev => prev.filter(s => s.id !== id));
  };

  const handleAddStream = () => {
    if (!newStream.name || !newStream.sourceUrl || !newStream.targetPort) return;
    
    setStreams(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      name: newStream.name!,
      protocol: newStream.protocol as 'ONVIF' | 'GB28181',
      sourceUrl: newStream.sourceUrl!,
      targetPort: Number(newStream.targetPort),
      status: 'STOPPED',
      codec: 'H264',
      noiseLevel: newStream.noiseLevel as any,
      fpsCompression: !!newStream.fpsCompression
    }]);
    setIsModalOpen(false);
    setNewStream({ protocol: 'ONVIF', codec: 'H264', noiseLevel: 'LOW', fpsCompression: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Video Stream Proxies</h2>
          <p className="text-slate-500">Real-time H264 decode, noise injection, and re-encode pipeline.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Stream
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {streams.map(stream => (
          <div key={stream.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
            <div className={`h-2 w-full ${stream.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`} />
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${stream.status === 'ACTIVE' ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <Video className={`w-6 h-6 ${stream.status === 'ACTIVE' ? 'text-green-600' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{stream.name}</h3>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{stream.protocol}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                   <button 
                    onClick={() => toggleStatus(stream.id)}
                    className={`p-2 rounded-full transition-colors ${
                      stream.status === 'ACTIVE' 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {stream.status === 'ACTIVE' ? <StopCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => deleteStream(stream.id)}
                    className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Source</span>
                  <span className="font-mono text-slate-700 truncate max-w-[200px]" title={stream.sourceUrl}>{stream.sourceUrl}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Target Port</span>
                  <span className="font-mono text-slate-700">{stream.targetPort}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Pipeline Config</span>
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-50 text-indigo-700 px-2 rounded text-xs">Dec: H264(YUV)</span>
                    <span className="bg-amber-50 text-amber-700 px-2 rounded text-xs">Noise: {stream.noiseLevel}</span>
                  </div>
                </div>
              </div>

              {stream.status === 'ACTIVE' && (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="flex items-center"><Activity className="w-3 h-3 mr-1" /> Bandwidth</span>
                    <span>2.4 Mbps</span>
                  </div>
                  {/* Fake visualization graph */}
                  <div className="flex items-end h-16 space-x-1">
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-indigo-100 rounded-t-sm transition-all duration-500"
                        style={{ height: `${20 + Math.random() * 80}%` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Stream Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Configure New Secure Stream</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stream Name</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newStream.name || ''}
                  onChange={e => setNewStream({...newStream, name: e.target.value})}
                  placeholder="e.g. Lobby Camera"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Protocol</label>
                   <select 
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={newStream.protocol}
                    onChange={e => setNewStream({...newStream, protocol: e.target.value as any})}
                   >
                     <option value="ONVIF">ONVIF</option>
                     <option value="GB28181">GB/T 28181</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Output Port</label>
                   <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={newStream.targetPort || ''}
                    onChange={e => setNewStream({...newStream, targetPort: Number(e.target.value)})}
                    placeholder="808X"
                   />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source URL</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newStream.sourceUrl || ''}
                  onChange={e => setNewStream({...newStream, sourceUrl: e.target.value})}
                  placeholder="rtsp://..."
                />
              </div>
              
              <div className="border-t border-slate-200 pt-4 mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">CDR Parameters</label>
                <div className="flex items-center space-x-4 text-sm">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={newStream.fpsCompression}
                      onChange={e => setNewStream({...newStream, fpsCompression: e.target.checked})}
                      className="mr-2"
                    />
                    Compress FPS
                  </label>
                  <label className="flex items-center">
                    <span className="mr-2 text-slate-600">Noise:</span>
                    <select 
                      value={newStream.noiseLevel}
                      onChange={e => setNewStream({...newStream, noiseLevel: e.target.value as any})}
                      className="border border-slate-300 rounded p-1 text-xs"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddStream}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create Stream
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};