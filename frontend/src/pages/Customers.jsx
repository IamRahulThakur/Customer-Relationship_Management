// File: src/pages/Customers.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import useAuthStore from "../store/authStore";
import Modal from "../components/Modal";

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [filters, setFilters] = useState({ 
    search: searchParams.get('search') || '',
    isArchived: searchParams.get('isArchived') || 'false',
    tags: searchParams.get('tags') || ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [agents, setAgents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    emailId: '',
    phone: '',
    tags: '',
    owner: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: 10,
        ...filters,
        isArchived: filters.isArchived === 'true'
      }).toString();
      
      const res = await api.get(`/customers?${queryParams}`);
      setCustomers(res.data.customers || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCustomers(res.data.totalCustomers || 0);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch customers: ' + (err.response?.data?.error || err.message));
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
      const mockAgents = [
        { _id: '1', name: 'Agent One', emailId: 'agent1@crm.com', role: 'Agent' },
        { _id: '2', name: 'Agent Two', emailId: 'agent2@crm.com', role: 'Agent' }
      ];
      setAgents(mockAgents);
    }
  };

  useEffect(() => {
    fetchCustomers();
    if (user.role === 'Admin') {
      fetchAgents();
    }
  }, [page, filters, user.role]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const customerData = {
        name: formData.name,
        company: formData.company,
        emailId: formData.emailId,
        phone: formData.phone,
        tags: tagsArray,
        owner: formData.owner
      };

      if (user.role === 'Agent') {
        customerData.owner = user.emailId;
      }

      const response = await api.post('/customers', customerData);
      
      setShowCreateModal(false);
      setFormData({ name: '', company: '', emailId: '', phone: '', tags: '', owner: '' });
      fetchCustomers();
      alert('Customer created successfully!');
    } catch (error) {
      console.error('Failed to create customer:', error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(errorMessage);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/customers/${selectedCustomer._id}/notes`, { text: noteText });
      setShowNotesModal(false);
      setNoteText('');
      setSelectedCustomer(null);
      fetchCustomers();
      alert('Note added successfully!');
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateCustomer = async (customerId, updateData) => {
    try {
      await api.patch(`/customers/${customerId}`, updateData);
      fetchCustomers();
      alert('Customer updated successfully!');
    } catch (error) {
      console.error('Failed to update customer:', error);
      alert('Failed to update customer: ' + (error.response?.data?.error || error.message));
    }
  };

  const openNotesModal = (customer) => {
    setSelectedCustomer(customer);
    setShowNotesModal(true);
  };

  const handleTagFilter = (tag) => {
    setFilters({ ...filters, tags: tag });
    setPage(1);
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "company", label: "Company" },
    { key: "emailId", label: "Email" },
    { key: "phone", label: "Phone" },
    { 
      key: "tags", 
      label: "Tags", 
      render: (val) => val && val.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {val.map(tag => (
            <span 
              key={tag} 
              className="cursor-pointer hover:underline"
              onClick={() => handleTagFilter(tag)}
            >
              <Badge text={tag} type="primary" />
            </span>
          ))}
        </div>
      ) : 'No tags'
    },
    { 
      key: "owner", 
      label: "Owner", 
      render: (val) => val?.name || 'Unassigned' 
    },
    { 
      key: "notes", 
      label: "Notes", 
      render: (val, row) => (
        <button 
          onClick={() => openNotesModal(row)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {val?.length || 0} notes
        </button>
      )
    },
    { 
      key: "createdAt", 
      label: "Created", 
      render: (val) => new Date(val).toLocaleDateString() 
    },
  ];

  const renderRowActions = (customer) => (
    <div className="flex space-x-2">
      <button 
        onClick={() => openNotesModal(customer)}
        className="text-green-600 hover:text-green-800 text-sm"
        title="Add Note"
      >
        Add Note
      </button>
      {user.role === 'Admin' && (
        <button 
          onClick={() => handleUpdateCustomer(customer._id, { isArchived: !customer.isArchived })}
          className="text-orange-600 hover:text-orange-800 text-sm"
          title={customer.isArchived ? 'Restore Customer' : 'Archive Customer'}
        >
          {customer.isArchived ? 'Restore' : 'Archive'}
        </button>
      )}
    </div>
  );

  const handleModalOpen = () => {
    setFormData({ name: '', company: '', emailId: '', phone: '', tags: '', owner: '' });
    setError('');
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowNotesModal(false);
    setSelectedCustomer(null);
    setError('');
  };

  // Extract unique tags from all customers for filter
  const allTags = [...new Set(customers.flatMap(customer => customer.tags || []))];

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customers ({totalCustomers})</h1>
        <button 
          onClick={handleModalOpen}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <select 
          value={filters.isArchived}
          onChange={(e) => setFilters({...filters, isArchived: e.target.value})}
          className="border p-2 rounded"
        >
          <option value="false">Active Customers</option>
          <option value="true">Archived Customers</option>
        </select>
        
        <select 
          value={filters.tags}
          onChange={(e) => setFilters({...filters, tags: e.target.value})}
          className="border p-2 rounded"
        >
          <option value="">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="Search customers..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="border p-2 rounded"
        />
        
        <button 
          onClick={() => {
            setFilters({ search: '', isArchived: 'false', tags: '' });
            setPage(1);
          }}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Clear Filters
        </button>
      </div>

      {/* Quick Tag Filters */}
      {allTags.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Tag Filters:</p>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => handleTagFilter(tag)}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading customers...</div>
      ) : (
        <>
          <Table 
            columns={columns} 
            data={customers} 
            renderRowActions={renderRowActions}
          />
          
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          )}
        </>
      )}
      
      {/* Create Customer Modal */}
      <Modal isOpen={showCreateModal} onClose={handleModalClose} title="Create New Customer">
        <form onSubmit={handleCreateCustomer} className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input
              type="text"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              className="w-full border p-2 rounded mt-1"
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
            <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="tag1, tag2, tag3"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="w-full border p-2 rounded mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
          </div>
          
          {user.role === 'Admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Assign to Agent (Email)</label>
              <select
                value={formData.owner}
                onChange={(e) => setFormData({...formData, owner: e.target.value})}
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
              Create Customer
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Add Note Modal */}
      <Modal isOpen={showNotesModal} onClose={handleModalClose} title={`Add Note to ${selectedCustomer?.name || 'Customer'}`}>
        {selectedCustomer && (
          <form onSubmit={handleAddNote} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Note *</label>
              <textarea
                placeholder="Note text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full border p-2 rounded mt-1"
                rows={4}
                required
              />
            </div>
            
            {/* Recent Notes */}
            {selectedCustomer.notes && selectedCustomer.notes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Recent Notes</label>
                <div className="bg-gray-50 p-3 rounded mt-1 max-h-32 overflow-y-auto">
                  {selectedCustomer.notes.slice(0, 5).map((note, index) => (
                    <div key={index} className="border-b pb-2 mb-2 last:border-b-0 last:mb-0">
                      <p className="text-sm">{note.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
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
                Add Note
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}