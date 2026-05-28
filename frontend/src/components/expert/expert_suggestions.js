import React, { useState } from 'react';
import axios from 'axios';

const ExpertSuggestions = () => {
  const [sessionId, setSessionId] = useState('');
  const [crop, setCrop] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState(null);

  const submit = async () => {
    try {
      await axios.post('/api/expert/suggestions', { sessionId, crop, note, expertId: 'expert_demo' });
      setStatus('Saved');
    } catch (err) {
      console.error(err);
      setStatus('Error');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 920 }}>
      <h2>Expert Suggestions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
        <input placeholder="Session ID" value={sessionId} onChange={e => setSessionId(e.target.value)} />
        <input placeholder="Crop" value={crop} onChange={e => setCrop(e.target.value)} />
        <textarea placeholder="Note" value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button className="action-btn" onClick={submit}>Submit Suggestion</button>
        {status && <span style={{ marginLeft: 8 }}>{status}</span>}
      </div>
    </div>
  );
};

export default ExpertSuggestions;
