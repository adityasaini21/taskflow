import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';
import api from '../utils/api';

const StatusBadge = ({ status }) => {
  const cls = status === 'To Do' ? 'badge-todo' : status === 'In Progress' ? 'badge-inprogress' : 'badge-done';
  return <span className={`badge ${cls}`}>{status}</span>;
};
const PriorityBadge = ({ priority }) => {
  const cls = priority === 'Low' ? 'badge-low' : priority === 'Medium' ? 'badge-medium' : 'badge-high';
  return <span className={`badge ${cls}`}>{priority}</span>;
};

function TaskModal({ task, project, onClose, onSave }) {
  const { user } = useAuth();
  const isAdmin = project?.userRole === 'Admin';
  const [form, setForm] = useState(task ? {
    title: task.title, description: task.description || '', status: task.status,
    priority: task.priority, dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    assignedTo: task.assignedTo?._id || ''
  } : { title: '', description: '', status: 'To Do', priority: 'Medium', dueDate: '', assignedTo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let res;
      const payload = { ...form, project: project._id };
      if (task) {
        res = await api.put(`/tasks/${task._id}`, payload);
      } else {
        res = await api.post('/tasks', payload);
      }
      onSave(res.data.task, !!task);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-title">{task ? 'Edit Task' : 'New Task'}</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required disabled={!isAdmin && !!task} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} disabled={!isAdmin && !!task} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option>To Do</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
            </div>
            {isAdmin && (
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            )}
          </div>
          {isAdmin && (
            <>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-control" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-control" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {project?.members?.map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name} ({m.role})</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ project, onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/projects/${project._id}/members`, { email, role });
      onAdd(res.data.project);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Add Member</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">User Email</label>
            <input type="email" className="form-control" placeholder="member@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
              <option>Member</option>
              <option>Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const isAdmin = project?.userRole === 'Admin';

  const loadData = async () => {
    try {
      const [projRes, taskRes, dashRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
        api.get(`/dashboard/project/${id}`)
      ]);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
      setDashboard(dashRes.data.dashboard);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const loadTasks = () => {
    const params = new URLSearchParams({ project: id });
    if (filterStatus) params.append('status', filterStatus);
    if (filterPriority) params.append('priority', filterPriority);
    api.get(`/tasks?${params}`).then(res => setTasks(res.data.tasks));
  };

  useEffect(() => { if (project) loadTasks(); }, [filterStatus, filterPriority]);

  const handleTaskSave = (task, isEdit) => {
    if (isEdit) setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    else setTasks(prev => [task, ...prev]);
    loadData();
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t._id !== taskId));
    loadData();
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    const res = await api.delete(`/projects/${id}/members/${userId}`);
    setProject(prev => ({ ...prev, members: res.data.project.members }));
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and ALL its tasks? This cannot be undone.')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!project) return null;

  const filteredTasks = tasks;
  const overdue = filteredTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'Done');

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color, flexShrink: 0, marginTop: 8 }}></div>
            <div>
              <button onClick={() => navigate('/projects')} style={{ background: 'none', color: 'var(--text2)', fontSize: 13, marginBottom: 4, display: 'block', cursor: 'pointer' }}>← Projects</button>
              <h1 className="page-title" style={{ marginBottom: 4 }}>{project.name}</h1>
              <p className="page-subtitle">{project.description || 'No description'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>+ Add Task</button>}
            {isAdmin && <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>}
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { l: 'To Do', v: dashboard?.byStatus?.['To Do'] || 0, c: 'var(--text2)' },
            { l: 'In Progress', v: dashboard?.byStatus?.['In Progress'] || 0, c: 'var(--blue)' },
            { l: 'Done', v: dashboard?.byStatus?.['Done'] || 0, c: 'var(--green)' },
            { l: 'Overdue', v: overdue.length, c: 'var(--red)' },
            { l: 'Members', v: project.members?.length, c: 'var(--accent2)' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', minWidth: 80 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 20, borderBottom: '1px solid var(--border)' }}>
          {['tasks', 'members', 'analytics'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 16px', background: 'none', color: tab === t ? 'var(--accent2)' : 'var(--text2)', fontWeight: 600, fontSize: 14, borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1, textTransform: 'capitalize', cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {/* TASKS TAB */}
        {tab === 'tasks' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option>To Do</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
              <select className="form-control" style={{ width: 'auto' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="">All Priorities</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              {(filterStatus || filterPriority) && (
                <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStatus(''); setFilterPriority(''); }}>Clear</button>
              )}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="card"><div className="empty-state">
                <div className="empty-icon">◻</div>
                <div className="empty-title">No tasks found</div>
                <div className="empty-desc">{isAdmin ? 'Click "Add Task" to create the first task' : 'No tasks assigned to you yet'}</div>
              </div></div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Assigned To</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(task => {
                        const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';
                        const canEdit = isAdmin || task.assignedTo?._id === user._id;
                        return (
                          <tr key={task._id}>
                            <td>
                              <div style={{ fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.title}
                                {isOverdue && <span className="overdue-dot"></span>}
                              </div>
                              {task.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}</div>}
                            </td>
                            <td><StatusBadge status={task.status} /></td>
                            <td><PriorityBadge priority={task.priority} /></td>
                            <td>
                              {task.assignedTo ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                                    {task.assignedTo.name?.[0]?.toUpperCase()}
                                  </span>
                                  {task.assignedTo.name}
                                </span>
                              ) : <span style={{ color: 'var(--text2)', fontSize: 13 }}>Unassigned</span>}
                            </td>
                            <td>
                              {task.dueDate ? (
                                <span style={{ color: isOverdue ? 'var(--red)' : 'var(--text2)', fontSize: 13 }}>
                                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                </span>
                              ) : <span style={{ color: 'var(--text2)' }}>—</span>}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => { setEditTask(task); setShowTaskModal(true); }}>Edit</button>}
                                {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task._id)}>Del</button>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Team Members ({project.members?.length})</div>
              {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>+ Add Member</button>}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th>{isAdmin && <th>Actions</th>}</tr></thead>
                <tbody>
                  {project.members?.map(m => (
                    <tr key={m.user._id}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                            {m.user.name?.[0]?.toUpperCase()}
                          </span>
                          <span style={{ fontWeight: 600 }}>{m.user.name}</span>
                          {m.user._id === user._id && <span style={{ fontSize: 11, color: 'var(--text2)' }}>(you)</span>}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{m.user.email}</td>
                      <td><span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span></td>
                      {isAdmin && <td>
                        {m.user._id !== project.createdBy?._id && m.user._id !== user._id && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.user._id)}>Remove</button>
                        )}
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === 'analytics' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div className="grid grid-2">
              <div className="card">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Tasks by Status</div>
                {['To Do', 'In Progress', 'Done'].map(s => {
                  const count = dashboard?.byStatus?.[s] || 0;
                  const total = Object.values(dashboard?.byStatus || {}).reduce((a, b) => a + b, 0);
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={s} style={{ marginBottom: 12 }}>
                      <div className="flex justify-between" style={{ marginBottom: 4, fontSize: 13 }}>
                        <span style={{ color: 'var(--text2)' }}>{s}</span>
                        <span style={{ fontWeight: 700 }}>{count} ({pct}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: s === 'Done' ? 'var(--green)' : s === 'In Progress' ? 'var(--blue)' : 'var(--text2)' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Tasks by Priority</div>
                {['High', 'Medium', 'Low'].map(p => {
                  const count = dashboard?.byPriority?.[p] || 0;
                  const total = Object.values(dashboard?.byPriority || {}).reduce((a, b) => a + b, 0);
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  const c = p === 'High' ? 'var(--red)' : p === 'Medium' ? 'var(--yellow)' : 'var(--green)';
                  return (
                    <div key={p} style={{ marginBottom: 12 }}>
                      <div className="flex justify-between" style={{ marginBottom: 4, fontSize: 13 }}>
                        <span style={{ color: 'var(--text2)' }}>{p}</span>
                        <span style={{ fontWeight: 700, color: c }}>{count} ({pct}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: c }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Tasks per Member</div>
              {dashboard?.byUser?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dashboard.byUser.map(u => (
                    <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {u.user.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{u.user.name}</div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(100, (u.count / (tasks.length || 1)) * 100)}%` }}></div>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, minWidth: 24, textAlign: 'right' }}>{u.count}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ color: 'var(--text2)', fontSize: 14 }}>No assignments yet</div>}
            </div>

            {dashboard?.overdueTasks?.length > 0 && (
              <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--red)' }}>⚠ Overdue Tasks</div>
                {dashboard.overdueTasks.map(t => (
                  <div key={t._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                      {t.assignedTo && <div style={{ fontSize: 12, color: 'var(--text2)' }}>Assigned to {t.assignedTo.name}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{format(new Date(t.dueDate), 'MMM d')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showTaskModal && <TaskModal task={editTask} project={project} onClose={() => { setShowTaskModal(false); setEditTask(null); }} onSave={handleTaskSave} />}
      {showMemberModal && <AddMemberModal project={project} onClose={() => setShowMemberModal(false)} onAdd={p => setProject(prev => ({ ...prev, members: p.members }))} />}
    </div>
  );
}
