// components/DailyCheckForm.tsx
"use client";

import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useSession } from 'next-auth/react';

interface DailyCheckFormProps {
  onDailyCheckSubmitted: () => void; // Callback to refresh history
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

      setSuccess('Daily check submitted successfully!');
      setTakenMedication(false);
      setPhotoUrl('');
      setNotes('');
      onDailyCheckSubmitted(); // Trigger refresh
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="p-3 border rounded shadow-sm">
      <h4 className="mb-3">Catat Daily Check Anda</h4>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form.Group className="mb-3" controlId="formTakenMedication">
        <Form.Check
          type="checkbox"
          label="Sudah minum obat tambah darah?"
          checked={takenMedication}
          onChange={(e) => setTakenMedication(e.target.checked)}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formPhotoUrl">
        <Form.Label>Link Foto Bukti (Opsional)</Form.Label>
        <Form.Control
          type="text"
          placeholder="Masukkan URL foto bukti"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formNotes">
        <Form.Label>Catatan (Opsional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Tambahkan catatan Anda di sini"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Form.Group>

      <Button variant="primary" type="submit" disabled={loading}>
        {loading ? 'Menyimpan...' : 'Simpan Daily Check'}
      </Button>
    </Form>
  );
};

export default DailyCheckForm;
