// app/patient/educational-materials/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Card, Alert, Spinner, Accordion } from 'react-bootstrap';

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
          const response = await fetch('/api/educational-materials');
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
    return <Layout><p className="text-center mt-5"><Spinner animation="border" /> Loading...</p></Layout>;
  }

  if (!session || (session.user.role !== 'PATIENT' && session.user.role !== 'MIDWIFE')) {
    return null; // Redirect handled by useEffect
  }

  return (
    <Layout>
      <Container className="mt-5 mb-5">
        <h1 className="mb-4 text-center">Materi Edukasi ALMA</h1>
        {error && <Alert variant="danger">{error}</Alert>}
        {materials.length === 0 ? (
          <Alert variant="info" className="text-center">Belum ada materi edukasi yang tersedia.</Alert>
        ) : (
          <Accordion defaultActiveKey="0">
            {materials.map((material, index) => (
              <Card key={material.id} className="mb-3 shadow-sm">
                <Accordion.Item eventKey={String(index)}>
                  <Accordion.Header>{material.title}</Accordion.Header>
                  <Accordion.Body>
                    <div dangerouslySetInnerHTML={{ __html: material.content }} />
                    {material.videoUrl1 && (
                      <div className="mt-3">
                        <h5>Video Terkait 1:</h5>
                        <div className="embed-responsive embed-responsive-16by9">
                          <iframe
                            className="embed-responsive-item"
                            src={`https://www.youtube.com/embed/${material.videoUrl1.split('v=')[1]?.split('&')[0]}`}
                            allowFullScreen
                            title={material.title}
                          ></iframe>
                        </div>
                      </div>
                    )}
                    {material.videoUrl2 && (
                      <div className="mt-3">
                        <h5>Video Terkait 2:</h5>
                        <div className="embed-responsive embed-responsive-16by9">
                          <iframe
                            className="embed-responsive-item"
                            src={`https://www.youtube.com/embed/${material.videoUrl2.split('v=')[1]?.split('&')[0]}`}
                            allowFullScreen
                            title={material.title}
                          ></iframe>
                        </div>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Card>
            ))}
          </Accordion>
        )}
      </Container>
    </Layout>
  );
};

export default EducationalMaterialsPage;
