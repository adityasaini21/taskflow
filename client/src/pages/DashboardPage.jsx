import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, isPast } from 'date-fns';

const StatusBadge = ({ status }) => {
  const cls = status === 'To Do' ? 'badge-todo' : status === 'In Progress' ? 'badge-inprogress' : 'badge-done';
  return <span className={`badge ${cls}`}>{status}</span>;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const todo = data?.byStatus?.['To Do'] || 0;
  const inProgress = data?.byStatus?.['In Progress'] || 0;
  const done = data?.byStatus?.['Done'] || 0;
  const total = data?.totalTasks || 0;
  const donePercent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} ◈</h1>
        <p className="page-subtitle">Here's your workspace overview</p>
      </div>

      <div className="page-body">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Projects</div>
            <div className="stat-value">{data?.totalProjects ?? 0}</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value" style={{ color: 'var(--blue)' }}>{total}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">My Tasks</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{data?.myTasks ?? 0}</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Overdue</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{data?.overdueTasks ?? 0}</div>
          </div>
        </div>

        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          {/* Task status breakdown */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Task Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'To Do', val: todo, color: 'var(--text2)', bg: 'var(--bg3)' },
                { label: 'In Progress', val: inProgress, color: 'var(--blue)', bg: 'var(--blue-bg)' },
                { label: 'Done', val: done, color: 'var(--green)', bg: 'var(--green-bg)' },
              ].map(({ label, val, color, bg }) => (
                <div key={label}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{val}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: total ? `${(val / total) * 100}%` : '0%', background: color }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Completion rate</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--green)', marginLeft: 'auto' }}>{donePercent}%</span>
            </div>
          </div>

          {/* Quick summary */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>My Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Assigned to me', val: data?.myTasks ?? 0, color: 'var(--accent2)' },
                { label: 'My overdue', val: data?.myOverdue ?? 0, color: 'var(--red)' },
                { label: 'Not started', val: todo, color: 'var(--text2)' },
                { label: 'In flight', val: inProgress, color: 'var(--blue)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: 'var(--bg2)', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, color }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent tasks */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Recent Tasks</div>
          {data?.recentTasks?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTasks.map(task => (
                    <tr key={task._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${task.project?._id}`)}>
                      <td style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.project?.color || 'var(--accent)', display: 'inline-block' }}></span>
                          {task.project?.name}
                        </span>
                      </td>
                      <td>{task.assignedTo?.name || <span style={{ color: 'var(--text2)' }}>Unassigned</span>}</td>
                      <td><StatusBadge status={task.status} /></td>
                      <td>
                        {task.dueDate ? (
                          <span style={{ color: isPast(new Date(task.dueDate)) && task.status !== 'Done' ? 'var(--red)' : 'var(--text2)', fontSize: 13 }}>
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        ) : <span style={{ color: 'var(--text2)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-icon">◻</div>
              <div className="empty-title">No tasks yet</div>
              <div className="empty-desc">Create a project and start adding tasks</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
