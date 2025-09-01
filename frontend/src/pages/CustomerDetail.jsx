// File: src/pages/CustomerDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import useAuthStore from "../store/authStore";
import Modal from "../components/Modal";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await api.get(`/customers/${id}`);
        setCustomer(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch customer: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/customers/${id}/notes`, { text: noteText });
      setShowNotesModal(false);
      setNoteText('');
      
      // Refresh customer data
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data);
      
      alert('Note added successfully!');
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateCustomer = async (updateData) => {
    try {
      const response = await api.patch(`/customers/${id}`, updateData);
      setCustomer(response.data);
      alert('Customer updated successfully!');
    } catch (error) {
      console.error('Failed to update customer:', error);
      alert('Failed to update customer: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return <div className="p-6 flex justify-center">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="p-6">Customer not found</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-gray-600">{customer.company}</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowNotesModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Note
          </button>
          <button 
            onClick={() => navigate('/customers')}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <p className="mt-1">{customer.emailId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Phone</label>
              <p className="mt-1">{customer.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Company</label>
              <p className="mt-1">{customer.company || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Assigned To</label>
              <p className="mt-1">{customer.owner?.name || 'Unassigned'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Tags</label>
              <div className="mt-1 flex flex-wrap gap-1">
                {customer.tags && customer.tags.length > 0 ? (
                  customer.tags.map(tag => (
                    <Badge key={tag} text={tag} type="primary" />
                  ))
                ) : (
                  <span className="text-gray-500">No tags</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Status</label>
              <p className="mt-1">
                <Badge text={customer.isArchived ? 'Archived' : 'Active'} 
                       type={customer.isArchived ? 'danger' : 'success'} />
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <div className="space-y-4">
            {customer.notes && customer.notes.length > 0 ? (
              customer.notes.map((note, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <p className="text-sm">{note.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Added on {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No notes yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal isOpen={showNotesModal} onClose={() => setShowNotesModal(false)} title="Add Note">
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
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowNotesModal(false)}
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
      </Modal>
    </div>
  );
}