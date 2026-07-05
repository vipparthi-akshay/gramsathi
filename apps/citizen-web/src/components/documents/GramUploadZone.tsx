'use client';

import { useState, useRef, DragEvent } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import GramButton from '@/components/ui/GramButton';

interface GramUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export default function GramUploadZone({
  onFileSelect,
  accept = 'image/*,.pdf',
  maxSizeMB = 10,
  disabled = false,
}: GramUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return false;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      setError('Unsupported file format. Please upload JPG, PNG, or PDF');
      return false;
    }
    return true;
  };

  const handleFile = (file: File) => {
    setError(null);
    if (!validateFile(file)) return;
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setUploading(false);
      onFileSelect(file);
    }, 2000);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <Box
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed',
        borderColor: isDragging ? 'primary.main' : error ? 'error.main' : 'outline',
        borderRadius: 4,
        p: 4,
        textAlign: 'center',
        backgroundColor: isDragging ? 'action.hover' : 'transparent',
        transition: 'all 0.2s ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload document area"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInput}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInput}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {uploading ? (
        <Box sx={{ width: '100%' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Uploading... {progress}%
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4 }} />
        </Box>
      ) : (
        <>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="body1" fontWeight={500} gutterBottom>
            Drag & drop or tap to upload
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Supported: JPG, PNG, PDF (max {maxSizeMB}MB)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
            <GramButton
              variant="tonal"
              size="small"
              icon={<CameraAltIcon />}
              onClick={(e) => {
                e.stopPropagation();
                cameraRef.current?.click();
              }}
            >
              Take Photo
            </GramButton>
            <GramButton
              variant="tonal"
              size="small"
              icon={<PhotoLibraryIcon />}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Choose from Gallery
            </GramButton>
          </Box>
        </>
      )}

      {error && (
        <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
