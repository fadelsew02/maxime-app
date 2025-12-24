/**
 * Exemple de composant React pour afficher les logs d'actions
 * À placer dans : src/components/admin/ActionLogsViewer.tsx
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ActionLog {
  id: string;
  username: string;
  user_role: string;
  action_type: string;
  action_type_display: string;
  action_description: string;
  http_method: string;
  endpoint: string;
  ip_address: string;
  success: boolean;
  response_status: number;
  duration_ms: number;
  created_at: string;
  echantillon_code?: string;
  essai_type?: string;
  client_code?: string;
}

interface ActionLogStats {
  total_actions: number;
  actions_by_type: Record<string, number>;
  actions_by_user: Record<string, number>;
  actions_by_day: Record<string, number>;
  success_rate: number;
  average_duration_ms: number;
}

const ActionLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [stats, setStats] = useState<ActionLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    username: '',
    action_type: '',
    period: 'week',
    success: '',
  });

  // Charger les logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.username) params.append('username', filters.username);
      if (filters.action_type) params.append('action_type', filters.action_type);
      if (filters.period) params.append('period', filters.period);
      if (filters.success) params.append('success', filters.success);

      const response = await axios.get(`/api/action-logs/?${params.toString()}`);
      setLogs(response.data.results || response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/action-logs/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  return (
    <div className="action-logs-viewer">
      <h1>Logs d'Actions</h1>

      {/* Statistiques */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total d'actions</h3>
            <p className="stat-value">{stats.total_actions}</p>
          </div>
          <div className="stat-card">
            <h3>Taux de succès</h3>
            <p className="stat-value">{stats.success_rate.toFixed(2)}%</p>
          </div>
          <div className="stat-card">
            <h3>Durée moyenne</h3>
            <p className="stat-value">{stats.average_duration_ms.toFixed(0)} ms</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="filters">
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={filters.username}
          onChange={(e) => setFilters({ ...filters, username: e.target.value })}
        />

        <select
          value={filters.action_type}
          onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
        >
          <option value="">Tous les types</option>
          <option value="echantillon_create">Création échantillon</option>
          <option value="essai_create">Création essai</option>
          <option value="rapport_validate">Validation rapport</option>
          {/* Ajouter d'autres types selon les besoins */}
        </select>

        <select
          value={filters.period}
          onChange={(e) => setFilters({ ...filters, period: e.target.value })}
        >
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
        </select>

        <select
          value={filters.success}
          onChange={(e) => setFilters({ ...filters, success: e.target.value })}
        >
          <option value="">Tous</option>
          <option value="true">Succès uniquement</option>
          <option value="false">Erreurs uniquement</option>
        </select>

        <button onClick={fetchLogs}>Actualiser</button>
      </div>

      {/* Liste des logs */}
      <div className="logs-list">
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date/Heure</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Endpoint</th>
                <th>Statut</th>
                <th>Durée</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className={log.success ? 'success' : 'error'}>
                  <td>{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                  <td>
                    <div>{log.username}</div>
                    <small>{log.user_role}</small>
                  </td>
                  <td>
                    <div>{log.action_type_display}</div>
                    <small>{log.http_method}</small>
                  </td>
                  <td>
                    <code>{log.endpoint}</code>
                  </td>
                  <td>
                    <span className={`status-badge ${log.success ? 'success' : 'error'}`}>
                      {log.response_status}
                    </span>
                  </td>
                  <td>{log.duration_ms ? `${log.duration_ms} ms` : '-'}</td>
                  <td>
                    {log.echantillon_code && <div>📦 {log.echantillon_code}</div>}
                    {log.essai_type && <div>🔬 {log.essai_type}</div>}
                    {log.client_code && <div>👤 {log.client_code}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .action-logs-viewer {
          padding: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
        }

        .stat-value {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }

        .filters {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .filters input,
        .filters select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .filters button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .filters button:hover {
          background: #0056b3;
        }

        .logs-list {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #dee2e6;
        }

        tr.success {
          background: #f8fff8;
        }

        tr.error {
          background: #fff8f8;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.success {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.error {
          background: #f8d7da;
          color: #721c24;
        }

        code {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
        }

        small {
          color: #666;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default ActionLogsViewer;


/**
 * UTILISATION DANS L'APPLICATION
 * 
 * 1. Créer le fichier : src/components/admin/ActionLogsViewer.tsx
 * 2. Ajouter une route dans App.tsx :
 * 
 *    import ActionLogsViewer from './components/admin/ActionLogsViewer';
 * 
 *    <Route path="/admin/logs" element={<ActionLogsViewer />} />
 * 
 * 3. Ajouter un lien dans le menu admin :
 * 
 *    <Link to="/admin/logs">Logs d'Actions</Link>
 * 
 * 4. S'assurer que axios est configuré avec le token JWT :
 * 
 *    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
 */


/**
 * EXEMPLE D'UTILISATION SIMPLE DANS UN COMPOSANT
 */

const SimpleActionLogsList: React.FC = () => {
  const [recentLogs, setRecentLogs] = useState<ActionLog[]>([]);

  useEffect(() => {
    // Charger les 10 dernières actions
    axios.get('/api/action-logs/recent/')
      .then(response => setRecentLogs(response.data.slice(0, 10)))
      .catch(error => console.error(error));
  }, []);

  return (
    <div>
      <h3>Actions Récentes</h3>
      <ul>
        {recentLogs.map(log => (
          <li key={log.id}>
            <strong>{log.username}</strong> - {log.action_type_display}
            <small> ({new Date(log.created_at).toLocaleString('fr-FR')})</small>
          </li>
        ))}
      </ul>
    </div>
  );
};


/**
 * EXEMPLE DE HOOK PERSONNALISÉ
 */

const useActionLogs = (filters = {}) => {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters as any);
      const response = await axios.get(`/api/action-logs/?${params.toString()}`);
      setLogs(response.data.results || response.data);
    } catch (err) {
      setError('Erreur lors du chargement des logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [JSON.stringify(filters)]);

  return { logs, loading, error, refetch: fetchLogs };
};

// Utilisation du hook
const MyComponent: React.FC = () => {
  const { logs, loading, error } = useActionLogs({ period: 'today' });

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      {logs.map(log => (
        <div key={log.id}>{log.action_description}</div>
      ))}
    </div>
  );
};
