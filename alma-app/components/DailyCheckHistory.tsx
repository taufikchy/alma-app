// components/DailyCheckHistory.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, ListGroup, Alert, Spinner } from 'react-bootstrap';

interface DailyCheck {
  id: string;
  date: string;
  takenMedication: boolean;
  photoUrl?: string;
  notes?: string;
}

interface DailyCheckHistoryProps {
  refreshTrigger: number; // Prop to trigger refresh
  patientId?: string; // Optional patient ID for midwife to view specific patient's history
}

const DailyCheckHistory: React.FC<DailyCheckHistoryProps> = ({ refreshTrigger, patientId }) => {
  const { data: session } = useSession();
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyChecks = useCallback(async () => {
    const idToFetch = patientId || session?.user?.id;

    if (!idToFetch) {
      setError('User or patient ID not available.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dailycheck?patientId=${idToFetch}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch daily checks');
      }
      const data: DailyCheck[] = await response.json();
      setDailyChecks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [patientId, session?.user?.id]);

  useEffect(() => {
    fetchDailyChecks();
  }, [session, refreshTrigger, patientId, fetchDailyChecks]); // Re-fetch when session, refreshTrigger, or patientId is updated

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Card className="shadow-sm">
      <Card.Header>Riwayat Daily Check</Card.Header>
      <ListGroup variant="flush">
        {dailyChecks.length === 0 ? (
          <ListGroup.Item>Belum ada riwayat daily check.</ListGroup.Item>
        ) : (
          dailyChecks.map((check) => (
            <ListGroup.Item key={check.id}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Tanggal:</strong> {new Date(check.date).toLocaleDateString()}
                  <br />
                  <strong>Obat Diminum:</strong> {check.takenMedication ? 'Ya' : 'Tidak'}
                  {check.notes && (
                    <>
                      <br />
                      <strong>Catatan:</strong> {check.notes}
                    </>
                  )}
                </div>
                {check.photoUrl && (
                  <a href={check.photoUrl} target="_blank" rel="noopener noreferrer">
                    Lihat Bukti Foto
                  </a>
                )}
              </div>
            </ListGroup.Item>
          ))
        )}
      </ListGroup>
    </Card>
  );
};

export default DailyCheckHistory;
