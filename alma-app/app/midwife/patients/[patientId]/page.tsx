// app/midwife/patients/[patientId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import DailyCheckHistory from '@/components/DailyCheckHistory'; // Re-use this component

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
  // Add other patient details as needed
}

const PatientDetailPage = ({ params }: { params: { patientId: string } }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { patientId } = params;

  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (status === 'authenticated' && session?.user?.role === 'MIDWIFE') {
        try {
          // Fetch patient details (you might need a new API route for single patient details)
          // For now, let's assume we can get it from the /api/patients route by filtering
          const response = await fetch(`/api/patients`); // This API currently fetches all patients for a midwife
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch patient details');
          }
          const allPatients: PatientDetails[] = await response.json();
          const foundPatient = allPatients.find(p => p.id === patientId);

          if (foundPatient) {
            setPatient(foundPatient);
          } else {
            setError('Patient not found or not registered under this midwife.');
          }
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    fetchPatientDetails();
  }, [session, status, router, patientId]);

  if (status === 'loading' || loading) {
    return <Layout><p className="text-center mt-5"><Spinner animation="border" /> Loading...</p></Layout>;
  }

  if (!session || session.user.role !== 'MIDWIFE') {
    return null; // Redirect handled by useEffect
  }

  if (error) {
    return (
      <Layout>
        <Container className="mt-5">
          <Alert variant="danger">{error}</Alert>
        </Container>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout>
        <Container className="mt-5">
          <Alert variant="warning">Pasien tidak ditemukan.</Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container className="mt-5">
        <h1 className="mb-4">Detail Pasien: {patient.name}</h1>
        <Card className="mb-4 shadow-sm">
          <Card.Header>Informasi Pribadi</Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Nama Ibu:</strong> {patient.name}</p>
                <p><strong>Nama Suami:</strong> {patient.husbandName}</p>
                <p><strong>Umur Ibu:</strong> {patient.age} tahun</p>
                <p><strong>No HP:</strong> {patient.phoneNumber}</p>
                <p><strong>Alamat:</strong> {patient.address}</p>
              </Col>
              <Col md={6}>
                <p><strong>Usia Kehamilan:</strong> {patient.gestationalAge} minggu</p>
                <p><strong>Kehamilan Ke:</strong> {patient.pregnancyOrder}</p>
                <p><strong>Pernah Keguguran:</strong> {patient.hasMiscarriage ? `Ya (${patient.miscarriageCount || 0} kali)` : 'Tidak'}</p>
                <p><strong>HPHT:</strong> {new Date(patient.lastMenstrualPeriod).toLocaleDateString()}</p>
                <p><strong>HPL:</strong> {new Date(patient.estimatedDueDate).toLocaleDateString()}</p>
                <p><strong>HB Terakhir:</strong> {patient.lastHemoglobin}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <h2 className="mb-3 mt-5">Riwayat Daily Check</h2>
        {/* DailyCheckHistory component expects patientId, but our current API needs userId.
            We need to adjust the DailyCheckHistory component to accept patientId directly
            and pass it to the API call.
            For now, we'll pass the patient.id as if it were userId for demonstration.
            This will require a small adjustment in DailyCheckHistory.tsx to use patientId prop.
        */}
        <DailyCheckHistory patientId={patient.id} refreshTrigger={0} />
      </Container>
    </Layout>
  );
};

export default PatientDetailPage;
