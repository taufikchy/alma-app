// components/DailyCheckForm.tsx
"use client";

import { useState, useRef } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useSession } from 'next-auth/react';

interface DailyCheckFormProps {
  onDailyCheckSubmitted: () => void;
}

const DailyCheckForm: React.FC<DailyCheckFormProps> = ({ onDailyCheckSubmitted }) => {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [takenMedication, setTakenMedication] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran foto maksimal 5MB');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!session?.user?.id) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('takenMedication', String(takenMedication));
      formData.append('notes', notes);
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await fetch('/api/dailycheck', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit daily check');
      }

      setSuccess('Daily check berhasil disimpan!');
      setTakenMedication(false);
      setPhoto(null);
      setPhotoPreview(null);
      setNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onDailyCheckSubmitted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-alma p-4">
      <div className="card-header-alma mb-3">
        <i className="bi bi-clipboard2-check fs-4"></i>
        <h5 className="mb-0 fw-bold">Catat Daily Check</h5>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3 text-center">
          <Form.Check
            type="checkbox"
            label="Sudah minum tablet tambah darah (TTD) atau MMS?"
            checked={takenMedication}
            onChange={(e) => setTakenMedication(e.target.checked)}
            className="d-flex justify-content-center align-items-center gap-2 fs-5"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-medium small d-block text-center">Foto Bukti (Opsional)</Form.Label>
          <div className="d-flex flex-column align-items-center gap-2">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="form-control"
              style={{ maxWidth: '300px' }}
            />
            {photoPreview && (
              <div className="position-relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="rounded"
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                />
                <Button
                  variant="danger"
                  size="sm"
                  className="position-absolute top-0 end-0 translate-middle"
                  onClick={clearPhoto}
                  style={{ borderRadius: '50%' }}
                >
                  <i className="bi bi-x"></i>
                </Button>
              </div>
            )}
          </div>
          <Form.Text className="text-muted small d-block text-center">
            Maks 5MB, format JPG/PNG
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label className="fw-medium small d-block text-center">Catatan (Opsional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Tambahkan catatan Anda di sini"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-center"
          />
        </Form.Group>

        <div className="d-flex justify-content-center">
          <Button
            variant="success"
            type="submit"
            disabled={loading}
            className="btn-alma-primary px-5"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Menyimpan...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Simpan Daily Check
              </>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default DailyCheckForm;