import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const COLORS = ['#7c6aff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6'];

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      onCreate(res.data.project);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">New Project</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-control" placeholder="e.g. Marketing Campaign" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" placeholder="What is this project about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none' }} />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/projects')
      .then(res => setProjects(res.data.projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Projects ⬡</h1>
            <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
        </div>
      </div>

      <div className="page-body">
        {projects.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">⬡</div>
              <div className="empty-title">No projects yet</div>
              <div className="empty-desc">Create your first project to start managing tasks with your team</div>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowModal(true)}>+ Create Project</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-3">
            {projects.map(p => (
              <div key={p._id} className="project-card" onClick={() => navigate(`/projects/${p._id}`)}>
                <div className="project-color-bar" style={{ background: p.color }}></div>
                <div className="project-name">{p.name}</div>
                {p.description && <div className="project-desc">{p.description}</div>}
                <div className="project-footer">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className={`badge badge-${p.userRole?.toLowerCase()}`}>{p.userRole}</span>
                    <span className="badge badge-todo">{p.members?.length} members</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{p.taskCount ?? 0} tasks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} onCreate={p => setProjects(prev => [p, ...prev])} />}
    </div>
  );
}
