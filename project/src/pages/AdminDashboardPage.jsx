import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  Cpu,
  Database,
  LogOut,
  RefreshCw,
  Server,
  Users,
  Utensils,
  MessageSquare,
  Plane,
  CreditCard,
  Shield,
} from 'lucide-react';

function statusBadge(status) {
  const map = {
    healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };
  return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

function MetricCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
          {sub ? <p className="text-xs text-slate-400 mt-1">{sub}</p> : null}
        </div>
        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);

  const [updateEmail, setUpdateEmail] = useState('');
  const [updatePassword, setUpdatePassword] = useState('');
  const [otpId, setOtpId] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ type: '', text: '' });

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const [dashRes, profileRes] = await Promise.all([
        axios.get('/api/admin/dashboard', { headers: authHeaders() }),
        axios.get('/api/admin/profile', { headers: authHeaders() }),
      ]);
      if (dashRes.data?.success) setDashboard(dashRes.data.data);
      else throw new Error(dashRes.data?.message || 'Failed to load metrics');
      if (profileRes.data?.success) setProfile(profileRes.data.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminData');
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.response?.data?.message || err.message || 'Could not load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => loadDashboard(true), 30000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminData');
    navigate('/admin/login', { replace: true });
  };

  const requestOtp = async () => {
    setUpdateMsg({ type: '', text: '' });
    setUpdateBusy(true);
    try {
      const changeEmail = !!updateEmail.trim();
      const changePassword = !!updatePassword;

      if (!changeEmail && !changePassword) {
        setUpdateMsg({ type: 'error', text: 'Enter a new email or password to update.' });
        return;
      }
      const payload = {
        changeEmail,
        changePassword,
        newEmail: updateEmail.trim() || '',
      };

      const res = await axios.post('/api/admin/otp/request', payload, { headers: authHeaders() });
      if (!res.data?.success) throw new Error(res.data?.message || 'OTP request failed');
      setOtpId(res.data.otpId || '');
      setOtpInput('');
      setOtpToken('');
      setUpdateMsg({ type: 'success', text: 'OTP sent. Enter OTP to verify.' });
    } catch (e) {
      setUpdateMsg({ type: 'error', text: e.response?.data?.message || e.message || 'OTP request failed.' });
    } finally {
      setUpdateBusy(false);
    }
  };

  const verifyOtp = async () => {
    setUpdateMsg({ type: '', text: '' });
    setUpdateBusy(true);
    try {
      if (!otpId) throw new Error('OTP request id is missing.');
      if (!otpInput.trim()) throw new Error('Enter OTP code.');

      const res = await axios.post(
        '/api/admin/otp/verify',
        { otpId, otp: otpInput.trim() },
        { headers: authHeaders() }
      );
      if (!res.data?.success || !res.data?.otpToken) {
        throw new Error(res.data?.message || 'OTP verification failed');
      }

      setOtpToken(res.data.otpToken);
      setUpdateMsg({ type: 'success', text: 'OTP verified. You can apply changes.' });
    } catch (e) {
      setUpdateMsg({ type: 'error', text: e.response?.data?.message || e.message || 'OTP verification failed.' });
    } finally {
      setUpdateBusy(false);
    }
  };

  const applyUpdates = async () => {
    setUpdateMsg({ type: '', text: '' });
    setUpdateBusy(true);
    try {
      const changeEmail = !!updateEmail.trim();
      const changePassword = !!updatePassword;

      if (!otpToken) throw new Error('Verify OTP before applying changes.');
      if (!changeEmail && !changePassword) throw new Error('Nothing to update.');

      const res = await axios.post(
        '/api/admin/account/update',
        {
          otpToken,
          newEmail: changeEmail ? updateEmail.trim() : '',
          newPassword: changePassword ? updatePassword : '',
        },
        { headers: authHeaders() }
      );
      if (!res.data?.success) throw new Error(res.data?.message || 'Update failed');

      setUpdateMsg({ type: 'success', text: 'Credentials updated. Please log in again.' });
      // Force re-login so admin token matches the new email/password state.
      handleLogout();
    } catch (e) {
      setUpdateMsg({ type: 'error', text: e.response?.data?.message || e.message || 'Update failed.' });
    } finally {
      setUpdateBusy(false);
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-slate-800 border-t-transparent animate-spin" />
      </div>
    );
  }

  const health = dashboard?.health;
  const metrics = dashboard?.metrics || {};
  const server = dashboard?.server || {};
  const system = dashboard?.system || {};
  const integrations = dashboard?.integrations || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-bold">Admin Dashboard</h1>
              <p className="text-xs text-slate-300">
                {profile?.email || 'System administrator'} · {dashboard?.environment}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {error ? (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-100">{error}</div>
        ) : null}

        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">System health</h2>
              <p className="text-sm text-slate-500">
                Last updated: {dashboard?.generatedAt ? new Date(dashboard.generatedAt).toLocaleString() : '—'}
              </p>
            </div>
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border capitalize ${statusBadge(health?.overall)}`}
            >
              {health?.overall || 'unknown'}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(health?.checks || []).map((check) => (
              <div
                key={check.id}
                className={`rounded-lg border p-4 ${statusBadge(check.status)}`}
              >
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-lg font-bold mt-1 capitalize">{check.status}</p>
                <p className="text-xs mt-1 opacity-80">{check.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Application metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={Users} label="Students" value={metrics.studentsTotal ?? '—'} />
            <MetricCard icon={Users} label="Faculty accounts" value={metrics.facultyTotal ?? '—'} />
            <MetricCard
              icon={Utensils}
              label="Meals today"
              value={metrics.mealsToday ?? '—'}
            />
            <MetricCard
              icon={MessageSquare}
              label="Open complaints"
              value={metrics.complaintsOpen ?? '—'}
              sub={`${metrics.complaintsTotal ?? 0} total`}
            />
            <MetricCard
              icon={Plane}
              label="Outing permissions"
              value={metrics.outingPermissionsTotal ?? '—'}
              sub={`${metrics.outingMembersTotal ?? 0} members`}
            />
            <MetricCard
              icon={CreditCard}
              label="Pending payments"
              value={metrics.studentsPendingPayment ?? '—'}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Server className="h-5 w-5" />
              Server
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Uptime</dt>
                <dd className="font-medium text-slate-900">{server.uptimeSeconds ?? '—'}s</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Node</dt>
                <dd className="font-medium text-slate-900">{server.nodeVersion}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Platform</dt>
                <dd className="font-medium text-slate-900 text-right">{server.platform}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Port</dt>
                <dd className="font-medium text-slate-900">{server.port}</dd>
              </div>
            </dl>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Resources
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Heap used</dt>
                <dd className="font-medium text-slate-900">
                  {system.memory?.heapUsed} ({system.memory?.heapUsedPercent}%)
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">RSS</dt>
                <dd className="font-medium text-slate-900">{system.memory?.rss}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">System RAM free</dt>
                <dd className="font-medium text-slate-900">
                  {system.freeMemory} / {system.totalMemory}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Load (1m / 5m / 15m)</dt>
                <dd className="font-medium text-slate-900 tabular-nums">
                  {system.loadAverage?.['1m']} / {system.loadAverage?.['5m']} /{' '}
                  {system.loadAverage?.['15m']}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">CPU cores</dt>
                <dd className="font-medium text-slate-900">{system.cpuCores}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Integrations
          </h2>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'mongodb', label: 'MongoDB' },
              { key: 'fast2sms', label: 'Fast2SMS' },
              { key: 'email', label: 'Email' },
              { key: 'jwtSecretSet', label: 'JWT secret' },
            ].map(({ key, label }) => (
              <span
                key={key}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
                  integrations[key]
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                {label}: {integrations[key] ? 'OK' : 'Not configured'}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin credential update (OTP)
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Enter a new email and/or password. An OTP will be sent to the configured inbox to confirm the change.
          </p>

          {updateMsg.text ? (
            <div
              className={`mb-4 p-3 rounded-lg border ${
                updateMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : updateMsg.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {updateMsg.text}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">New admin email</label>
              <input
                value={updateEmail}
                onChange={(e) => setUpdateEmail(e.target.value)}
                type="email"
                placeholder="admin@2026"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <p className="text-xs text-slate-500 mt-2">Leave empty if you only want to update password.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">New admin password</label>
              <input
                value={updatePassword}
                onChange={(e) => setUpdatePassword(e.target.value)}
                type="password"
                placeholder="Enter new password"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <p className="text-xs text-slate-500 mt-2">Leave empty if you only want to update email.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={requestOtp}
                disabled={updateBusy}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-60"
              >
                {updateBusy ? 'Working…' : 'Send OTP'}
              </button>

              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700">OTP</label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter OTP"
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={updateBusy || !otpId}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-900 font-semibold hover:bg-slate-300 disabled:opacity-60"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={applyUpdates}
              disabled={updateBusy || !otpToken}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-60"
            >
              Apply changes
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
