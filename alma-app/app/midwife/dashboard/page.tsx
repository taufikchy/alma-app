// app/midwife/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Card, Table, Alert, Spinner, Button } from 'react-bootstrap';
import Link from 'next/link';

interface Patient {
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
}

const MidwifeDashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      if (status === 'authenticated' && session?.user && session.user.role === 'MIDWIFE') {
        try {
          const response = await fetch('/api/patients');
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch patients');
          }
          const data: Patient[] = await response.json();
          setPatients(data);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    fetchPatients();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return <Layout><p className="text-center mt-5"><Spinner animation="border" /> Loading...</p></Layout>;
  }

  if (!session || !session.user || session.user.role !== 'MIDWIFE') {
    return null; // Redirect handled by useEffect
  }

  return (
    <Layout>
      <Container className="mt-5">
        <h1 className="mb-4">Dashboard Bidan</h1>
        <div className="d-flex justify-content-end mb-3">
          <Link href="/midwife/register-patient" passHref>
            <Button variant="success">Daftarkan Pasien Baru</Button>
          </Link>
        </div>
        <Card className="shadow-sm">
          <Card.Body>
            <Card.Title>Daftar Ibu Hamil Terdaftar</Card.Title>
            {error && <Alert variant="danger">{error}</Alert>}
            {patients.length === 0 ? (
              <Alert variant="info">Belum ada ibu hamil yang terdaftar.</Alert>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Ibu</th>
                    <th>Nama Suami</th>
                    <th>Umur Ibu</th>
                    <th>No HP</th>
                    <th>Alamat</th>
                    <th>Usia Kehamilan</th>
                    <th>Kehamilan Ke</th>
                    <th>Keguguran?</th>
                    <th>HPHT</th>
                    <th>HPL</th>
                    <th>HB Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient, index) => (
                    <tr key={patient.id}>
                      <td>{index + 1}</td>
                      <td>{patient.name}</td>
                      <td>{patient.husbandName}</td>
                      <td>{patient.age}</td>
                      <td>{patient.phoneNumber}</td>
                      <td>{patient.address}</td>
                      <td>{patient.gestationalAge} minggu</td>
                      <td>{patient.pregnancyOrder}</td>
                      <td>{patient.hasMiscarriage ? `Ya (${patient.miscarriageCount || 0} kali)` : 'Tidak'}</td>
                      <td>{new Date(patient.lastMenstrualPeriod).toLocaleDateString()}</td>
                      <td>{new Date(patient.estimatedDueDate).toLocaleDateString()}</td>
                      <td>{patient.lastHemoglobin}</td>
                      <td>
                        <Link href={`/midwife/patients/${patient.id}`} passHref>
                          <Button variant="info" size="sm" className="me-2">Detail</Button>
                        </Link>
                        <Button variant="warning" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};

export default MidwifeDashboardPage;
