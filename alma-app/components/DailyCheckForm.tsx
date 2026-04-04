// components/DailyCheckForm.tsx
"use client";

import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useSession } from 'next-auth/react';

interface DailyCheckFormProps {
  onDailyCheckSubmitted: () => void;
}

const DailyCheckForm: React.FC<DailyCheckFormProps> = ({ onDailyCheckSubmitted }) => {
  const { data: session } = useSession();
  const [takenMedication, setTakenMedication] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      const response = await fetch('/api/dailycheck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          takenMedication,
          photoUrl,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit daily check');
      }

      setSuccess('Daily check berhasil disimpan!');
      setTakenMedication(false);
      setPhotoUrl('');
      setNotes('');
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
        <Alert variant="danger" className="text-center mb-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="text-center mb-3">
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3 text-center">
          <Form.Check
            type="checkbox"
            label="Sudah minum obat tambah darah?"
            checked={takenMedication}
            onChange={(e) => setTakenMedication(e.target.checked)}
            className="d-flex justify-content-center align-items-center gap-2 fs-5"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-medium small d-block text-center">Link Foto Bukti (Opsional)</Form.Label>
          <Form.Control
            type="text"
            placeholder="Masukkan URL foto bukti"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="text-center"
          />
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
            className="btn-alma-primary px-5 text-center"
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