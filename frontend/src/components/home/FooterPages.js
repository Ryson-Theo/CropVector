import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PageLayout = ({ title, children }) => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      <button 
        onClick={() => navigate('/')}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', 
          cursor: 'pointer', color: '#64748b', marginBottom: '20px', fontSize: '14px' 
        }}
      >
        <ArrowLeft size={16} /> Back to Home
      </button>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>{title}</h1>
      <div style={{ lineHeight: '1.6', color: '#334155' }}>
        {children}
      </div>
    </div>
  );
};

export const Careers = () => (
  <PageLayout title="Join Our Team">
    <p>We are always looking for passionate individuals to help us revolutionize agriculture.</p>
    <p>Check back soon for open positions!</p>
  </PageLayout>
);

export const Blog = () => (
  <PageLayout title="CropVector Blog">
    <p>Latest news, farming tips, and updates from the CropVector team.</p>
    <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
      <h4>The Future of Smart Farming</h4>
      <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Coming soon...</p>
    </div>
  </PageLayout>
);

export const Press = () => (
  <PageLayout title="Press & Media">
    <p>For media inquiries, please contact press@cropvector.com</p>
  </PageLayout>
);

export const HelpCenter = () => (
  <PageLayout title="Help Center">
    <p>Need assistance? Browse our FAQs or contact support.</p>
    <div style={{ marginTop: '20px' }}>
      <h3>Frequently Asked Questions</h3>
      <details style={{ margin: '10px 0', padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: '600' }}>How do I reset my password?</summary>
        <p style={{ marginTop: '10px' }}>Go to the login page and click "Forgot Password".</p>
      </details>
    </div>
  </PageLayout>
);

export const Documentation = () => (
  <PageLayout title="Documentation">
    <p>Technical guides and API references for developers and partners.</p>
  </PageLayout>
);

export const Community = () => (
  <PageLayout title="Community">
    <p>Join our vibrant community of farmers, experts, and buyers.</p>
  </PageLayout>
);

export const Partners = () => (
  <PageLayout title="Our Partners">
    <p>We work with leading agricultural organizations to bring you the best data and services.</p>
  </PageLayout>
);

export const Events = () => (
  <PageLayout title="Upcoming Events">
    <p>Join us at webinars, workshops, and agricultural fairs.</p>
  </PageLayout>
);

export const Pricing = () => (
  <PageLayout title="Pricing Plans">
    <p>CropVector offers flexible pricing tailored to your needs.</p>
  </PageLayout>
);

export const Products = () => (
  <PageLayout title="Our Products">
    <p>Explore our suite of agricultural tools designed to maximize your yield.</p>
  </PageLayout>
);

export const PrivacyPolicy = () => (
  <PageLayout title="Privacy Policy">
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <p>At CropVector, we take your privacy seriously.</p>
  </PageLayout>
);

export const TermsOfService = () => (
  <PageLayout title="Terms of Service">
    <p>Please read these terms carefully before using CropVector.</p>
  </PageLayout>
);

export const CookiePolicy = () => (
  <PageLayout title="Cookie Policy">
    <p>We use cookies to enhance your experience.</p>
  </PageLayout>
);

export const Support = () => (
  <PageLayout title="Support">
    <p>Our support team is available 24/7 to assist you.</p>
    <p>Email: support@cropvector.com</p>
  </PageLayout>
);

export const RequestDemo = () => (
  <PageLayout title="Request a Demo">
    <p>Interested in CropVector for your enterprise? Fill out the form below to schedule a personalized demo.</p>
  </PageLayout>
);