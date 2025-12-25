'use client';

import React, { useState } from 'react';

const MobileMenu = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const showComingSoon = (type) => {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = 'background: white; border-radius: 20px; padding: 40px; max-width: 450px; margin: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); position: relative;';
    modal.innerHTML = `
      <h2 style="color: var(--text-dark); margin-bottom: 20px; font-size: 1.8rem;">Kommer snart!</h2>
      <p style="color: var(--text-medium); margin-bottom: 20px; line-height: 1.6;">
        Vi arbetar på användarfunktioner där du kan:
      </p>
      <ul style="color: var(--text-medium); margin-bottom: 30px; line-height: 1.8; padding-left: 20px;">
        <li>Spara alla dina analyser</li>
        <li>Följa förbättringar över tid</li>
        <li>Få automatiska veckorapporter</li>
        <li>Exportera data till Excel</li>
      </ul>
      <p style="color: var(--text-medium); margin-bottom: 20px;">
        Vill du bli meddelad när det lanseras?
      </p>
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <input type="email" placeholder="din@email.se" style="flex: 1; padding: 12px; border: 2px solid var(--border-light); border-radius: 10px; font-size: 16px;">
        <button onclick="alert('Tack! Vi hör av oss snart.')" style="padding: 12px 24px; background: linear-gradient(135deg, #ff7b7b 0%, #ff9a9e 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
          Meddela mig
        </button>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">
        ×
      </button>
    `;
    
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    // Close on backdrop click
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) {
        backdrop.remove();
      }
    });
  };

  return (
    <>
      <nav className="nav-links desktop-nav">
        <button onClick={() => showComingSoon('login')} className="nav-btn login-btn">Logga in</button>
        <button onClick={() => showComingSoon('register')} className="nav-btn register-btn">Registrera</button>
      </nav>
      
      {/* Hamburger menu for mobile */}
      <button className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      {/* Mobile menu */}
      <nav className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
        <button onClick={() => showComingSoon('login')} className="nav-btn login-btn">Logga in</button>
        <button onClick={() => showComingSoon('register')} className="nav-btn register-btn">Registrera</button>
      </nav>
    </>
  );
};

export default MobileMenu;