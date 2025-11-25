'use client';

import React, { useEffect, useRef, useState, useCallback, FormEvent } from 'react';
import { Settings, Download, X, VideoOff, Plus, Loader2, Save, Trash2, Users } from 'lucide-react'; 
import styles from './accesscontrol.module.css';
import { useMsal } from "@azure/msal-react";
import { getAuthToken } from "../../authConfig";

const BACKEND_URL = 'http://localhost:8000';
const WS_BACKEND_URL = 'ws://localhost:8000';

interface Subject {
  subject_id: number;
  subject_name: string;
  section?: string | null;
  schedule?: string | null;
  academic_year?: string | null; 
  class_start_time?: string | null;
}

interface LogEntry { 
  log_id: number; user_id: number; user_name: string; student_code: string; 
  action: "enter" | "exit"; 
  timestamp: string; confidence: number | null; 
  subject_id: number | null; snapshot_path: string | null;
  log_status: "Present" | "Late" | null;
}

interface AIResult { name: string; box: [number, number, number, number]; similarity?: number | null; matched: boolean; display_name: string; }
interface AIData { results: AIResult[]; ai_width: number; ai_height: number; }
interface DiscoveredDevice { src: string; width: number; height: number; readable: boolean; }

/* --- SettingsModal Component --- */
interface SettingsModalProps { isOpen: boolean; onClose: () => void; onSelectDevice: (src: string) => void; }
const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSelectDevice }) => {
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const selectRef = useRef<HTMLSelectElement>(null);
  
  const { instance, accounts } = useMsal();

  useEffect(() => {
    const getBackendDevices = async () => {
      if (accounts.length === 0) return;
      try {
        const accessToken = await getAuthToken(instance, accounts[0]);
        const headers = { "Authorization": `Bearer ${accessToken}` };
        
        const response = await fetch(`${BACKEND_URL}/cameras/discover`, { headers });
        if (!response.ok) throw new Error("Failed to fetch devices");
        
        const data: { devices: DiscoveredDevice[] } = await response.json();
        setDevices(data.devices.filter(d => d.readable));
      } catch (err) { console.error("Could not get video devices from backend:", err); }
    };
    if (isOpen) { getBackendDevices(); }
  }, [isOpen, instance, accounts]);
  
  if (!isOpen) return null;
  const handleConfirm = () => {
    if (selectRef.current?.value) { onSelectDevice(selectRef.current.value); onClose(); }
  };
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}><X size={20} /></button>
        <h2>Select Camera Source</h2>
        <p>Choose a video source from the server's available devices.</p>
        <select ref={selectRef} className={styles.deviceSelect} defaultValue="">
          <option value="" disabled>-- Please choose a camera --</option>
          {devices.map((device) => ( <option key={device.src} value={device.src}> {`Camera (src: ${device.src}) - ${device.width}x${device.height}`} </option> ))}
        </select>
        <button className={styles.confirmButton} onClick={handleConfirm}>Confirm Selection</button>
      </div>
    </div>
  );
};

