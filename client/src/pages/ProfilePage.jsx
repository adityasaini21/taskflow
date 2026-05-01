import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setError('');
    try {
      await api.put('/auth/profile', { name });
      setMsg('Profile updated successfully!');
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name }));
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile ◯</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 480 }}>
          {/* Avatar */}
          <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-bg)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'var(--accent2)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{user?.email}</div>
            </div>
          </div>

          {/* Edit form */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Account Details</div>
            {msg && <div className="alert alert-success">✓ {msg}</div>}
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" value={user?.email} disabled style={{ opacity: 0.6 }} />
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Email cannot be changed</div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ marginTop: 20, borderColor: 'rgba(239,68,68,0.2)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--red)' }}>Danger Zone</div>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>Sign out from your account on this device.</p>
            <button className="btn btn-danger" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
