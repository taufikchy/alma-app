// components/Footer.tsx


const Footer = () => {
  return (
    <footer className="footer-alma text-center text-lg-start mt-auto">
      <div className="text-center p-3">
        &copy; {new Date().getFullYear()} ALMA. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