/* --- AddSubjectModal Component --- */
interface AddSubjectModalProps { isOpen: boolean; onClose: () => void; onSubjectAdded: () => void; }
const AddSubjectModal: React.FC<AddSubjectModalProps> = ({ isOpen, onClose, onSubjectAdded }) => {
  const [subjectName, setSubjectName] = useState('');
  const [section, setSection] = useState('');
  const [schedule, setSchedule] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [classStartTime, setClassStartTime] = useState('09:00'); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { instance, accounts } = useMsal();

  useEffect(() => {
    if (isOpen) {
      setSubjectName(''); setSection(''); setSchedule(''); setError('');
      setAcademicYear(''); setClassStartTime('09:00'); 
    }
  }, [isOpen]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!subjectName.trim()) { setError('Subject Name is required'); return; }
    if (!academicYear.trim()) { setError('Academic Year is required'); return; } 
    
    if (accounts.length === 0) {
      setError("Not logged in. Please log in again.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const accessToken = await getAuthToken(instance, accounts[0]);
      const headers = { 
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${accessToken}` 
      };

      const res = await fetch(`${BACKEND_URL}/subjects`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          subject_name: subjectName,
          section: section || null,
          schedule: schedule || null,
          academic_year: academicYear || null,
          class_start_time: classStartTime || null, 
        }),
      });
      if (res.ok) { 
        onSubjectAdded();
        onClose();
      } else { 
        const data = await res.json(); 
        throw new Error(data.detail || 'Failed to create subject'); 
      }
    } catch (err: any) { setError(err.message); } 
    finally { setIsSubmitting(false); }
  };
  
  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { setSection(value); }
  };
  if (!isOpen) return null;
  return (
    <div className={styles.modalBackdrop} onClick={onClose} style={{ zIndex: 1100 }}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}><X size={20} /></button>
        <h2>Create New Subject</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="academicYear">Academic Year <span style={{ color: '#ef4444' }}>*</span></label>
            <input id="academicYear" type="number" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="e.g. 2024-2025" disabled={isSubmitting} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="subjectName">Subject Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input id="subjectName" type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Computer Vision" disabled={isSubmitting} required />
          </div>
          <div className={styles.formGroup}>
             <label htmlFor="section">Section (Optional)</label>
             <input id="section" type="text" inputMode="numeric" value={section} onChange={handleSectionChange} placeholder="e.g. 1" disabled={isSubmitting} />
          </div>
          <div className={styles.formGroup}>
             <label htmlFor="classStartTime">Class Start Time (Optional)</label>
             <input id="classStartTime" type="time" value={classStartTime} onChange={e => setClassStartTime(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className={styles.formGroup}>
             <label htmlFor="schedule">Schedule (Optional)</label>
             <input id="schedule" type="text" value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="e.g. Monday 09:00-12:00" disabled={isSubmitting} />
          </div>
          {error && <p className={styles.errorText}>{error}</p>}
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className={styles.spinner} /> : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* --- DeleteSubjectModal Component --- */
interface DeleteSubjectModalProps { isOpen: boolean; onClose: () => void; onSubjectDeleted: () => void; }
export const DeleteSubjectModal: React.FC<DeleteSubjectModalProps> = ({ isOpen, onClose, onSubjectDeleted }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  
  const { instance, accounts } = useMsal();

  useEffect(() => {
    const fetchSubjects = async () => {
      if (accounts.length === 0) return;
      try {
        const accessToken = await getAuthToken(instance, accounts[0]);
        const headers = { "Authorization": `Bearer ${accessToken}` };
        
        const response = await fetch(`${BACKEND_URL}/subjects`, { headers });
        if (!response.ok) throw new Error("Failed to fetch subjects");
        
        setSubjects(await response.json());
        setError('');
      } catch (err: any) { setError(err.message); }
    };
    if (isOpen) { fetchSubjects(); }
  }, [isOpen, onSubjectDeleted, instance, accounts]);
  
  const handleDelete = async (subjectId: number, subjectName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${subjectName}"?`)) { return; }
    
    if (accounts.length === 0) {
      setError("Not logged in. Please log in again.");
      return;
    }
    
    setDeletingId(subjectId);
    setError('');
    try {
      const accessToken = await getAuthToken(instance, accounts[0]);
      const headers = { "Authorization": `Bearer ${accessToken}` };
      
      const res = await fetch(`${BACKEND_URL}/subjects/${subjectId}`, { 
        method: 'DELETE', 
        headers: headers
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.detail || 'Failed to delete'); }
      onSubjectDeleted(); 
      setSubjects(prev => prev.filter(s => s.subject_id !== subjectId));
    } catch (err: any) { setError(err.message); } 
    finally { setDeletingId(null); }
  };
  
  if (!isOpen) return null;
  return (
    <div className={styles.modalBackdrop} onClick={onClose} style={{ zIndex: 1100 }}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}><X size={20} /></button>
        <h2>Delete Subject</h2>
        <p>Click the trash icon to (soft) delete a subject.</p>
        {error && <p className={styles.errorText}>{error}</p>}
        <div className={styles.deleteListContainer}>
          {subjects.length === 0 && <p>No subjects to delete.</p>}
          {subjects.map(subject => (
            <div key={subject.subject_id} className={styles.deleteItem}>
              <span>
                {subject.academic_year ? `[${subject.academic_year}] ` : ''}
                {subject.subject_name} 
                {subject.section ? ` (Sec: ${subject.section})` : ''}
              </span>
              <button className={styles.deleteIcon} onClick={() => handleDelete(subject.subject_id, subject.subject_name)} disabled={deletingId === subject.subject_id}>
                {deletingId === subject.subject_id ? <Loader2 size={18} className={styles.spinner} /> : <Trash2 size={18} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* --- SnapshotModal Component --- */
interface SnapshotModalProps { isOpen: boolean; onClose: () => void; imageUrl: string | null; }
const SnapshotModal: React.FC<SnapshotModalProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen || !imageUrl) return null;
  return (
    <div className={styles.modalBackdrop} onClick={onClose} style={{ zIndex: 1200 }}>
      <div className={styles.snapshotModalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '50%' }}><X size={24} /></button>
        <img src={imageUrl} alt="Full Snapshot" className={styles.snapshotModalImage} />
      </div>
    </div>
  );
};

/* --- useAIResults Hook --- */
const useAIResults = (camId: string, streamKey: string) => {
  const [data, setData] = useState<AIData>({ results: [], ai_width: 640, ai_height: 480 });
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (!streamKey || !camId) { if (wsRef.current) { wsRef.current.close(1000); wsRef.current = null; } setData({ results: [], ai_width: 640, ai_height: 480 }); return;  }
    const connect = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) { return; }
      const ws = new WebSocket(`${WS_BACKEND_URL}/ws/ai_results/${camId}`);
      wsRef.current = ws;
      ws.onopen = () => console.log(`[WS AI ${camId}] Connected (Source: ${streamKey}).`);
      ws.onmessage = (event) => { const data: AIData = JSON.parse(event.data); if (data.results) { setData(data); } };
      ws.onerror = (err) => console.error(`[WS AI ${camId}] Error:`, err);
      ws.onclose = () => { wsRef.current = null; setData({ results: [], ai_width: 640, ai_height: 480 }); setTimeout(() => { if(streamKey) connect(); }, 3000); };
    };
    connect();
    return () => { if (wsRef.current) { wsRef.current.close(1000); wsRef.current = null; }};
  }, [camId, streamKey]);
  return data;
};

