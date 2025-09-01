// File: src/pages/LeadDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import useAuthStore from "../store/authStore";

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await api.get(`/lead/${id}`);
        setLead(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch lead: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const statusBadgeType = (status) => {
    const types = {
      'New': 'primary',
      'In Progress': 'warning',
      'Closed Won': 'success',
      'Closed Lost': 'danger'
    };
    return types[status] || 'default';
  };

  if (loading) {
    return <div className="p-6 flex justify-center">Loading lead details...</div>;
  }

  if (!lead) {
    return <div className="p-6">Lead not found</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <p className="text-gray-600">Lead Details</p>
        </div>
        <button 
          onClick={() => navigate('/leads')}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Back to Leads
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="mt-1">{lead.emailId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Phone</label>
                  <p className="mt-1">{lead.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Source</label>
                  <p className="mt-1">{lead.source || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Lead Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge text={lead.status} type={statusBadgeType(lead.status)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Assigned Agent</label>
                  <p className="mt-1">{lead.assignedAgent?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Created</label>
                  <p className="mt-1">{new Date(lead.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="mt-1">{new Date(lead.updatedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Archived</label>
                  <p className="mt-1">{lead.isArchived ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}