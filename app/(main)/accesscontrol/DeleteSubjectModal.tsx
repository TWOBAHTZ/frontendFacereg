'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, Loader2 } from 'lucide-react';
import styles from './accesscontrol.module.css';

const BACKEND_URL = 'http://localhost:8000';

interface Subject {
  subject_id: number;
  subject_name: string;
  section?: string | null;
}

interface DeleteSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectDeleted: () => void;
}

export const DeleteSubjectModal: React.FC<DeleteSubjectModalProps> = ({ isOpen, onClose, onSubjectDeleted }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/subjects`);
        if (!response.ok) throw new Error("Failed to fetch subjects");
        setSubjects(await response.json());
        setError('');
      } catch (err: any) { 
        setError(err.message); 
      }
    };
    
    if (isOpen) {
      fetchSubjects();
    }
  }, [isOpen]);

  const handleDelete = async (subjectId: number, subjectName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${subjectName}"?`)) {
      return;
    }
    
    setDeletingId(subjectId);
    setError('');
    
    try {
      const res = await fetch(`${BACKEND_URL}/subjects/${subjectId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete');
      }
      
      onSubjectDeleted();
      setSubjects(prev => prev.filter(s => s.subject_id !== subjectId));
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
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
                {subject.subject_name} 
                {subject.section ? ` (Sec: ${subject.section})` : ''}
              </span>
              
              <button 
                className={styles.deleteIcon}
                onClick={() => handleDelete(subject.subject_id, subject.subject_name)}
                disabled={deletingId === subject.subject_id}
              >
                {deletingId === subject.subject_id 
                  ? <Loader2 size={18} className={styles.spinner} /> 
                  : <Trash2 size={18} />
                }
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};