
import { LogEntry } from '../types';

const STORAGE_KEY = 'aegis_sqlite_db_logs';

export const LogService = {
  /**
   * Simulates querying the SQLite database for logs.
   * In a real deployment, this would be a REST call to the C++ backend.
   */
  getLogs: (): LogEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to read logs", e);
      return [];
    }
  },

  /**
   * Writes a log entry to the persistent store.
   */
  addLog: (module: 'API' | 'ENGINE' | 'STREAM' | 'SYSTEM', level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY', message: string) => {
    const logs = LogService.getLogs();
    
    // Get timestamp in SQL-like format (YYYY-MM-DD HH:mm:ss)
    const timestamp = new Date().toLocaleString('sv-SE').replace('T', ' ');

    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      module,
      level,
      message
    };
    
    // Simulate generic database behavior: Prepend new log, keep limit to avoid browser quota issues
    const updatedLogs = [newLog, ...logs].slice(0, 2000); 
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    
    // Dispatch event for real-time UI updates
    window.dispatchEvent(new Event('log-update'));
    
    return newLog;
  },
  
  /**
   * Clear logs (Administrative action)
   */
  clearLogs: () => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('log-update'));
  }
};
