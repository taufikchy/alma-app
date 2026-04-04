// components/RegisterPatientForm.tsx
"use client";

import { useState } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const RegisterPatientForm = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    husbandName: '',
    age: '',
    phoneNumber: '',
    address: '',
    gestationalAge: '',
    pregnancyOrder: '',
    hasMiscarriage: false,
    miscarriageCount: '',
    lastMenstrualPeriod: '',
    estimatedDueDate: '',
    lastHemoglobin: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!session || session.user.role !== 'MIDWIFE') {
      setError('Unauthorized: Only midwives can register patients.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register patient');
      }

      setSuccess('Pasien berhasil didaftarkan!');
      setFormData({ // Reset form
        email: '',
        password: '',
        name: '',
        husbandName: '',
        age: '',
        phoneNumber: '',
        address: '',
        gestationalAge: '',
        pregnancyOrder: '',
        hasMiscarriage: false,
        miscarriageCount: '',
        lastMenstrualPeriod: '',
        estimatedDueDate: '',
        lastHemoglobin: '',
      });
      router.push('/midwife/dashboard'); // Redirect to midwife dashboard after successful registration
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftarkan pasien.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 shadow-lg">
      <Card.Body>
        <h2 className="text-center mb-4">Daftarkan Ibu Hamil Baru</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Label>Email Pasien</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Password Pasien</Form.Label>
                <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formName">
                <Form.Label>Nama Ibu Hamil</Form.Label>
                <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formHusbandName">
                <Form.Label>Nama Suami</Form.Label>
                <Form.Control type="text" name="husbandName" value={formData.husbandName} onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formAge">
                <Form.Label>Umur Ibu</Form.Label>
                <Form.Control type="number" name="age" value={formData.age} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formPhoneNumber">
                <Form.Label>No HP (Whatsapp)</Form.Label>
                <Form.Control type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formAddress">
                <Form.Label>Alamat</Form.Label>
                <Form.Control as="textarea" rows={3} name="address" value={formData.address} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formGestationalAge">
                <Form.Label>Usia Kehamilan (minggu)</Form.Label>
                <Form.Control type="number" name="gestationalAge" value={formData.gestationalAge} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formPregnancyOrder">
                <Form.Label>Kehamilan Ke Berapa</Form.Label>
                <Form.Control type="number" name="pregnancyOrder" value={formData.pregnancyOrder} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formHasMiscarriage">
                <Form.Check
                  type="checkbox"
                  label="Pernah Keguguran?"
                  name="hasMiscarriage"
                  checked={formData.hasMiscarriage}
                  onChange={handleChange}
                />
              </Form.Group>
              {formData.hasMiscarriage && (
                <Form.Group className="mb-3" controlId="formMiscarriageCount">
                  <Form.Label>Jumlah Keguguran</Form.Label>
                  <Form.Control type="number" name="miscarriageCount" value={formData.miscarriageCount} onChange={handleChange} />
                </Form.Group>
              )}
              <Form.Group className="mb-3" controlId="formLastMenstrualPeriod">
                <Form.Label>HPHT (Hari Pertama Haid Terakhir)</Form.Label>
                <Form.Control type="date" name="lastMenstrualPeriod" value={formData.lastMenstrualPeriod} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formEstimatedDueDate">
                <Form.Label>HPL (Hari Perkiraan Lahir)</Form.Label>
                <Form.Control type="date" name="estimatedDueDate" value={formData.estimatedDueDate} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formLastHemoglobin">
                <Form.Label>Data Lab Hemoglobin (HB) Terakhir</Form.Label>
                <Form.Control type="number" step="0.1" name="lastHemoglobin" value={formData.lastHemoglobin} onChange={handleChange} required />
              </Form.Group>
            </Col>
          </Row>
          <Button variant="primary" type="submit" className="w-100 mt-3" disabled={loading}>
            {loading ? 'Mendaftarkan...' : 'Daftarkan Pasien'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default RegisterPatientForm;
