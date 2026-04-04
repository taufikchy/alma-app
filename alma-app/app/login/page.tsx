// app/login/page.tsx
"use client";

import { useState } from 'react';
import Layout from '@/components/Layout';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT'); // Default role
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error message

    const result = await signIn('credentials', {
      redirect: false, // Jangan redirect secara otomatis
      email,
      password,
      role,
    });

    if (result?.error) {
      setError('Login gagal. Periksa email, password, dan peran Anda.');
    } else {
      // Redirect berdasarkan peran setelah login berhasil
      if (role === 'MIDWIFE') {
        router.push('/midwife/dashboard'); // Contoh: redirect ke dashboard bidan
      } else if (role === 'PATIENT') {
        router.push('/patient/dashboard'); // Contoh: redirect ke dashboard pasien
      } else {
        router.push('/'); // Default redirect
      }
    }
  };

  return (
    <Layout>
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <Card className="p-4 shadow-lg w-100" style={{ maxWidth: '25rem' }}>
          <Card.Body>
            <h2 className="text-center mb-4">Login ke ALMA</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Login sebagai:</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    label="Pasien"
                    name="roleOptions"
                    id="rolePatient"
                    value="PATIENT"
                    checked={role === 'PATIENT'}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    label="Bidan"
                    name="roleOptions"
                    id="roleMidwife"
                    value="MIDWIFE"
                    checked={role === 'MIDWIFE'}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100">
                Login
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
};

export default LoginPage;
