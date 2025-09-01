// File: src/pages/Dashboard.jsx (Fixed)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/authStore";

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    leadsByStatus: {},
    totalCustomers: 0,
    openTasks: 0,
    overdueTasks: 0,
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all data
        const [leadsRes, customersRes, tasksRes, activitiesRes] =
          await Promise.all([
            api.get("/lead?limit=1000"),
            api.get("/customers?limit=1000"),
            api.get("/tasks?limit=1000"),
            api.get("/activity?limit=1000"),
          ]);

        // Process leads by status
        const leadsByStatus = {
          New: 0,
          "In Progress": 0,
          "Closed Won": 0,
          "Closed Lost": 0,
        };

        // Check if leads data is in the expected format
        const leadsData = leadsRes.data.leads || leadsRes.data || [];
        leadsData.forEach((lead) => {
          if (leadsByStatus[lead.status] !== undefined) {
            leadsByStatus[lead.status]++;
          }
        });

        // Check if customers data is in the expected format
        const customersData = customersRes.data.customers || customersRes.data || [];
        
        // Handle tasks data - it might be an object or array
        let tasksData = [];
        if (Array.isArray(tasksRes.data)) {
          tasksData = tasksRes.data;
        } else if (tasksRes.data && Array.isArray(tasksRes.data.tasks)) {
          tasksData = tasksRes.data.tasks;
        } else {
          console.warn("Unexpected tasks response format:", tasksRes.data);
        }

        // Count tasks
        const openTasks = tasksData.filter(
          (task) => task.status !== "Done"
        ).length;
        const overdueTasks = tasksData.filter((task) => {
          if (!task.dueDate || task.status === "Done") return false;
          return new Date(task.dueDate) < new Date() && task.status !== "Done";
        }).length;

        // Handle activities data
        const activitiesData = Array.isArray(activitiesRes.data) 
          ? activitiesRes.data 
          : activitiesRes.data?.activities || [];

        setStats({
          leadsByStatus,
          totalCustomers: customersData.length,
          openTasks,
          overdueTasks,
          recentActivities: activitiesData.slice(0, 5),
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  const totalLeads = Object.values(stats.leadsByStatus).reduce(
    (acc, val) => acc + val,
    0
  );

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Leads Card */}
        <div
          className="bg-white p-4 rounded-lg shadow cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigate("/leads")}
        >
          <h3 className="text-lg font-semibold mb-2">Total Leads</h3>
          <p className="text-3xl font-bold text-blue-600">{totalLeads}</p>
        </div>

        {/* Total Customers Card */}
        <div
          className="bg-white p-4 rounded-lg shadow cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigate("/customers")}
        >
          <h3 className="text-lg font-semibold mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats.totalCustomers}
          </p>
        </div>

        {/* Open Tasks Card */}
        <div
          className="bg-white p-4 rounded-lg shadow cursor-pointer transition-transform hover:scale-105"
          onClick={() => navigate("/tasks")}
        >
          <h3 className="text-lg font-semibold mb-2">Open Tasks</h3>
          <p className="text-3xl font-bold text-purple-600">
            {stats.openTasks}
          </p>
          {stats.overdueTasks > 0 && (
            <p className="text-red-600 font-semibold text-sm mt-1">
              {stats.overdueTasks} overdue
            </p>
          )}
        </div>

        {/* User Role Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">User Role</h3>
          <p className="text-xl font-bold capitalize text-gray-700">
            {user.role}
          </p>
        </div>
      </div>

      {/* Leads Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Leads by Status</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats.leadsByStatus).map(([status, count]) => (
              <div
                key={status}
                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => navigate(`/leads?status=${status}`)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{status}</span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity) => (
                <div
                  key={activity._id}
                  className="border-b pb-3 last:border-b-0"
                >
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-600">
                    By {activity.performedBy?.name || "Unknown"} •{" "}
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}