import Link from 'next/link';
import Image from 'next/image';
import MobileMenu from './MobileMenu';

const Header = () => {
  return (
    <header className="header">
      <div className="nav-container">
        <div className="logo">
          <a href="https://benbo.se/" target="_blank" rel="noopener noreferrer">
            <img
              src="/logo.png"
              alt="Benbo"
              className="logo-img"
              width={120}
              height={40}
              loading="lazy"
            />
          </a>
          <Link href="/">
            <Image 
              src="/images/SEOanalyzerLogo.png" 
              alt="SEO Analyzer - Professionell SEO-analys" 
              className="seo-logo" 
              width={200} 
              height={50}
              priority={true}
            />
          </Link>
        </div>
        
        <MobileMenu />
      </div>
    </header>
  );
};

export default Header;