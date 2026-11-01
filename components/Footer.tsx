import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="footer-logo" aria-label="Do It Now home">
            <Image src="/images/brand/do-it-now-logo.png" alt="Do It Now" width={720} height={180} />
          </Link>
          <p>Custom furniture and warm, functional interiors planned around your space and daily routine.</p>
          <span>DESIGN. BUILD. DELIVER.</span>
        </div>
        <div>
          <h2>Explore</h2>
          <div className="footer-links">
            <Link href="/designs">Design catalogue</Link>
            <Link href="/services">Services</Link>
            <Link href="/about">About Do It Now</Link>
            <Link href="/process">Our process</Link>
            {/* <Link href="/#downloads">Print downloads</Link> */}
            <Link href="/contact#enquire">Project enquiry</Link>
          </div>
        </div>
        <div>
          <h2>Contact</h2>
          <div className="footer-contact">
            <a href="tel:+2347017176611">
              <Phone size={17} />
              +234 701 717 6611
            </a>
            <a href="tel:+2348138701686">
              <Phone size={17} />
              0813 870 1686
            </a>
            <a href="mailto:gabdidi52@gmail.com">
              <Mail size={17} />
              gabdidi52@gmail.com
            </a>
          </div>
        </div>
        <div>
          <h2>Locations</h2>
          <div className="footer-addresses">
            <p>
              <MapPin size={18} />
              <span>
                <strong>Ondo</strong>Orita Rd, Odigbo 350107,
                <br />
                Ondo, Nigeria
              </span>
            </p>
            <p>
              <MapPin size={18} />
              <span>
                <strong>Osun</strong>Nasfat Area, Ibadan Road,
                <br />
                Ile-Ife, Osun State, Nigeria
              </span>
            </p>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© Do It Now Furniture and Interior</span>
        <span>Furniture that fits. Interiors that feel right.</span>
      </div>
    </footer>
  );
}
