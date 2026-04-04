// app/midwife/register-patient/page.tsx
"use client";

import { Container, Spinner } from 'react-bootstrap';
import RegisterPatientForm from '@/components/RegisterPatientForm';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const RegisterPatientPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <Layout><p className="text-center mt-5"><Spinner animation="border" /> Loading...</p></Layout>;
  }

  if (!session || session.user.role !== 'MIDWIFE') {
    router.push('/login');
    return null;
  }

  return (
    <Layout>
      <Container className="mt-5 mb-5">
        <RegisterPatientForm />
      </Container>
    </Layout>
  );
};

export default RegisterPatientPage;
