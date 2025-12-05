import React from 'react';
import { useProject } from '../store/ProjectContext';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { Status, Priority } from '../types';
import { CheckCircle, Clock, TrendingUp, AlertCircle, Layout, Box } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { issues, activeSprint, sprints, users, activeProject, spaces } = useProject();

  // ... (Existing Sprint Calculations) ...
  const activeSprintIssues = activeSprint ? issues.filter(i => i.sprintId === activeSprint.id) : [];
  const totalPoints = activeSprintIssues.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
  const completedPoints = activeSprintIssues.filter(i => i.status === Status.DONE).reduce((acc, i) => acc + (i.storyPoints || 0), 0);
  const progressPercentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const daysRemaining = activeSprint?.endDate ? Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  // --- Space Breakdown (New for Spaces) ---
  const spaceData = spaces.map(s => {
      const spaceIssues = activeSprintIssues.filter(i => i.spaceId === s.id);
      const spacePoints = spaceIssues.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
      const spaceCompleted = spaceIssues.filter(i => i.status === Status.DONE).reduce((acc, i) => acc + (i.storyPoints || 0), 0);
      return {
          name: s.name,
          total: spacePoints,
          completed: spaceCompleted
      };
  }).filter(d => d.total > 0);

  const statusData = Object.values(Status).map(status => ({ name: status.replace('_', ' '), value: issues.filter(i => i.status === status).length }));
  const STATUS_COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#10b981'];

  if (!activeProject) return <div>Select a project</div>;

  return (
    <div className="p-4 md:p-8 overflow-y-auto h-full bg-slate-50 pb-12">
      {/* ... (Existing Header & Stats Rows) ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div><h1 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard</h1></div>
      </div>

      {/* Active Sprint Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
           <h3 className="text-lg font-bold text-slate-800 mb-4">Active Sprint Progress</h3>
           {activeSprint ? (
               <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                   <div className="bg-indigo-600 h-4 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
               </div>
           ) : <p>No active sprint.</p>}
      </div>

      {/* Space Breakdown Chart (New) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-2 mb-6">
              <Box className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-800">Sprint Velocity by Space</h3>
          </div>
          <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spaceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Total Points" fill="#cbd5e1" radius={[4,4,0,0]} />
                      <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4,4,0,0]} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* ... (Keep existing Status Pie & Burndown) ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
               <ResponsiveContainer width="100%" height="100%" minHeight={200}><PieChart><Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">{statusData.map((e, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
           </div>
      </div>
    </div>
  );
};