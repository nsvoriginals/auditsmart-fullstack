"use client";

import Link from "next/link";
import { 
  FaTwitter, 
  FaGithub, 
  FaLinkedin, 
  FaEnvelope,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaBolt,
  FaArrowRight
} from "react-icons/fa";

// Simple button component (no shadcn dependency)
const SimpleButton = ({ children, className, ...props }: any) => (
  <button
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 ${className || ''}`}
    {...props}
  >
    {children}
  </button>
);

// Simple input component
const SimpleInput = ({ className, ...props }: any) => (
  <input
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    {...props}
  />
);

// Simple badge component
const SimpleBadge = ({ children, className, ...props }: any) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 ${className || ''}`}
    {...props}
  >
    {children}
  </span>
);

const FOOTER_SECTIONS = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Dashboard", href: "/dashboard" },
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/docs/api" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Security", href: "/security" },
      { name: "Status", href: "/status" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Help Center", href: "/help" },
      { name: "Community", href: "/community" },
      { name: "Contact Support", href: "/support" },
      { name: "Report Bug", href: "/report" },
    ],
  },
];

const SOCIAL_LINKS = [
  { name: "Twitter", icon: FaTwitter, href: "https://twitter.com/auditsmart" },
  { name: "GitHub", icon: FaGithub, href: "https://github.com/auditsmart" },
  { name: "LinkedIn", icon: FaLinkedin, href: "https://linkedin.com/company/auditsmart" },
  { name: "Email", icon: FaEnvelope, href: "mailto:hello@auditsmart.io" },
];

const SECURITY_BADGES = [
  { label: "SOC 2 Type II", icon: FaShieldAlt },
  { label: "99.9% Uptime", icon: FaClock },
  { label: "Audited", icon: FaCheckCircle },
  { label: "Instant Scans", icon: FaBolt },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t">
      {/* Newsletter Section */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Stay updated on security trends
              </h3>
              <p className="text-muted-foreground">
                Get the latest vulnerability reports and security best practices delivered to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <SimpleInput
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                aria-label="Email address"
              />
              <SimpleButton>
                Subscribe
                <FaArrowRight className="ml-2 h-4 w-4" />
              </SimpleButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Security Badges */}
        <div className="mb-12 p-6 rounded-lg bg-muted/30 border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Enterprise-grade security
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {SECURITY_BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <SimpleBadge
                    key={badge.label}
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <Icon className="h-3 w-3" />
                    <span className="text-xs">{badge.label}</span>
                  </SimpleBadge>
                );
              })}
            </div>
          </div>
        </div>

        <hr className="border-border mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <FaShieldAlt className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">
              Audit<span className="text-primary">Smart</span>
            </span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground text-center">
            © {currentYear} AuditSmart. All rights reserved.
            <br className="md:hidden" />
            {" "}Securing the future of smart contracts.
          </p>

          {/* Social Links */}
          <div className="flex gap-4">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              return (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.name}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}