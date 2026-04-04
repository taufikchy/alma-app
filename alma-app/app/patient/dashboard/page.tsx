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
    createdAt: string;
  }[];
}

const getHbClassification = (hb: number) => {
  if (hb >= 11) {
    return { text: 'Normal (Tidak Anemia)', variant: 'success' };
  } else if (hb >= 9 && hb <= 10.9) {
    return { text: 'Anemia Ringan', variant: 'warning' };
  } else if (hb >= 7 && hb <= 8.9) {
    return { text: 'Anemia Sedang', variant: 'danger' };
  } else {
    return { text: 'Anemia Berat', variant: 'danger' };
  }
};

const PatientDashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(true);
  const [errorPatientDetails, setErrorPatientDetails] = useState<string | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [alreadyCheckedToday, setAlreadyCheckedToday] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
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
    setShowReminder(false);
    hasPlayedRef.current = false;
    setIsAlarmPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
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

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillator1Ref = useRef<OscillatorNode | null>(null);
  const oscillator2Ref = useRef<OscillatorNode | null>(null);
  const gain1Ref = useRef<GainNode | null>(null);
  const gain2Ref = useRef<GainNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);

  const playNotificationSound = useCallback(() => {
    if (isPlayingRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      const audioContext = audioContextRef.current;

      isPlayingRef.current = true;
      setIsAlarmPlaying(true);

      let toggle = true;

      const playTone = () => {
        if (!isPlayingRef.current || !audioContext) return;

        if (toggle) {
          if (oscillator1Ref.current) {
            try { oscillator1Ref.current.stop(); } catch {}
            oscillator1Ref.current = null;
          }
          if (gain1Ref.current) {
            try { gain1Ref.current.disconnect(); } catch {}
            gain1Ref.current = null;
          }

          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = 880;
          osc.type = 'square';
          gain.gain.value = 0.3;
          osc.start();
          oscillator1Ref.current = osc;
          gain1Ref.current = gain;
        } else {
          if (oscillator2Ref.current) {
            try { oscillator2Ref.current.stop(); } catch {}
            oscillator2Ref.current = null;
          }
          if (gain2Ref.current) {
            try { gain2Ref.current.disconnect(); } catch {}
            gain2Ref.current = null;
          }

          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = 660;
          osc.type = 'square';
          gain.gain.value = 0.3;
          osc.start();
          oscillator2Ref.current = osc;
          gain2Ref.current = gain;
        }
        toggle = !toggle;
      };

      playTone();
      intervalRef.current = setInterval(playTone, 300);

    } catch (e) {
      console.error('Audio play error:', e);
      isPlayingRef.current = false;
      setIsAlarmPlaying(false);
    }
  }, []);

  const stopNotificationSound = useCallback(() => {
    isPlayingRef.current = false;
    setIsAlarmPlaying(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      if (oscillator1Ref.current) {
        oscillator1Ref.current.stop();
        oscillator1Ref.current.disconnect();
        oscillator1Ref.current = null;
      }
      if (oscillator2Ref.current) {
        oscillator2Ref.current.stop();
        oscillator2Ref.current.disconnect();
        oscillator2Ref.current = null;
      }
      if (gain1Ref.current) {
        gain1Ref.current.disconnect();
        gain1Ref.current = null;
      }
      if (gain2Ref.current) {
        gain2Ref.current.disconnect();
        gain2Ref.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (e) {
      console.error('Error stopping audio:', e);
    }
  }, []);

  const showBrowserNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🌸 ALMA - Reminder Minum TTD', {
        body: 'Jangan lupa minum Tablet Tambah Darah (TTD) atau MMS hari ini ya Bund!',
        icon: '/favicon.ico',
        tag: 'alma-reminder',
        requireInteraction: true,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('🌸 ALMA - Reminder Minum TTD', {
            body: 'Jangan lupa minum Tablet Tambah Darah (TTD) atau MMS hari ini ya Bund!',
            icon: '/favicon.ico',
            tag: 'alma-reminder',
            requireInteraction: true,
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      stopNotificationSound();
      hasPlayedRef.current = false;
    }
  }, [status, stopNotificationSound]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      stopNotificationSound();
      hasPlayedRef.current = false;
      setShowReminder(false);
    }
  }, []);

  const checkAndNotifyRef = useRef<() => void>(() => {});

  useEffect(() => {
    const performNotify = () => {
      if (!session || session.user?.role !== 'PATIENT') return;
      if (hasPlayedRef.current) return;
      if (alreadyCheckedToday) return;

      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour >= 19) {
        setShowReminder(true);
        setIsAlarmPlaying(true);
        showBrowserNotification();
        hasPlayedRef.current = true;

        try {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch {}
          }
          audioContextRef.current = new AudioContextClass();
          const audioContext = audioContextRef.current;
          let toggle = true;

          const playTone = () => {
            if (!hasPlayedRef.current || !audioContext) return;

            if (toggle) {
              if (oscillator1Ref.current) {
                try { oscillator1Ref.current.stop(); } catch {}
                oscillator1Ref.current = null;
              }
              if (gain1Ref.current) {
                try { gain1Ref.current.disconnect(); } catch {}
                gain1Ref.current = null;
              }

              const osc = audioContext.createOscillator();
              const gain = audioContext.createGain();
              osc.connect(gain);
              gain.connect(audioContext.destination);
              osc.frequency.value = 880;
              osc.type = 'square';
              gain.gain.value = 0.3;
              osc.start();
              oscillator1Ref.current = osc;
              gain1Ref.current = gain;
            } else {
              if (oscillator2Ref.current) {
                try { oscillator2Ref.current.stop(); } catch {}
                oscillator2Ref.current = null;
              }
              if (gain2Ref.current) {
                try { gain2Ref.current.disconnect(); } catch {}
                gain2Ref.current = null;
              }

              const osc = audioContext.createOscillator();
              const gain = audioContext.createGain();
              osc.connect(gain);
              gain.connect(audioContext.destination);
              osc.frequency.value = 660;
              osc.type = 'square';
              gain.gain.value = 0.3;
              osc.start();
              oscillator2Ref.current = osc;
              gain2Ref.current = gain;
            }
            toggle = !toggle;
          };

          playTone();
          intervalRef.current = setInterval(playTone, 300);
        } catch (e) {
          console.error('Audio play error:', e);
        }
      }
    };

    checkAndNotifyRef.current = performNotify;
    performNotify();

    const interval = setInterval(performNotify, 30000);
    return () => {
      clearInterval(interval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
        audioContextRef.current = null;
      }
      hasPlayedRef.current = false;
    };
  }, [alreadyCheckedToday, showBrowserNotification, session]);

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
            <Alert variant="danger" className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ fontSize: '1.1rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(220, 53, 69, 0.4)' }}>
              <div className="d-flex align-items-center flex-grow-1">
                <i className={`bi bi-bell-fill me-3 fs-2 ${isAlarmPlaying ? 'animate-bell' : ''}`}></i>
                <div>
                  <strong className="d-block fs-5">🔔 Reminder Minum TTD! 🔔</strong>
                  <span>Jangan lupa minum Tablet Tambah Darah (TTD) atau MMS ya Bund!</span>
                </div>
              </div>
              <div className="d-flex gap-2 align-items-center">
                {isAlarmPlaying ? (
                  <button
                    type="button"
                    className="btn btn-lg btn-danger fw-bold"
                    onClick={() => {
                      hasPlayedRef.current = false;
                      setIsAlarmPlaying(false);
                      setShowReminder(false);
                      if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                      }
                      if (oscillator1Ref.current) {
                        try { oscillator1Ref.current.stop(); } catch {}
                        oscillator1Ref.current = null;
                      }
                      if (oscillator2Ref.current) {
                        try { oscillator2Ref.current.stop(); } catch {}
                        oscillator2Ref.current = null;
                      }
                      if (audioContextRef.current) {
                        try { audioContextRef.current.close(); } catch {}
                        audioContextRef.current = null;
                      }
                    }}
                    title="Matikan alarm"
                  >
                    <i className="bi bi-stop-fill me-2"></i>
                    MATIKAN ALARM
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-lg btn-outline-primary"
                    onClick={() => {
                      setIsAlarmPlaying(true);
                      hasPlayedRef.current = true;

                      try {
                        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                        if (audioContextRef.current) {
                          try { audioContextRef.current.close(); } catch {}
                        }
                        audioContextRef.current = new AudioContextClass();
                        const audioContext = audioContextRef.current;
                        let toggle = true;

                        const playTone = () => {
                          if (!hasPlayedRef.current || !audioContext) return;

                          if (toggle) {
                            if (oscillator1Ref.current) {
                              try { oscillator1Ref.current.stop(); } catch {}
                              oscillator1Ref.current = null;
                            }
                            if (gain1Ref.current) {
                              try { gain1Ref.current.disconnect(); } catch {}
                              gain1Ref.current = null;
                            }

                            const osc = audioContext.createOscillator();
                            const gain = audioContext.createGain();
                            osc.connect(gain);
                            gain.connect(audioContext.destination);
                            osc.frequency.value = 880;
                            osc.type = 'square';
                            gain.gain.value = 0.3;
                            osc.start();
                            oscillator1Ref.current = osc;
                            gain1Ref.current = gain;
                          } else {
                            if (oscillator2Ref.current) {
                              try { oscillator2Ref.current.stop(); } catch {}
                              oscillator2Ref.current = null;
                            }
                            if (gain2Ref.current) {
                              try { gain2Ref.current.disconnect(); } catch {}
                              gain2Ref.current = null;
                            }

                            const osc = audioContext.createOscillator();
                            const gain = audioContext.createGain();
                            osc.connect(gain);
                            gain.connect(audioContext.destination);
                            osc.frequency.value = 660;
                            osc.type = 'square';
                            gain.gain.value = 0.3;
                            osc.start();
                            oscillator2Ref.current = osc;
                            gain2Ref.current = gain;
                          }
                          toggle = !toggle;
                        };

                        playTone();
                        intervalRef.current = setInterval(playTone, 300);
                      } catch (e) {
                        console.error('Audio play error:', e);
                      }
                    }}
                    title="Putar alarm"
                  >
                    <i className="bi bi-volume-up me-2"></i>
                    PUTAR ALARM
                  </button>
                )}
                <button
                  type="button"
                  className="btn-close btn-close-lg"
                  onClick={() => {
                    hasPlayedRef.current = false;
                    setIsAlarmPlaying(false);
                    setShowReminder(false);
                    if (intervalRef.current) {
                      clearInterval(intervalRef.current);
                      intervalRef.current = null;
                    }
                    if (audioContextRef.current) {
                      try { audioContextRef.current.close(); } catch {}
                      audioContextRef.current = null;
                    }
                  }}
                  aria-label="Close"
                ></button>
              </div>
            </Alert>
          )}

          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="fw-bold text-alma-green mb-2">
                <i className="bi bi-heart-pulse me-2"></i>
                Selamat Datang, {patientDetails.name}!
              </h3>
              <p className="text-muted mb-0">Dashboard Pasien - Alarm Lawan Anemia</p>
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
                      {patientDetails.lastHemoglobin !== null && patientDetails.lastHemoglobin !== undefined ? (
                        <>
                          <Badge bg={getHbClassification(patientDetails.lastHemoglobin).variant} className="badge-alma d-block mb-2 px-3 py-2">
                            <i className="bi bi-droplet me-1"></i>
                            {patientDetails.lastHemoglobin} g/dL
                          </Badge>
                          <small className="text-muted">
                            {getHbClassification(patientDetails.lastHemoglobin).text}
                          </small>
                        </>
                      ) : (
                        <>
                          <Badge bg="secondary" className="badge-alma d-block mb-2 px-3 py-2">
                            <i className="bi bi-droplet me-1"></i>
                            N/A
                          </Badge>
                          <small className="text-muted">HB Terakhir</small>
                        </>
                      )}
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