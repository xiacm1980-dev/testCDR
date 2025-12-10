import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, Video, Music, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle, Play, File as FileIcon } from 'lucide-react';
import { SanitizationTask, ProcessingStatus, FileType } from '../types';
import { analyzeFileContent } from '../services/geminiService';

const MOCK_PROCESSING_STEPS: Record<FileType, string[]> = {
  [FileType.DOCUMENT]: ['Stripping Macros', 'Flattening OLE Objects', 'Converting to PDF'],
  [FileType.IMAGE]: ['Rotating 90° (1/4)', 'Rotating 90° (2/4)', 'Rotating 90° (3/4)', 'Rotating 90° (4/4)', 'Sharpening Image', 'Resizing to 95%', 'Converting to PNG'],
  [FileType.VIDEO]: ['Decoding H264 -> YUV', 'Compressing Frame Rate', 'Injecting White Noise', 'Re-encoding to H264/MP4'],
  [FileType.AUDIO]: ['Decoding Stream', 'Injecting White Noise', 'Re-encoding to MP3'],
  [FileType.UNKNOWN]: ['Binary Analysis', 'Sanitization Failed']
};

export const FileSanitization: React.FC = () => {
  const [tasks, setTasks] = useState<SanitizationTask[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): FileType => {
    if (file.type.startsWith('image/')) return FileType.IMAGE;
    if (file.type.startsWith('video/')) return FileType.VIDEO;
    if (file.type.startsWith('audio/')) return FileType.AUDIO;
    if (file.name.match(/\.(doc|docx|xls|xlsx|ppt|pptx|pdf|txt)$/i)) return FileType.DOCUMENT;
    return FileType.UNKNOWN;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newTasks: SanitizationTask[] = Array.from(e.target.files).map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      filename: file.name,
      originalSize: file.size,
      type: getFileType(file),
      status: ProcessingStatus.PENDING,
      progress: 0,
      timestamp: Date.now()
    }));

    setTasks(prev => [...newTasks, ...prev]);

    // Process each file
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      const task = newTasks[i];
      processFile(task, file);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (task: SanitizationTask, file: File) => {
    const updateTask = (updates: Partial<SanitizationTask>) => {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
    };

    try {
      // 1. Uploading
      updateTask({ status: ProcessingStatus.UPLOADING, progress: 10 });
      await new Promise(r => setTimeout(r, 800));

      // 2. Gemini Analysis (for images/text) - Simulate "Deep Inspection"
      updateTask({ status: ProcessingStatus.ANALYZING, progress: 30 });
      
      let analysisResult = "Skipped for large media file.";
      if (file.size < 4000000 && (task.type === FileType.IMAGE || task.type === FileType.DOCUMENT)) {
         const reader = new FileReader();
         reader.readAsDataURL(file);
         await new Promise(resolve => {
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                // Only analyze if small enough to not block UI too much
                const result = await analyzeFileContent(file.name, base64, file.type);
                analysisResult = result;
                resolve(true);
            }
         });
      } else {
        await new Promise(r => setTimeout(r, 1000)); // Mock delay for video
      }
      
      updateTask({ 
        threatAnalysis: analysisResult, 
        status: ProcessingStatus.SANITIZING, 
        progress: 50 
      });

      // 3. Mock C++ Backend Processing
      const steps = MOCK_PROCESSING_STEPS[task.type];
      const stepDuration = 3000 / steps.length;
      
      for (let i = 0; i < steps.length; i++) {
        updateTask({ 
          sanitizationDetails: steps.slice(0, i + 1),
          progress: 50 + ((i + 1) / steps.length) * 40
        });
        await new Promise(r => setTimeout(r, stepDuration));
      }

      // 4. Complete
      updateTask({ status: ProcessingStatus.COMPLETED, progress: 100 });

    } catch (error) {
      updateTask({ status: ProcessingStatus.FAILED, progress: 0 });
    }
  };

  const getIcon = (type: FileType) => {
    switch (type) {
      case FileType.DOCUMENT: return <FileText className="w-5 h-5 text-blue-500" />;
      case FileType.IMAGE: return <ImageIcon className="w-5 h-5 text-purple-500" />;
      case FileType.VIDEO: return <Video className="w-5 h-5 text-red-500" />;
      case FileType.AUDIO: return <Music className="w-5 h-5 text-amber-500" />;
      default: return <FileIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <ShieldCheck className="w-6 h-6 mr-2 text-indigo-600" />
          Deep Content Disarm & Reconstruction
        </h2>
        
        <div 
          className="border-2 border-dashed border-slate-300 rounded-lg p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-4 bg-indigo-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-lg font-medium text-slate-700">Drop files here or click to upload</p>
          <p className="text-sm text-slate-500 mt-2 text-center max-w-md">
            Supports DOCX, PDF, JPG, PNG, MP4, MP3. <br/>
            <span className="text-xs text-slate-400">Files will be processed by the C++ Engine (Simulated).</span>
          </p>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            multiple 
            onChange={handleFileUpload}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  {getIcon(task.type)}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{task.filename}</h3>
                  <div className="flex items-center space-x-3 text-sm text-slate-500">
                    <span>{formatSize(task.originalSize)}</span>
                    <span>•</span>
                    <span className={`uppercase text-xs font-bold ${
                      task.status === ProcessingStatus.COMPLETED ? 'text-green-600' :
                      task.status === ProcessingStatus.FAILED ? 'text-red-600' :
                      'text-indigo-600'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 w-1/3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      task.status === ProcessingStatus.COMPLETED ? 'bg-green-500' :
                      task.status === ProcessingStatus.FAILED ? 'bg-red-500' :
                      'bg-indigo-500 relative overflow-hidden'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  >
                     {task.status !== ProcessingStatus.COMPLETED && task.status !== ProcessingStatus.FAILED && (
                       <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]"></div>
                     )}
                  </div>
                </div>
                <span className="text-sm font-medium w-12 text-right">{Math.round(task.progress)}%</span>
              </div>
            </div>

            {/* Expanded Details Panel */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Steps Log */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2 flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2" /> Pipeline Steps
                  </h4>
                  <ul className="space-y-1">
                    {task.sanitizationDetails?.map((step, idx) => (
                      <li key={idx} className="flex items-center text-slate-600">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        {step}
                      </li>
                    ))}
                    {task.status === ProcessingStatus.SANITIZING && (
                      <li className="flex items-center text-indigo-600 animate-pulse">
                        <span className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mr-2"></span>
                        Processing...
                      </li>
                    )}
                  </ul>
                </div>

                {/* AI Analysis */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> 
                    Threat Surface Analysis (Gemini)
                  </h4>
                  <div className="bg-white p-3 rounded border border-slate-200 h-24 overflow-y-auto text-slate-600 italic">
                    {task.threatAnalysis ? task.threatAnalysis : "Waiting for analysis..."}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No active tasks. Upload a file to begin the CDR pipeline.
          </div>
        )}
      </div>
    </div>
  );
};