/* --- CameraBox Component --- */
interface CameraBoxProps { camId: 'entrance' | 'exit'; streamKey: string; onSettingsClick: () => void; }
const CameraBox: React.FC<CameraBoxProps> = ({ camId, streamKey, onSettingsClick }) => {
  const [error, setError] = useState(false);
  const { results: aiResults, ai_width, ai_height } = useAIResults(camId, streamKey); 
  const containerRef = useRef<HTMLDivElement>(null);
  const streamUrl = (streamKey) ? `${BACKEND_URL}/cameras/${camId}/mjpeg?key=${streamKey}` : null;
  useEffect(() => { setError(false); }, [streamUrl]);
  const calculateBoxStyle = (box: [number, number, number, number]): React.CSSProperties => {
    if (!box || !Array.isArray(box) || box.length < 4) { return { display: 'none' }; }
    if (!containerRef.current) return { display: 'none' };
    const clientWidth = containerRef.current.clientWidth; const clientHeight = containerRef.current.clientHeight;
    const scaleX = clientWidth / ai_width; const scaleY = clientHeight / ai_height;
    const [x, y, w, h] = box;
    return { left: `${x * scaleX}px`, top: `${y * scaleY}px`, width: `${w * scaleX}px`, height: `${h * scaleY}px` };
  };
  return (
    <div className={styles.cameraBox} ref={containerRef}>
      {!streamUrl ? ( <div className={styles.errorOverlay}><VideoOff size={48} /><p>Stream error or no source.</p></div>
      ) : error ? ( <div className={styles.errorOverlay}><VideoOff size={48} /><p>Stream error or no source.</p></div>
      ) : ( <img key={streamUrl} src={streamUrl} className={styles.videoFeed} onError={() => setError(true)} onLoad={() => setError(false)} alt={`Stream for ${camId}`} /> )}
      <div className={styles.aiOverlayContainer}>
        {aiResults.map((result, index) => (
          <div key={index} className={`${styles.aiBox} ${result.matched ? styles.matchedBox : styles.unknownBox}`} style={calculateBoxStyle(result.box)}>
            <span className={`${styles.aiNameTag} ${result.matched ? styles.matchedTag : styles.unknownTag}`}>{result.display_name}</span>
          </div>
        ))}
      </div>
      <div className={styles.cameraOverlay}>
        <div className={styles.recIndicator}><div className={styles.recDot}></div><span>REC</span></div>
        <button className={styles.cameraSettingsButton} onClick={onSettingsClick}><Settings size={20} /></button>
      </div>
    </div>
  );
};

