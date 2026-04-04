// app/patient/educational-materials/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Card, Alert, Spinner, Accordion, Badge } from 'react-bootstrap';

interface EducationalMaterial {
  id: string;
  title: string;
  content: string;
  videoUrl1?: string;
  videoUrl2?: string;
}

const EducationalMaterialsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [materials, setMaterials] = useState<EducationalMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (status === 'authenticated' && (session?.user?.role === 'PATIENT' || session?.user?.role === 'MIDWIFE')) {
        try {
          const response = await fetch('/api/educational-materials', { credentials: 'include' });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch educational materials');
          }
          const data: EducationalMaterial[] = await response.json();
          setMaterials(data);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    fetchMaterials();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="text-center mt-5">
          <Spinner animation="border" />
          <p className="mt-3">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!session || (session.user.role !== 'PATIENT' && session.user.role !== 'MIDWIFE')) {
    return null;
  }

  return (
    <Layout>
      <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-4">
        <Container>
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="text-center py-4">
              <h2 className="fw-bold text-alma-green mb-2">
                <i className="bi bi-book me-2"></i>
                Materi Edukasi ALMA
              </h2>
              <p className="text-muted mb-0">Pelajari informasi penting tentang kesehatan ibu hamil</p>
            </Card.Body>
          </Card>

          {error && <Alert variant="danger" className="text-center">{error}</Alert>}

          {materials.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <i className="bi bi-book fs-1 text-muted d-block mb-3"></i>
                <p className="text-muted mb-0">Belum ada materi edukasi yang tersedia.</p>
              </Card.Body>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <Accordion defaultActiveKey="0">
                {materials.map((material, index) => (
                  <Accordion.Item key={material.id} eventKey={String(index)}>
                    <Accordion.Header className="fw-bold">
                      <i className="bi bi-journal-text me-2 text-alma-green"></i>
                      {material.title}
                    </Accordion.Header>
                    <Accordion.Body>
                      <div className="mb-3" dangerouslySetInnerHTML={{ __html: material.content }} />
                      {material.videoUrl1 && (
                        <div className="mt-3 text-center">
                          <Badge bg="info" className="badge-alma mb-2 px-3 py-2">
                            <i className="bi bi-play-circle me-1"></i>
                            Video Terkait 1
                          </Badge>
                          <div className="embed-responsive embed-responsive-16by9">
                            <iframe
                              className="embed-responsive-item w-100 rounded"
                              style={{ height: '300px' }}
                              src={`https://www.youtube.com/embed/${material.videoUrl1.split('v=')[1]?.split('&')[0]}`}
                              allowFullScreen
                              title={material.title}
                            ></iframe>
                          </div>
                        </div>
                      )}
                      {material.videoUrl2 && (
                        <div className="mt-3 text-center">
                          <Badge bg="info" className="badge-alma mb-2 px-3 py-2">
                            <i className="bi bi-play-circle me-1"></i>
                            Video Terkait 2
                          </Badge>
                          <div className="embed-responsive embed-responsive-16by9">
                            <iframe
                              className="embed-responsive-item w-100 rounded"
                              style={{ height: '300px' }}
                              src={`https://www.youtube.com/embed/${material.videoUrl2.split('v=')[1]?.split('&')[0]}`}
                              allowFullScreen
                              title={material.title}
                            ></iframe>
                          </div>
                        </div>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card>
          )}
        </Container>
      </div>
    </Layout>
  );
};

export default EducationalMaterialsPage;