// components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Dropdown } from 'react-bootstrap';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { data: session } = useSession();
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js').catch(() => {});
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      if (session?.user?.id) {
        try {
          if (session.user.role === 'MIDWIFE') {
            const response = await fetch('/api/midwife-profile', { credentials: 'include' });
            if (response.ok) {
              const data = await response.json();
              setDisplayName(data.name);
            } else {
              setDisplayName(session.user.username || 'User');
            }
          } else if (session.user.role === 'PATIENT') {
            const response = await fetch('/api/patient-profile', { credentials: 'include' });
            if (response.ok) {
              const data = await response.json();
              setDisplayName(data.name);
            } else {
              setDisplayName(session.user.username || 'User');
            }
          }
        } catch {
          setDisplayName(session.user.username || 'User');
        }
      }
    };

    fetchUserName();
  }, [session]);

  const getRoleName = (role: string) => {
    switch (role) {
      case 'MIDWIFE':
        return 'Bidan';
      case 'PATIENT':
        return 'Pasien';
      default:
        return role;
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-alma sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" href="/">
          <span className="fs-4 fw-bold text-alma-green">ALMA</span>
          <span className="fs-4 fw-bold text-alma-pink"> 🌸</span>
        </Link>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item mx-1">
              <Link className="nav-link text-center" href="/">
                <i className="bi bi-house-door me-1"></i> Beranda
              </Link>
            </li>
            {session ? (
              <>
                <li className="nav-item mx-1">
                  <Link className="nav-link text-center" href="/patient/educational-materials">
                    <i className="bi bi-book me-1"></i> Materi Edukasi
                  </Link>
                </li>
                {session.user.role === 'PATIENT' && (
                  <li className="nav-item mx-1">
                    <Link className="nav-link text-center" href="/patient/dashboard">
                      <i className="bi bi-person me-1"></i> Dashboard Pasien
                    </Link>
                  </li>
                )}
                {session.user.role === 'MIDWIFE' && (
                  <>
                    <li className="nav-item mx-1">
                      <Link className="nav-link text-center" href="/midwife/dashboard">
                        <i className="bi bi-clipboard2-pulse me-1"></i> Dashboard Bidan
                      </Link>
                    </li>
                    <li className="nav-item mx-1">
                      <Link className="nav-link text-center" href="/midwife/dailycheck">
                        <i className="bi bi-clipboard2-check me-1"></i> Daily Check
                      </Link>
                    </li>
                  </>
                )}
                <li className="nav-item mx-1">
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="light" size="sm" className="d-flex align-items-center">
                      <i className="bi bi-person-circle me-1"></i>
                      {displayName || session.user.username || 'User'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item className="text-muted">
                        <i className="bi bi-person me-2"></i>{session.user.username}
                      </Dropdown.Item>
                      <Dropdown.Item className="text-muted">
                        <i className="bi bi-shield me-2"></i>Role: {getRoleName(session.user.role)}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => signOut()} className="text-danger">
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </li>
              </>
            ) : (
              <li className="nav-item mx-1">
                <Link href="/login" className="btn btn-sm px-3 text-center" style={{ backgroundColor: '#2E7D32', color: 'white' }}>
                  <i className="bi bi-box-arrow-in-right me-1"></i> Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;