import React from "react";

const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <p className="site-footer__brand">Fashion Store</p>
      <p className="site-footer__note">
        &copy; {new Date().getFullYear()} Fashion Store. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;