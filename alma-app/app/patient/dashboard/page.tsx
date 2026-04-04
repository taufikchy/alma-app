// app/patient/dashboard/page.tsx
"use client";

import { useState, useCallback, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
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
}

const PatientDashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(true);
  const [errorPatientDetails, setErrorPatientDetails] = useState<string | null>(null);

  const handleDailyCheckSubmitted = useCallback(() => {
    setRefreshHistory(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (status === 'authenticated' && session?.user?.role === 'PATIENT') {
        try {
          const response = await fetch('/api/patient-details');
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch patient details');
          }
          const data: PatientDetails = await response.json();
          setPatientDetails(data);
        } catch (err: unknown) {
          setErrorPatientDetails(err instanceof Error ? err.message : 'An unexpected error occurred while fetching patient details.');
        } finally {
          setLoadingPatientDetails(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    fetchPatientDetails();
  }, [session, status, router]);

  if (status === 'loading' || loadingPatientDetails) {
    return <Layout><p className="text-center mt-5"><Spinner animation="border" /> Loading...</p></Layout>;
  }

  if (!session || session.user.role !== 'PATIENT') {
    return null;
  }

  if (errorPatientDetails) {
    return (
      <Layout>
        <Container className="mt-5">
          <Alert variant="danger">{errorPatientDetails}</Alert>
        </Container>
      </Layout>
    );
  }

  if (!patientDetails) {
    return (
      <Layout>
        <Container className="mt-5">
          <Alert variant="warning">Detail pasien tidak ditemukan.</Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container className="mt-5">
        <h1 className="mb-4">Dashboard Pasien</h1>
        <Row>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Selamat Datang, {patientDetails.name}!</Card.Title>
                <Card.Text>
                  Ini adalah dashboard Anda. Di sini Anda bisa melihat informasi kesehatan Anda dan melakukan daily check.
                </Card.Text>
                <Card.Text>
                  <strong>Bidan Anda:</strong> {patientDetails.midwife?.name || 'N/A'}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Informasi Kesehatan Selayang Pandang</Card.Title>
                <Card.Text>
                  <strong>Usia Kehamilan:</strong> {patientDetails.gestationalAge} minggu
                </Card.Text>
                <Card.Text>
                  <strong>HPL:</strong> {new Date(patientDetails.estimatedDueDate).toLocaleDateString()}
                </Card.Text>
                <Card.Text>
                  <strong>HB Terakhir:</strong> {patientDetails.lastHemoglobin}
                </Card.Text>
                <Card.Text>
                  <strong>Pernah Keguguran:</strong> {patientDetails.hasMiscarriage ? `Ya (${patientDetails.miscarriageCount || 0} kali)` : 'Tidak'}
                </Card.Text>
                {/* Tambahkan informasi lain yang relevan */}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col md={6}>
            <DailyCheckForm onDailyCheckSubmitted={handleDailyCheckSubmitted} />
          </Col>
          <Col md={6}>
            <DailyCheckHistory refreshTrigger={refreshHistory} patientId={patientDetails.id} />
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};

export default PatientDashboardPage;
