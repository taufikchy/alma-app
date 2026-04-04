// app/patient/dashboard/page.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import DailyCheckForm from '@/components/DailyCheckForm';
import DailyCheckHistory from '@/components/DailyCheckHistory';

interface PatientDetails {
  id: string;
  name: string;
  husbandName: string;
  age: number;
  phoneNumber: string;
  address: string;
  gestationalAge: number;
  pregnancyOrder: number;
  hasMiscarriage: boolean;
  miscarriageCount?: number;
  lastMenstrualPeriod: string;
  estimatedDueDate: string;
  lastHemoglobin: number;
  midwife: {
    name: string;
  };
  dailyChecks?: {
    id: string;
    date: string;
    takenMedication: boolean;
    photoUrl?: string | null;
    notes?: string | null;
  }[];
}

const PatientDashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(true);
  const [errorPatientDetails, setErrorPatientDetails] = useState<string | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [alreadyCheckedToday, setAlreadyCheckedToday] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);

  const checkTodaySubmission = useCallback((checks?: { date: string }[]) => {
    if (checks && checks.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const latestCheck = new Date(checks[0].date);
      latestCheck.setHours(0, 0, 0, 0);

      if (latestCheck.getTime() === today.getTime()) {
        setAlreadyCheckedToday(true);
      } else {
        setAlreadyCheckedToday(false);
      }
    } else {
      setAlreadyCheckedToday(false);
    }
  }, []);

  const handleDailyCheckSubmitted = useCallback(() => {
    setRefreshHistory(prev => prev + 1);
    setAlreadyCheckedToday(true);
  }, []);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (status === 'authenticated' && session?.user && session?.user?.role === 'PATIENT' && session?.user?.id) {
        try {
          const response = await fetch('/api/patient-details', {
            credentials: 'include',
          });

          if (response.status === 401) {
            router.push('/login');
            return;
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
          }

          const data: PatientDetails = await response.json();
          setPatientDetails(data);
          checkTodaySubmission(data.dailyChecks);
          setErrorPatientDetails(null);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while fetching patient details.';
          setErrorPatientDetails(errorMessage);
        } finally {
          setLoadingPatientDetails(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    fetchPatientDetails();
  }, [session, status, router, refreshHistory, checkTodaySubmission]);

  useEffect(() => {
    const checkAndNotify = () => {
      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour >= 19 && !hasPlayedRef.current && !alreadyCheckedToday) {
        setShowReminder(true);
        hasPlayedRef.current = true;
      }
    };

    checkAndNotify();

    const interval = setInterval(checkAndNotify, 60000);
    return () => clearInterval(interval);
  }, [alreadyCheckedToday]);

  useEffect(() => {
    if (showReminder) {
      audioRef.current = new Audio('https://www.youtube.com/watch?v=RJZYCIRRKgo');
      try {
        audioRef.current.play().catch(() => {});
      } catch {}

      const interval = setInterval(() => {
        try {
          audioRef.current?.play().catch(() => {});
        } catch {}
      }, 60000);

      return () => {
        clearInterval(interval);
        audioRef.current?.pause();
      };
    }
  }, [showReminder]);

  if (status === 'loading' || loadingPatientDetails) {
    return (
      <Layout>
        <div className="text-center mt-5">
          <Spinner animation="border" />
          <p className="mt-3">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!session || session.user.role !== 'PATIENT') {
    return null;
  }

  if (errorPatientDetails) {
    return (
      <Layout>
        <Container className="mt-5">
          <Alert variant="danger" className="text-center">{errorPatientDetails}</Alert>
        </Container>
      </Layout>
    );
  }

  if (!patientDetails) {
    return (
      <Layout>
        <Container className="mt-5">
          <Alert variant="warning" className="text-center">Detail pasien tidak ditemukan.</Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-4">
        <Container>
          {showReminder && !alreadyCheckedToday && (
            <Alert variant="warning" className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center flex-grow-1">
                <i className="bi bi-alarm-fill me-2 fs-4 text-danger"></i>
                <div>
                  <strong className="d-block">Ayoo Bunddaa 🌸</strong>
                  <span>Jangan Lupa Minum Tablet Tambah Darah (TTD) atau MMS yaaa!!!</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowReminder(false)}
                aria-label="Close"
              ></button>
            </Alert>
          )}

          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="fw-bold text-alma-green mb-2">
                <i className="bi bi-heart-pulse me-2"></i>
                Selamat Datang, {patientDetails.name}!
              </h3>
              <p className="text-muted mb-0">Dashboard Pasien - Ayo Lawan Anemia</p>
              {alreadyCheckedToday && (
                <Badge bg="success" className="mt-2 px-3 py-2">
                  <i className="bi bi-check-circle me-1"></i>
                  Daily Check hari ini sudah selesai!
                </Badge>
              )}
            </Card.Body>
          </Card>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="card-header-alma text-center">
                  <i className="bi bi-person me-2"></i>
                  <span className="fw-bold">Informasi Bidan</span>
                </Card.Header>
                <Card.Body className="text-center">
                  <i className="bi bi-clipboard2-pulse fs-1 text-alma-green mb-3 d-block"></i>
                  <p className="mb-1"><strong>Bidan Anda:</strong></p>
                  <h5 className="text-alma-green">{patientDetails.midwife?.name || 'N/A'}</h5>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="card-header-alma-pink text-center">
                  <i className="bi bi-heart-pulse me-2"></i>
                  <span className="fw-bold">Info Kehamilan</span>
                </Card.Header>
                <Card.Body className="text-center">
                  <Row className="g-3">
                    <Col xs={6}>
                      <Badge bg="primary" className="badge-alma d-block mb-2 px-3 py-2">
                        <i className="bi bi-calendar3 me-1"></i>
                        {patientDetails.gestationalAge} Minggu
                      </Badge>
                      <small className="text-muted">Usia Kehamilan</small>
                    </Col>
                    <Col xs={6}>
                      <Badge bg="info" className="badge-alma d-block mb-2 px-3 py-2">
                        <i className="bi bi-calendar-check me-1"></i>
                        {new Date(patientDetails.estimatedDueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Badge>
                      <small className="text-muted">HPL</small>
                    </Col>
                    <Col xs={6}>
                      <Badge bg={patientDetails.lastHemoglobin < 11 ? 'warning' : 'success'} className="badge-alma d-block mb-2 px-3 py-2">
                        <i className="bi bi-droplet me-1"></i>
                        {patientDetails.lastHemoglobin} g/dL
                      </Badge>
                      <small className="text-muted">HB Terakhir</small>
                    </Col>
                    <Col xs={6}>
                      <Badge bg={patientDetails.hasMiscarriage ? 'warning' : 'secondary'} className="badge-alma d-block mb-2 px-3 py-2">
                        <i className="bi bi-activity me-1"></i>
                        {patientDetails.hasMiscarriage ? `${patientDetails.miscarriageCount || 0}x` : 'Tidak'}
                      </Badge>
                      <small className="text-muted">Riwayat Keguguran</small>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4">
            <Col md={6}>
              {alreadyCheckedToday ? (
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <i className="bi bi-check-circle-fill text-success fs-5 mb-3 d-block"></i>
                    <h5 className="text-success fw-bold mb-2">Daily Check Selesai!</h5>
                    <p className="text-muted mb-0">
                      Kamu sudah melakukan daily check hari ini.<br />
                      Sampai jumpa besok ya! 😊
                    </p>
                    <Badge bg="success" className="mt-3 px-3 py-2">
                      <i className="bi bi-calendar-check me-1"></i>
                      Cek lagi besok
                    </Badge>
                  </Card.Body>
                </Card>
              ) : (
                <DailyCheckForm onDailyCheckSubmitted={handleDailyCheckSubmitted} />
              )}
            </Col>
            <Col md={6}>
              <DailyCheckHistory
                refreshTrigger={refreshHistory}
                patientId={patientDetails.id}
                initialData={patientDetails.dailyChecks}
              />
            </Col>
          </Row>
        </Container>
      </div>
    </Layout>
  );
};

export default PatientDashboardPage;