/* --- Main Page Component --- */
const AccessControlPage = () => {
  const { instance, accounts } = useMsal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTargetCamera, setCurrentTargetCamera] = useState<'entrance' | 'exit' | null>(null);
  
  const [selectedSources, setSelectedSources] = useState<null | { entrance: string, exit: string }>(null);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lateTime, setLateTime] = useState('09:30'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const isViewingToday = selectedDate.toDateString() === new Date().toDateString();
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [snapshotModalUrl, setSnapshotModalUrl] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState({ checked: 0, total: 0 });
  const [isSavingTime, setIsSavingTime] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5; 

  const formatDateForAPI = (date: Date): string => { return date.toISOString().split('T')[0]; };

  const fetchStudentTotalCount = useCallback(async (subjectId: string | null) => {
    if (!subjectId || accounts.length === 0) {
        setStudentCount(prev => ({ ...prev, total: 0 }));
        return;
    }
    
    try {
        const accessToken = await getAuthToken(instance, accounts[0]);
        const countRes = await fetch(`${BACKEND_URL}/subjects/${subjectId}/student_count`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        
        if (!countRes.ok) throw new Error("Failed to fetch student count");
        
        const countData = await countRes.json();
        setStudentCount(prev => ({ ...prev, total: countData.total_students }));

    } catch (err) {
        console.error("Failed to fetch student total count:", err);
        setStudentCount(prev => ({ ...prev, total: 0 }));
    }
  }, [instance, accounts]);


  const fetchSubjects = useCallback(async () => {
    if (accounts.length === 0) return;
    try {
      const accessToken = await getAuthToken(instance, accounts[0]);
      const headers = { "Authorization": `Bearer ${accessToken}` };
      
      const response = await fetch(`${BACKEND_URL}/subjects`, { headers });
      if (!response.ok) throw new Error("Failed to fetch subjects");
      
      const data: Subject[] = await response.json();
      setSubjects(data);
      
      let currentSubjId = selectedSubjectId;
      if (!currentSubjId && data.length > 0) {
        currentSubjId = data[0].subject_id.toString(); 
        setSelectedSubjectId(currentSubjId);
      }

      if(currentSubjId) {
        const currentSubj = data.find(s => s.subject_id.toString() === currentSubjId);
        if (currentSubj && currentSubj.class_start_time) {
            setLateTime(currentSubj.class_start_time.substring(0, 5)); 
        } else {
            setLateTime('09:30'); 
        }
      }
    } catch (err) { console.error("Failed to fetch subjects:", err); }
  }, [selectedSubjectId, instance, accounts]); 

  const fetchInitialLogs = useCallback(async () => {
    if (accounts.length === 0) return;
    const dateString = formatDateForAPI(selectedDate);
    let url = `${BACKEND_URL}/attendance/logs?start_date=${dateString}&end_date=${dateString}`;
    if (selectedSubjectId) { url += `&subject_id=${selectedSubjectId}`; }
    try {
      const accessToken = await getAuthToken(instance, accounts[0]);
      const headers = { "Authorization": `Bearer ${accessToken}` };
      
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data: LogEntry[] = await response.json();
      setLogs(data);
    } catch (err) { console.error("Failed to fetch initial logs:", err); setLogs([]); }
  }, [selectedDate, selectedSubjectId, instance, accounts]); 

  const pollNewLogs = useCallback(async () => {
    if (!isViewingToday || accounts.length === 0) return; 
    
    if (selectedSubjectId) {
        fetchStudentTotalCount(selectedSubjectId);
    }
    
    try {
      const accessToken = await getAuthToken(instance, accounts[0]);
      const headers = { "Authorization": `Bearer ${accessToken}` };

      const response = await fetch(`${BACKEND_URL}/attendance/poll`, { headers });
      if (!response.ok) throw new Error("Failed to poll logs");
      const newLogs: LogEntry[] = await response.json();
      if (newLogs.length > 0) { 
        const filteredNewLogs = newLogs.filter(log => !selectedSubjectId || log.subject_id?.toString() === selectedSubjectId);
        if (filteredNewLogs.length > 0) {
          setLogs(prevLogs => [...filteredNewLogs, ...prevLogs]); 
        }
      }
    } catch (err) { console.error("Failed to poll new logs:", err); }
  }, [isViewingToday, selectedSubjectId, instance, accounts, fetchStudentTotalCount]); 

  useEffect(() => {
    if (selectedSubjectId) { 
      const enteredLogs = logs.filter(log => log.action === 'enter');
      const uniqueUserIds = new Set(enteredLogs.map(log => log.user_id));
      setStudentCount(prev => ({ ...prev, checked: uniqueUserIds.size }));
    } else {
      setStudentCount(prev => ({ ...prev, checked: 0 })); 
    }
  }, [logs, selectedSubjectId]); 

  useEffect(() => {
    fetchInitialLogs(); 
    setCurrentPage(1); 
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (isViewingToday) { pollIntervalRef.current = setInterval(pollNewLogs, 3000); }
    return () => { if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); } };
  }, [fetchInitialLogs, pollNewLogs, isViewingToday]); 

  useEffect(() => {
    const fetchCurrentConfig = async () => {
        if (accounts.length === 0) return; 
        try {
          const accessToken = await getAuthToken(instance, accounts[0]);
          const headers = { "Authorization": `Bearer ${accessToken}` };
          
          const response = await fetch(`${BACKEND_URL}/cameras/config`, { headers });
          if (!response.ok) throw new Error("Failed to fetch camera config");
          
          const data: { mapping: { entrance: string, exit: string } } = await response.json();
          setSelectedSources(data.mapping);
        } catch (err) { console.error("Failed to fetch camera config:", err); }
      };
      fetchCurrentConfig();
  }, [instance, accounts]);
  
  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);
  useEffect(() => { const timer = setInterval(() => { setCurrentTime(new Date()); }, 1000); return () => { clearInterval(timer); }; }, []);

  const handleSubjectChange = async (newSubjectId: string) => {
    if (accounts.length === 0) { console.error("Not logged in"); return; }
    
    setSelectedSubjectId(newSubjectId);
    setStudentCount({ checked: 0, total: 0 }); 
    setCurrentPage(1); 
    
    fetchStudentTotalCount(newSubjectId);

    const selectedSubj = subjects.find(s => s.subject_id.toString() === newSubjectId);
    
    if (selectedSubj && selectedSubj.class_start_time) {
      setLateTime(selectedSubj.class_start_time.substring(0, 5)); 
    } else {
      setLateTime('09:30'); 
    }
    const subjectIdAsInt = newSubjectId ? parseInt(newSubjectId, 10) : null;
    
    try {
      const accessToken = await getAuthToken(instance, accounts[0]);
      
      const res = await fetch(`${BACKEND_URL}/attendance/set_active_subject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${accessToken}` },
        body: JSON.stringify({ subject_id: subjectIdAsInt }),
      });
      if (!res.ok) throw new Error("Failed to set active subject");
      const data = await res.json();
      console.log("Backend roster updated:", data);
      
    } catch (err) {
      console.error("Failed to update subject info:", err);
    }
  };

  const handleSaveTime = async () => {
    if (accounts.length === 0) { alert("Not logged in."); return; }
    if (!selectedSubjectId) { alert("Please select a subject first."); return; }
    if (!lateTime) { alert("Please enter a valid time."); return; }
    setIsSavingTime(true);
    try {
        const accessToken = await getAuthToken(instance, accounts[0]);
        const res = await fetch(`${BACKEND_URL}/api/subjects/${selectedSubjectId}/time`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${accessToken}` },
            body: JSON.stringify({ class_start_time: lateTime }),
        });
        if (!res.ok) { const data = await res.json(); throw new Error(data.detail || 'Failed to save time'); }
        alert("Class start time updated successfully!");
        fetchSubjects();
    } catch (err: any) {
        console.error("Failed to save time:", err);
        alert(`Error: ${err.message}`);
    } finally {
        setIsSavingTime(false);
    }
  };

  const handleOpenModal = (target: 'entrance' | 'exit') => { setCurrentTargetCamera(target); setIsModalOpen(true); };
  
  const handleSelectDevice = async (src: string) => {
    if (accounts.length === 0) { console.error("Not logged in"); return; }
    
    if (currentTargetCamera && selectedSources) {
      try {
        const accessToken = await getAuthToken(instance, accounts[0]);
        const newMapping = { ...selectedSources, [currentTargetCamera]: src };
        
        const response = await fetch(`${BACKEND_URL}/cameras/config`, {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${accessToken}` }, 
          body: JSON.stringify(newMapping),
        });
        if (!response.ok) throw new Error("Failed to configure backend");
        
        setSelectedSources(newMapping); 
      } catch (err) { console.error("Failed to set new camera source:", err); }
    } else {
      console.error("handleSelectDevice called but currentTargetCamera or selectedSources is null");
    }
  };
  
  const handleStartAttendance = async () => { 
    if (accounts.length === 0) { alert("Not logged in."); return; }
    try { 
      const accessToken = await getAuthToken(instance, accounts[0]);
      await fetch(`${BACKEND_URL}/attendance/start`, { 
        method: 'POST', 
        headers: { "Authorization": `Bearer ${accessToken}` } 
      }); 
      alert('Attendance Started!'); 
    } catch (err) { console.error(err); alert('Failed to start attendance.'); } 
  };
  
  const handleStopAttendance = async () => { 
    if (accounts.length === 0) { alert("Not logged in."); return; }
    try { 
      const accessToken = await getAuthToken(instance, accounts[0]);
      await fetch(`${BACKEND_URL}/attendance/stop`, { 
        method: 'POST', 
        headers: { "Authorization": `Bearer ${accessToken}` } 
      }); 
      alert('Attendance Stopped!'); 
    } catch (err) { console.error(err); alert('Failed to stop attendance.'); } 
  };
  
  const handleSubjectAdded = () => { alert("Subject created successfully!"); fetchSubjects(); };
  
  const handleSubjectDeleted = () => {
     fetchSubjects();
     if (selectedSubjectId && !subjects.find(s => s.subject_id.toString() === selectedSubjectId)) {
       handleSubjectChange('');
     }
  };
  
  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (accounts.length === 0) { alert("Not logged in."); return; }
    console.log(`Exporting data as ${format}...`);
    setShowExportMenu(false);
    
    const dateString = formatDateForAPI(selectedDate);
    const subjectId = selectedSubjectId;
    const params = new URLSearchParams();
    params.append("start_date", dateString);
    params.append("end_date", dateString);
    if (subjectId) { params.append("subject_id", subjectId); }
    params.append("format", format); 
    const url = `${BACKEND_URL}/attendance/export?${params.toString()}`;
    
    try {
      const accessToken = await getAuthToken(instance, accounts[0]);
      const headers = { "Authorization": `Bearer ${accessToken}` };
      
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `export-${dateString}.${format}`; 
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
            filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (err: any) {
         console.error("Export failed:", err);
         alert(`Export failed: ${err.message}`);
    }
  };
  
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 7; 
    const sidePages = 2; 

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let start = Math.max(2, currentPage - sidePages);
      let end = Math.min(totalPages - 1, currentPage + sidePages);

      pageNumbers.push(1);

      if (start > 2) {
        pageNumbers.push('...');
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (end < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      if (totalPages > 1 && !pageNumbers.includes(totalPages)) {
        pageNumbers.push(totalPages);
      }

      const finalPageNumbers: (number | string)[] = [];
      let lastItem: number | string | null = null;
      for (const item of pageNumbers) {
          if (item === '...' && lastItem === '...') continue;
          finalPageNumbers.push(item);
          lastItem = item;
      }
      return finalPageNumbers;
    }
    return pageNumbers;
  };
  

  return (
    <div className={styles.pageContainer}>
      <SettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectDevice={handleSelectDevice} />
      <AddSubjectModal isOpen={isAddSubjectModalOpen} onClose={() => setIsAddSubjectModalOpen(false)} onSubjectAdded={handleSubjectAdded} />
      <DeleteSubjectModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onSubjectDeleted={handleSubjectDeleted} />
      <SnapshotModal isOpen={!!snapshotModalUrl} onClose={() => setSnapshotModalUrl(null)} imageUrl={snapshotModalUrl} />

      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Camera Preview</h1>
      </header>
      
      <div className={styles.cameraGrid}>
        {!selectedSources ? (
          <div className={styles.loadingBox}>
            <Loader2 className={styles.spinner} /> Loading camera config...
          </div>
        ) : (
          <>
            <CameraBox camId="entrance" streamKey={selectedSources.entrance} onSettingsClick={() => handleOpenModal('entrance')} />
            <CameraBox camId="exit" streamKey={selectedSources.exit} onSettingsClick={() => handleOpenModal('exit')} />
          </>
        )}
      </div>
      
      <div className={styles.controlPanel}>
        <div className={styles.controlGroup}>
          <label htmlFor="subjectSelect">Class&nbsp;:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            
            <select
              id="subjectSelect"
              className={styles.controlSelect} 
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              style={{ flex: 1, minWidth: '150px' }} 
            >
              <option value="">-- All Subjects --</option>
              {subjects.map((subj) => (
                <option key={subj.subject_id} value={subj.subject_id}>
                  {subj.academic_year ? `[${subj.academic_year}] ` : ''}
                  {subj.subject_name} 
                  {subj.section ? ` (Sec: ${subj.section})` : ''}
                </option>
              ))}
            </select>
            
            <button onClick={() => setIsAddSubjectModalOpen(true)} title="Create new subject" className={styles.iconButton}>
                <Plus size={18} />
            </button>
            <button onClick={() => setIsDeleteModalOpen(true)} title="Delete a subject" className={`${styles.iconButton} ${styles.deleteButton}`}>
                <Trash2 size={18} />
            </button>
          </div>
        </div>
        
        {selectedSubjectId && (
          <div className={styles.studentCounter}>
            <Users size={16} />
            <span>{studentCount.checked} / {studentCount.total}</span>
          </div>
        )}
        
        <div className={styles.controlGroup}>
          <label htmlFor="lateTime">After :</label>
          <input 
            type="time" 
            id="lateTime" 
            className={styles.controlInput} 
            value={lateTime} 
            onChange={(e) => setLateTime(e.target.value)} 
            style={{ width: '130px' }}
          />
          <button 
            onClick={handleSaveTime} 
            className={styles.iconButton} 
            title="Save time to subject" 
            disabled={!selectedSubjectId || isSavingTime}
          >
            {isSavingTime ? <Loader2 size={18} className={styles.spinner} /> : <Save size={18} />}
          </button>
          <span className={styles.lateTag}>Late</span>
        </div>
        
        <span className={styles.realTimeClock}>
          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </span>

        <button className={`${styles.controlButton} ${styles.startButton}`} onClick={handleStartAttendance} disabled={!isViewingToday}>Start Attendance</button>
        <button className={`${styles.controlButton} ${styles.stopButton}`} onClick={handleStopAttendance} disabled={!isViewingToday}>Stop Attendance</button>
      </div>
      
      <div className={styles.logCard}>
        <div className={styles.logHeader}>
          <h2 className={styles.logTitle}>Attendance Log</h2>
          <div className={styles.datePickerContainer}>
            <label htmlFor="logDate">Select Date:</label>
            <input type="date" id="logDate" className={styles.dateInput} value={formatDateForAPI(selectedDate)} onChange={(e) => setSelectedDate(new Date(e.target.value))} />
          </div>

          <div className={styles.exportControls}>
            <div style={{ position: 'relative' }}>
              <button className={styles.exportButton} onClick={() => setShowExportMenu(!showExportMenu)}>
                <Download size={16} />
                <span>Export data</span>
              </button>
              {showExportMenu && (
                <div className={styles.exportMenu}>
                  <button onClick={() => handleExport('csv')}>Export as .csv</button>
                  <button onClick={() => handleExport('xlsx')}>Export as .xlsx</button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.attendanceTable}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Name</th>
                <th>ID</th>
                <th>Status</th>
                <th>Snapshot</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.length === 0 ? (
                <tr><td colSpan={5} className={styles.noLogs}>No logs found for this day.</td></tr>
              ) : (
                currentLogs.map((log) => (
                  <tr key={log.log_id}>
                    <td className={styles.tableCellText}>{new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                    <td className={styles.tableCellText}>{log.user_name}</td>
                    <td className={styles.tableCellText}>{log.student_code}</td>
                    <td className={styles.tableCellStatus}>
                      {(() => {
                        if (log.action === 'exit') {
                          return <span className={styles.statusExit}>Exit</span>;
                        }
                        if (log.log_status === 'Late') {
                          return <span className={styles.statusLate}>Enter (Late)</span>;
                        }
                        return <span className={styles.statusPresent}>Enter (On-Time)</span>;
                      })()}
                    </td>
                    <td className={styles.tableCellSnapshot}>
                      {log.snapshot_path ? (
                        <img 
                          src={`${BACKEND_URL}/${log.snapshot_path?.replace(/\\/g, '/')}`} 
                          alt="Snapshot"
                          className={styles.snapshotImage} 
                          loading="lazy"
                          onClick={() => setSnapshotModalUrl(`${BACKEND_URL}/${log.snapshot_path?.replace(/\\/g, '/')}`)}
                        />
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
            <div className={styles.paginationContainer}>
                <button 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                >
                    Previous
                </button>
                
                {getPageNumbers().map((number, index) => (
                    <button
                        key={index}
                        onClick={() => typeof number === 'number' && paginate(number)}
                        className={`${styles.pageNumberButton} ${number === currentPage ? styles.activePage : ''}`}
                        disabled={number === '...'}
                    >
                        {number}
                    </button>
                ))}
                
                <button 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className={styles.paginationButton}
                >
                    Next
                </button>
            </div>
        )}
      </div> 
      
    </div>
  );
};

export default AccessControlPage;