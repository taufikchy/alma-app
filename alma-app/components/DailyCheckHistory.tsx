// components/DailyCheckHistory.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, ListGroup, Alert, Spinner, Badge } from 'react-bootstrap';

interface DailyCheck {
  id: string;
  date: string;
  takenMedication: boolean;
  photoUrl?: string;
  notes?: string;
}

interface DailyCheckHistoryProps {
  refreshTrigger?: number;
  patientId?: string;
}

const DailyCheckHistory: React.FC<DailyCheckHistoryProps> = ({ refreshTrigger = 0, patientId }) => {
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyChecks = useCallback(async () => {
    if (!patientId) {
      setError('Patient ID is required.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dailycheck?patientId=${patientId}`);
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
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchDailyChecks();
    }
  }, [patientId, refreshTrigger, fetchDailyChecks]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2 mb-0 text-muted">Memuat riwayat...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <Alert variant="danger" className="mb-0">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-alma-green text-white">
        <i className="bi bi-clipboard2-check me-2"></i>
        Riwayat Daily Check
      </Card.Header>
      <ListGroup variant="flush">
        {dailyChecks.length === 0 ? (
          <ListGroup.Item className="text-center text-muted py-4">
            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
            Belum ada riwayat daily check
          </ListGroup.Item>
        ) : (
          dailyChecks.map((check, index) => (
            <ListGroup.Item key={check.id} className="py-3">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Badge bg="primary" className="px-2 py-1">
                      <i className="bi bi-calendar3 me-1"></i>
                      {new Date(check.date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Badge>
                    {index === 0 && (
                      <Badge bg="success" className="px-2 py-1">
                        <i className="bi bi-star-fill me-1"></i>
                        Terbaru
                      </Badge>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span className={`fw-medium ${check.takenMedication ? 'text-success' : 'text-warning'}`}>
                      <i className={`bi ${check.takenMedication ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                      Obat Diminum: {check.takenMedication ? 'Ya' : 'Tidak'}
                    </span>
                  </div>
                  {check.notes && (
                    <p className="mb-0 mt-2 text-muted small">
                      <i className="bi bi-chat-left-text me-1"></i>
                      {check.notes}
                    </p>
                  )}
                </div>
                {check.photoUrl && (
                  <a
                    href={check.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary ms-2"
                  >
                    <i className="bi bi-image me-1"></i>
                    Foto
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