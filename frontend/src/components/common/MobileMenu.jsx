'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const MobileMenu = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="nav-links desktop-nav">
        <Link href="/blogg" className="nav-link">Blogg</Link>
        <Link href="/faq" className="nav-link">FAQ</Link>
        <Link href="/kontakt" className="nav-link">Kontakt</Link>
      </nav>

      {/* Hamburger menu for mobile */}
      <button className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile menu */}
      <nav className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
        <Link href="/blogg" className="nav-link" onClick={closeMobileMenu}>Blogg</Link>
        <Link href="/faq" className="nav-link" onClick={closeMobileMenu}>FAQ</Link>
        <Link href="/kontakt" className="nav-link" onClick={closeMobileMenu}>Kontakt</Link>
      </nav>
    </>
  );
};

export default MobileMenu;