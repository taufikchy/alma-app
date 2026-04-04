// components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from 'react-bootstrap';
import { useEffect } from 'react';

const Navbar = () => {
  const { data: session } = useSession();

  useEffect(() => {
// components/Navbar.tsx
    import('bootstrap/dist/js/bootstrap.bundle.min.js').catch(() => {});
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-alma">
      <div className="container-fluid">
        <Link className="navbar-brand" href="/">ALMA</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" href="/">Home</Link>
            </li>
            {session ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/patient/educational-materials">Materi Edukasi</Link>
                </li>
                {session.user.role === 'PATIENT' && (
                  <li className="nav-item">
                    <Link className="nav-link" href="/patient/dashboard">Dashboard Pasien</Link>
                  </li>
                )}
                {session.user.role === 'MIDWIFE' && (
                  <li className="nav-item">
                    <Link className="nav-link" href="/midwife/dashboard">Dashboard Bidan</Link>
                  </li>
                )}
                <li className="nav-item">
                  <Button variant="link" className="nav-link" onClick={() => signOut()}>Logout</Button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" href="/login">Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
