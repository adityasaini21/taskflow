import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function TasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');

  useEffect(() => {
    const loadAll = async () => {
      try {
        const projRes = await api.get('/projects');
        setProjects(projRes.data.projects);
        const taskPromises = projRes.data.projects.map(p =>
          api.get(`/tasks?project=${p._id}`).then(r => r.data.tasks.map(t => ({ ...t, projectObj: p })))
        );
        const results = await Promise.all(taskPromises);
        const tasks = results.flat().filter(t => t.assignedTo?._id === user._id || t.assignedTo?._id?.toString() === user._id?.toString());
        setAllTasks(tasks);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadAll();
  }, []);

  const updateStatus = async (task, status) => {
    try {
      await api.put(`/tasks/${task._id}`, { status });
      setAllTasks(prev => prev.map(t => t._id === task._id ? { ...t, status } : t));
    } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
  };

  const filtered = allTasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterProject && t.projectObj?._id !== filterProject) return false;
    return true;
  });

  const overdue = filtered.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'Done');
  const todo = filtered.filter(t => t.status === 'To Do');
  const inProgress = filtered.filter(t => t.status === 'In Progress');
  const done = filtered.filter(t => t.status === 'Done');

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Tasks ◻</h1>
        <p className="page-subtitle">{allTasks.length} tasks assigned to you across {projects.length} projects</p>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card blue"><div className="stat-label">Total</div><div className="stat-value" style={{ color: 'var(--blue)' }}>{allTasks.length}</div></div>
          <div className="stat-card"><div className="stat-label">To Do</div><div className="stat-value">{todo.length}</div></div>
          <div className="stat-card blue"><div className="stat-label">In Progress</div><div className="stat-value" style={{ color: 'var(--blue)' }}>{inProgress.length}</div></div>
          <div className="stat-card green"><div className="stat-label">Done</div><div className="stat-value" style={{ color: 'var(--green)' }}>{done.length}</div></div>
          <div className="stat-card red"><div className="stat-label">Overdue</div><div className="stat-value" style={{ color: 'var(--red)' }}>{overdue.length}</div></div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <select className="form-control" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option>To Do</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          {(filterStatus || filterProject) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setFilterStatus(''); setFilterProject(''); }}>Clear</button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">◻</div>
              <div className="empty-title">No tasks assigned to you</div>
              <div className="empty-desc">Ask your project admin to assign tasks to you</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(task => {
                    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';
                    return (
                      <tr key={task._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {task.title}
                            {isOverdue && <span className="overdue-dot"></span>}
                          </div>
                          {task.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{task.description.slice(0, 50)}...</div>}
                        </td>
                        <td>
                          <button onClick={() => navigate(`/projects/${task.projectObj?._id}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', color: 'var(--accent2)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.projectObj?.color, display: 'inline-block', flexShrink: 0 }}></span>
                            {task.projectObj?.name}
                          </button>
                        </td>
                        <td><PriorityBadge priority={task.priority} /></td>
                        <td>
                          {task.dueDate ? (
                            <span style={{ color: isOverdue ? 'var(--red)' : 'var(--text2)', fontSize: 13 }}>
                              {format(new Date(task.dueDate), 'MMM d, yyyy')}
                            </span>
                          ) : <span style={{ color: 'var(--text2)' }}>—</span>}
                        </td>
                        <td><StatusBadge status={task.status} /></td>
                        <td>
                          <select className="form-control" style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }}
                            value={task.status}
                            onChange={e => updateStatus(task, e.target.value)}>
                            <option>To Do</option>
                            <option>In Progress</option>
                            <option>Done</option>
                          </select>
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
    </div>
  );
}
