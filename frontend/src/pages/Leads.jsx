// File: src/pages/Leads.jsx (Complete Implementation)
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import useAuthStore from "../store/authStore";
import Modal from "../components/Modal";

export default function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [filters, setFilters] = useState({ 
    status: searchParams.get('status') || '', 
    search: searchParams.get('search') || '',
    isArchived: searchParams.get('isArchived') || 'false'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [agents, setAgents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    emailId: '',
    phone: '',
    status: 'New',
    source: '',
    assignedAgent: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    emailId: '',
    phone: '',
    status: 'New',
    source: '',
    assignedAgent: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: 10,
        ...filters,
        isArchived: filters.isArchived === 'true'
      }).toString();
      
      const res = await api.get(`/lead?${queryParams}`);
      setLeads(res.data.leads || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalLeads(res.data.totalLeads || 0);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch leads: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await api.get('/auth/users');
      const agents = res.data.filter(u => u.role === 'Agent');
      setAgents(agents);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      // Fallback to mock data if API fails
      const mockAgents = [
        { _id: '1', name: 'Agent One', emailId: 'agent1@crm.com', role: 'Agent' },
        { _id: '2', name: 'Agent Two', emailId: 'agent2@crm.com', role: 'Agent' }
      ];
      setAgents(mockAgents);
    }
  };

  useEffect(() => {
    fetchLeads();
    if (user.role === 'Admin') {
      fetchAgents();
    }
  }, [page, filters, user.role]);

  const statusBadgeType = (status) => {
    const types = {
      'New': 'primary',
      'In Progress': 'warning',
      'Closed Won': 'success',
      'Closed Lost': 'danger'
    };
    return types[status] || 'default';
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const leadData = {
        name: formData.name,
        emailId: formData.emailId,
        phone: formData.phone,
        status: formData.status,
        source: formData.source,
        assignedAgent: formData.assignedAgent
      };

      if (user.role === 'Agent') {
        leadData.assignedAgent = user.emailId;
      }

      const response = await api.post('/lead', leadData);
      
      setShowCreateModal(false);
      setFormData({ name: '', emailId: '', phone: '', status: 'New', source: '', assignedAgent: '' });
      fetchLeads();
      alert('Lead created successfully!');
    } catch (error) {
      console.error('Failed to create lead:', error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(errorMessage);
    }
  };

  const handleEditLead = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const leadData = {
        name: editFormData.name,
        emailId: editFormData.emailId,
        phone: editFormData.phone,
        status: editFormData.status,
        source: editFormData.source,
        assignedAgent: editFormData.assignedAgent
      };

      const response = await api.patch(`/lead/${selectedLead._id}`, leadData);
      
      setShowEditModal(false);
      setSelectedLead(null);
      fetchLeads();
      alert('Lead updated successfully!');
    } catch (error) {
      console.error('Failed to update lead:', error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(errorMessage);
    }
  };

  const handleArchiveLead = async () => {
    try {
      await api.delete(`/lead/${selectedLead._id}`);
      setShowArchiveModal(false);
      setSelectedLead(null);
      fetchLeads();
      alert('Lead archived successfully!');
    } catch (error) {
      console.error('Failed to archive lead:', error);
      alert('Failed to archive lead: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleConvertLead = async () => {
    try {
      const response = await api.post(`/lead/${selectedLead._id}/convert`);
      setShowConvertModal(false);
      setSelectedLead(null);
      fetchLeads();
      alert('Lead converted to customer successfully!');
    } catch (error) {
      console.error('Failed to convert lead:', error);
      alert('Failed to convert lead: ' + (error.response?.data?.error || error.message));
    }
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setEditFormData({
      name: lead.name,
      emailId: lead.emailId,
      phone: lead.phone,
      status: lead.status,
      source: lead.source,
      assignedAgent: lead.assignedAgent?.emailId || ''
    });
    setShowEditModal(true);
    setError('');
  };

  const openArchiveModal = (lead) => {
    setSelectedLead(lead);
    setShowArchiveModal(true);
  };

  const openConvertModal = (lead) => {
    setSelectedLead(lead);
    setShowConvertModal(true);
  };

  const viewLeadDetails = (lead) => {
    navigate(`/leads/${lead._id}`);
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "emailId", label: "Email" },
    { key: "phone", label: "Phone" },
    { 
      key: "status", 
      label: "Status", 
      render: (val) => <Badge text={val} type={statusBadgeType(val)} /> 
    },
    { key: "source", label: "Source" },
    { 
      key: "assignedAgent", 
      label: "Assigned Agent", 
      render: (val) => val?.name || 'Unassigned' 
    },
    { 
      key: "createdAt", 
      label: "Created", 
      render: (val) => new Date(val).toLocaleDateString() 
    },
  ];

  const renderRowActions = (lead) => (
    <div className="flex space-x-2">
      <button 
        onClick={() => viewLeadDetails(lead)}
        className="text-blue-600 hover:text-blue-800 text-sm"
        title="View Details"
      >
        View
      </button>
      <button 
        onClick={() => openEditModal(lead)}
        className="text-green-600 hover:text-green-800 text-sm"
        title="Edit Lead"
      >
        Edit
      </button>
      <button 
        onClick={() => openConvertModal(lead)}
        className="text-purple-600 hover:text-purple-800 text-sm"
        title="Convert to Customer"
      >
        Convert
      </button>
      <button 
        onClick={() => openArchiveModal(lead)}
        className="text-red-600 hover:text-red-800 text-sm"
        title="Archive Lead"
      >
        Archive
      </button>
    </div>
  );

  const handleModalOpen = () => {
    setFormData({ name: '', emailId: '', phone: '', status: 'New', source: '', assignedAgent: '' });
    setError('');
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowArchiveModal(false);
    setShowConvertModal(false);
    setSelectedLead(null);
    setError('');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Leads ({totalLeads})</h1>
        <button 
          onClick={handleModalOpen}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="border p-2 rounded"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed Won">Closed Won</option>
          <option value="Closed Lost">Closed Lost</option>
        </select>
        
        <select 
          value={filters.isArchived}
          onChange={(e) => setFilters({...filters, isArchived: e.target.value})}
          className="border p-2 rounded"
        >
          <option value="false">Active Leads</option>
          <option value="true">Archived Leads</option>
        </select>
        
        <input
          type="text"
          placeholder="Search leads..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="border p-2 rounded"
        />
        
        <button 
          onClick={() => {
            setFilters({ status: '', search: '', isArchived: 'false' });
            setPage(1);
          }}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading leads...</div>
      ) : (
        <>
          <Table 
            columns={columns} 
            data={leads} 
            renderRowActions={renderRowActions}
          />
          
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          )}
        </>
      )}
      
      {/* Create Lead Modal */}
      <Modal isOpen={showCreateModal} onClose={handleModalClose} title="Create New Lead">
        <form onSubmit={handleCreateLead} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border p-2 rounded mt-1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              placeholder="Email"
              value={formData.emailId}
              onChange={(e) => setFormData({...formData, emailId: e.target.value})}
              className="w-full border p-2 rounded mt-1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border p-2 rounded mt-1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full border p-2 rounded mt-1"
            >
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Source</label>
            <input
              type="text"
              placeholder="Source"
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value})}
              className="w-full border p-2 rounded mt-1"
            />
          </div>
          
          {user.role === 'Admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Assign to Agent (Email) *</label>
              <select
                value={formData.assignedAgent}
                onChange={(e) => setFormData({...formData, assignedAgent: e.target.value})}
                className="w-full border p-2 rounded mt-1"
                required
              >
                <option value="">Select Agent</option>
                {agents.map(agent => (
                  <option key={agent._id} value={agent.emailId}>
                    {agent.name} ({agent.emailId})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Create Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal isOpen={showEditModal} onClose={handleModalClose} title="Edit Lead">
        {selectedLead && (
          <form onSubmit={handleEditLead} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                placeholder="Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                className="w-full border p-2 rounded mt-1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                placeholder="Email"
                value={editFormData.emailId}
                onChange={(e) => setEditFormData({...editFormData, emailId: e.target.value})}
                className="w-full border p-2 rounded mt-1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                placeholder="Phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                className="w-full border p-2 rounded mt-1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                className="w-full border p-2 rounded mt-1"
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Source</label>
              <input
                type="text"
                placeholder="Source"
                value={editFormData.source}
                onChange={(e) => setEditFormData({...editFormData, source: e.target.value})}
                className="w-full border p-2 rounded mt-1"
              />
            </div>
            
            {user.role === 'Admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign to Agent (Email)</label>
                <select
                  value={editFormData.assignedAgent}
                  onChange={(e) => setEditFormData({...editFormData, assignedAgent: e.target.value})}
                  className="w-full border p-2 rounded mt-1"
                >
                  <option value="">Select Agent</option>
                  {agents.map(agent => (
                    <option key={agent._id} value={agent.emailId}>
                      {agent.name} ({agent.emailId})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Update Lead
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Archive Lead Confirmation Modal */}
      <Modal isOpen={showArchiveModal} onClose={handleModalClose} title="Archive Lead">
        {selectedLead && (
          <div className="space-y-4">
            <p>Are you sure you want to archive the lead <strong>{selectedLead.name}</strong>?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveLead}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Archive
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Convert Lead Confirmation Modal */}
      <Modal isOpen={showConvertModal} onClose={handleModalClose} title="Convert Lead to Customer">
        {selectedLead && (
          <div className="space-y-4">
            <p>Are you sure you want to convert the lead <strong>{selectedLead.name}</strong> to a customer?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertLead}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Convert
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}