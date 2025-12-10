
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, Video, Music, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle, File as FileIcon, Download, History, Trash2 } from 'lucide-react';
import { SanitizationTask, ProcessingStatus, FileType, Language } from '../types';
import { analyzeFileContent } from '../services/geminiService';
import { LogService } from '../services/logService';
import { FileService } from '../services/fileService';
import { translations } from '../services/translations';

const MOCK_PROCESSING_STEPS: Record<FileType, string[]> = {
  [FileType.DOCUMENT]: ['Parsing Structure', 'Stripping Macros', 'Flattening OLE Objects', 'Rebuilding as PDF'],
  [FileType.IMAGE]: ['Stripping EXIF', 'Normalizing Colorspace', 'Re-encoding to PNG'],
  [FileType.VIDEO]: ['Decoding H264 -> YUV', 'Compressing Frame Rate', 'Injecting White Noise', 'Re-encoding to H264/MP4'],
  [FileType.AUDIO]: ['Decoding Stream', 'Injecting White Noise', 'Re-encoding to MP3'],
  [FileType.UNKNOWN]: ['Binary Analysis', 'Sanitization Failed']
};

interface FileSanitizationProps {
  lang: Language;
}

export const FileSanitization: React.FC<FileSanitizationProps> = ({ lang }) => {
  const [tasks, setTasks] = useState<SanitizationTask[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  // Load history on mount
  useEffect(() => {
    setTasks(FileService.getHistory());
  }, []);

  const getFileType = (file: File): FileType => {
    if (file.type.startsWith('image/')) return FileType.IMAGE;
    if (file.type.startsWith('video/')) return FileType.VIDEO;
    if (file.type.startsWith('audio/')) return FileType.AUDIO;
    if (file.name.match(/\.(doc|docx|xls|xlsx|ppt|pptx|pdf|txt)$/i)) return FileType.DOCUMENT;
    return FileType.UNKNOWN;
  };

  const getOutputFilename = (originalName: string, type: FileType): string => {
    const nameParts = originalName.split('.');
    const nameWithoutExt = nameParts.slice(0, -1).join('.') || originalName;
    
    switch (type) {
      case FileType.DOCUMENT: return `${nameWithoutExt}_safe.pdf`;
      case FileType.IMAGE: return `${nameWithoutExt}_safe.pdf`; // Images also wrapped in PDF for consistency if requested
      case FileType.VIDEO: return `${nameWithoutExt}_safe.mp4`;
      case FileType.AUDIO: return `${nameWithoutExt}_safe.mp3`;
      default: return `${nameWithoutExt}_report.txt`;
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
              const result = reader.result as string;
              // Remove "data:*/*;base64," prefix
              const base64 = result.split(',')[1];
              resolve(base64);
          };
          reader.onerror = error => reject(error);
          reader.readAsDataURL(file);
      });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    LogService.addLog('API', 'INFO', `POST /api/v1/clean/async - Batch upload started: ${e.target.files.length} files`);
    
    const newFileTasks: { task: SanitizationTask; file: File }[] = [];

    // Create tasks first
    for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const type = getFileType(file);
        
        let base64Data = undefined;
        // For documents and images, we try to read content for reconstruction
        if (type === FileType.DOCUMENT || type === FileType.IMAGE) {
            try {
                base64Data = await readFileAsBase64(file);
            } catch (err) {
                console.warn("Could not read file for preview", err);
            }
        }

        newFileTasks.push({
            file,
            task: {
                id: Math.random().toString(36).substr(2, 9),
                filename: file.name,
                originalSize: file.size,
                type: type,
                status: ProcessingStatus.PENDING,
                progress: 0,
                timestamp: Date.now(),
                base64Data: base64Data, // Store content for reconstruction
                mimeType: file.type || 'text/plain'
            }
        });
    }

    const newTasksList = newFileTasks.map(x => x.task);

    // Prepend new tasks to UI state
    setTasks(prev => [...newTasksList, ...prev]);

    // Process each file
    for (const item of newFileTasks) {
      // Save initial state to history (includes base64Data if small enough)
      FileService.saveTask(item.task);
      processFile(item.task, item.file);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (task: SanitizationTask, file: File) => {
    const updateTask = (updates: Partial<SanitizationTask>) => {
      setTasks(prev => {
        const newTasks = prev.map(t => t.id === task.id ? { ...t, ...updates } : t);
        return newTasks;
      });
      // Also update persistence
      const currentTask = tasks.find(t => t.id === task.id) || task;
      FileService.saveTask({ ...currentTask, ...updates });
    };

    LogService.addLog('ENGINE', 'INFO', `Task ${task.id}: Initializing CDR pipeline for "${task.filename}" (${task.type})`);

    try {
      // 1. Uploading
      updateTask({ status: ProcessingStatus.UPLOADING, progress: 10 });
      await new Promise(r => setTimeout(r, 800));

      // 2. Gemini Analysis
      updateTask({ status: ProcessingStatus.ANALYZING, progress: 30 });
      let analysisResult = "Analysis skipped for large media file.";
      
      if (task.base64Data && file.size < 4000000 && (task.type === FileType.IMAGE || task.type === FileType.DOCUMENT)) {
         // We already have base64Data from the upload step
         analysisResult = await analyzeFileContent(file.name, task.base64Data, file.type);
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
      
      updateTask({ 
        threatAnalysis: analysisResult, 
        status: ProcessingStatus.SANITIZING, 
        progress: 50 
      });

      // 3. Mock C++ Backend Processing
      const steps = MOCK_PROCESSING_STEPS[task.type];
      LogService.addLog('ENGINE', 'INFO', `Task ${task.id}: Starting reconstruction sequence: ${steps.join(', ')}`);
      
      const stepDuration = 3000 / steps.length;
      for (let i = 0; i < steps.length; i++) {
        updateTask({ 
          sanitizationDetails: steps.slice(0, i + 1),
          progress: 50 + ((i + 1) / steps.length) * 40
        });
        await new Promise(r => setTimeout(r, stepDuration));
      }

      // 4. Complete
      const outputFilename = getOutputFilename(file.name, task.type);
      LogService.addLog('ENGINE', 'INFO', `Task ${task.id}: File reconstruction successful. Generated "${outputFilename}"`);

      updateTask({ 
        status: ProcessingStatus.COMPLETED, 
        progress: 100,
        resultFilename: outputFilename
      });

    } catch (error) {
      LogService.addLog('ENGINE', 'ERROR', `Task ${task.id}: Sanitization failed - ${error}`);
      updateTask({ status: ProcessingStatus.FAILED, progress: 0 });
    }
  };

  const handleDownload = (task: SanitizationTask) => {
    LogService.addLog('API', 'INFO', `File download initiated for Task ${task.id}: ${task.resultFilename}`);
    
    // Check if we need to warn about missing content for reconstruction (e.g. after refresh on large files)
    if ((task.type === FileType.DOCUMENT || task.type === FileType.IMAGE) && !task.base64Data) {
        LogService.addLog('API', 'WARN', `Task ${task.id}: Original content missing from storage. Generating metadata report only.`);
    }

    const blob = FileService.generateDownloadBlob(task);
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and click it
    const a = document.createElement('a');
    a.href = url;
    a.download = task.resultFilename || 'safe_file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    if(confirm("Clear all file processing history?")) {
        FileService.clearHistory();
        setTasks([]);
        LogService.addLog('SYSTEM', 'WARN', 'User cleared local file processing history');
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <ShieldCheck className="w-6 h-6 mr-2 text-indigo-600" />
          {t.cdrTitle}
        </h2>
        
        <div 
          className="border-2 border-dashed border-slate-300 rounded-lg p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-4 bg-indigo-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-lg font-medium text-slate-700">{t.uploadPrompt}</p>
          <p className="text-sm text-slate-500 mt-2 text-center max-w-md">
            {t.uploadDesc} <br/>
            <span className="text-xs text-slate-400">{t.uploadSub}</span>
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

      <div className="flex items-center justify-between pt-4 pb-2">
        <h3 className="text-lg font-semibold text-slate-700 flex items-center">
          <History className="w-5 h-5 mr-2" />
          {t.processingHistory}
        </h3>
        {tasks.length > 0 && (
          <button 
            onClick={handleClearHistory}
            className="text-sm text-red-500 hover:text-red-700 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-1" /> {t.clearHistory}
          </button>
        )}
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
                    <span>{new Date(task.timestamp).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className={`uppercase text-xs font-bold ${
                      task.status === ProcessingStatus.COMPLETED ? 'text-green-600' :
                      task.status === ProcessingStatus.FAILED ? 'text-red-600' :
                      'text-indigo-600'
                    }`}>
                      {t.status[task.status] || task.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 w-1/3 justify-end">
                {task.status === ProcessingStatus.COMPLETED ? (
                  <button 
                    onClick={(e) => {
                         e.stopPropagation();
                         handleDownload(task);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>{task.type === FileType.DOCUMENT ? t.downloadSafe : t.downloadClean}</span>
                  </button>
                ) : (
                  <>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
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
                  </>
                )}
              </div>
            </div>

            {/* Expanded Details Panel */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Steps Log */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2 flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2" /> {t.pipelineSteps}
                  </h4>
                  <ul className="space-y-1">
                    {task.sanitizationDetails?.map((step, idx) => (
                      <li key={idx} className="flex items-center text-slate-600">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Analysis */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> 
                    {t.threatAnalysis}
                  </h4>
                  <div className="bg-white p-3 rounded border border-slate-200 h-24 overflow-y-auto text-slate-600 italic">
                    {task.threatAnalysis ? task.threatAnalysis : t.waitingAnalysis}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            {t.noHistory}
          </div>
        )}
      </div>
    </div>
  );
};
