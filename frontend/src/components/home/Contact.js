import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, ArrowLeft } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './Contact.css';

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/auth/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Message sent successfully! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error(data.message || 'Failed to send message.');
      }
    } catch (error) {
      console.error('Contact error:', error);
      toast.error('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      <button className="back-home-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back to Home
      </button>

      <div className="contact-layout">
        <div className="contact-info-section">
          <h1 className="contact-title">Get in Touch</h1>
          <p className="contact-subtitle">
            Have questions about CropVector? We're here to help. Fill out the form and we'll be in touch as soon as possible.
          </p>

          <div className="info-items-wrapper">
            <div className="info-item">
              <Mail size={20} />
              <span>support@cropvector.com</span>
            </div>
            <div className="info-item">
              <Phone size={20} />
              <span>+91 1800-123-4567</span>
            </div>
            <div className="info-item">
              <MapPin size={20} />
              <span>Pathanamthitta, Keralam, India</span>
            </div>
          </div>
        </div>

        <div className="contact-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input id="subject" type="text" name="subject" value={formData.subject} onChange={handleChange} required placeholder="How can we help?" />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows="5" placeholder="Tell us more about your inquiry..."></textarea>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" /> Sending...
                </>
              ) : (
                <>
                  <Send size={18} /> Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;