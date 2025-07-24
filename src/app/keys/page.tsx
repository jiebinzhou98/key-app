'use client'

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../hooks/useAuthGuard';
import * as Dialog from '@radix-ui/react-dialog'

type KeyItem = {
  id: number,
  type: string,
  zone: string,
  usage: string,
  keyname: string,
  keydescription: string,
  keytag: string,
  total_no_of_key: number,
}

const emptyKey: Omit<KeyItem, 'id'> = {
  type: '',
  zone: '',
  usage: '',
  keyname: '',
  keydescription: '',
  keytag: '',
  total_no_of_key: 0,
}

export default function Key() {
  const authChecked = useAuthGuard();
  const [keys, setKeys] = useState<KeyItem[]>([])
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [filteredKeys, setFilteredKeys] = useState<KeyItem[]>([]);
  const [filters, setFilters] = useState({
    type: '',
    zone: '',
    usage: '',
    keyname: '',
    keydescription: '',
    keytag: '',
  })
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<KeyItem, 'id'>>(emptyKey);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  async function fetchKey() {
    const token = localStorage.getItem('token');
    const res = await fetch("/api/keys", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    setKeys(data);
    setFilteredKeys(data);
    setLoading(false);
  }

  useEffect(() => {
    if (authChecked) {
      fetchKey()
    }
  }, [authChecked])

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this key?')) return;
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/keys/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.ok) {
      fetchKey();
    } else {
      alert("Delete Failed");
    }
  }

  function handleUpdate(id: number, updatedData: Partial<KeyItem>) {
    const token = localStorage.getItem('token')
    fetch(`/api/keys/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedData),
    }).then(res => {
      if (res.ok) {
        fetchKey();
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyKey);
      } else {
        alert('Update failed');
      }
    });
  }

  async function handleCreate(newKeyData: Omit<KeyItem, 'id'>) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newKeyData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert('Create failed: ' + (errorData.error || 'Unknown error'));
        return;
      }

      const created = await res.json();
      alert('Created new key with ID: ' + created.id);

      fetchKey();
      setShowForm(false);
      setFormData(emptyKey);
    } catch (err) {
      alert('Create error: ' + err);
    }
  }

  function onFilterChange(e: ChangeEvent<HTMLInputElement>, field: keyof typeof filters) {
    const val = e.target.value.toLowerCase();

    setFilters(prev => {
      const newFilters = { ...prev, [field]: val };

      setFilteredKeys(keys.filter(key =>
        (key.type?.toLowerCase().includes(newFilters.type) ?? false) &&
        (key.zone?.toLowerCase().includes(newFilters.zone) ?? false) &&
        (key.usage?.toLowerCase().includes(newFilters.usage) ?? false) &&
        (key.keyname?.toLowerCase().includes(newFilters.keyname) ?? false) &&
        (key.keydescription?.toLowerCase().includes(newFilters.keydescription) ?? false) &&
        (key.keytag?.toLowerCase().includes(newFilters.keytag) ?? false)
      ));

      return newFilters;
    });
  }

  function onFormChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_no_of_key' ? Number(value) : value,
    }));
  }

  function openEditForm(key: KeyItem) {
    setFormData({
      type: key.type,
      zone: key.zone,
      usage: key.usage,
      keyname: key.keyname,
      keydescription: key.keydescription,
      keytag: key.keytag,
      total_no_of_key: key.total_no_of_key,
    });
    setEditingId(key.id);
    setShowForm(true);
  }

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId !== null) {
      handleUpdate(editingId, formData);
    } else {
      handleCreate(formData);
    }
  }

  if (!authChecked) return <div className='p-4 text-center'>Checking authentication</div>
  if (loading) return <div>Loading...</div>

  return (
    <main className='p-4'>
      <div className="flex items-center mb-4">
        <h1 className='text-2xl font-semibold'>Keys List</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => setShowFilters(v => !v)}>
            {showFilters ? 'Close Filter' : 'Show Filter'}
          </Button>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyKey); }}>
            Add New Key
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 max-w-full mb-4">
          {Object.entries(filters).map(([field, value]) => (
            <input
              key={field}
              type='text'
              placeholder={field}
              value={value}
              onChange={e => onFilterChange(e, field as keyof typeof filters)}
              className='p-2 border border-gray-300 rounded w-40 flex-shrink-0'
            />
          ))}
        </div>
      )}

      <Dialog.Root open={showForm} onOpenChange={setShowForm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 w-[400px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-6 shadow-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">{editingId ? 'Edit Key' : 'Add New Key'}</Dialog.Title>
            <form onSubmit={onFormSubmit}>
              {(['type', 'zone', 'usage', 'keyname', 'keydescription', 'keytag'] as (keyof typeof filters)[]).map(field => (
                <div key={field} className='mb-2'>
                  <label className='block mb-1 capitalize'>{field}</label>
                  <input
                    name={field}
                    value={(formData as any)[field] || ''}
                    onChange={onFormChange}
                    className='w-full p-2 border border-gray-300 rounded'
                  />
                </div>
              ))}
              <div className='mb-4'>
                <label className='block mb-1'>total_no_of_key</label>
                <input
                  name='total_no_of_key'
                  type='number'
                  value={formData.total_no_of_key}
                  onChange={onFormChange}
                  className='w-full p-2 border border-gray-300 rounded'
                />
              </div>
              <div className='flex justify-end gap-2'>
                <Button type='submit'>
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button type='button' variant='secondary' onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <table className='min-w-full border border-gray-300'>
        <thead>
          <tr className='bg-gray-100'>
            <th className='border px-3 py-2 text-left'>Key ID</th>
            <th className='border px-3 py-2 text-left'>Type</th>
            <th className='border px-3 py-2 text-left'>Zone</th>
            <th className='border px-3 py-2 text-left'>Usage</th>
            <th className='border px-3 py-2 text-left'>Keyname</th>
            <th className='border px-3 py-2 text-left'>Key Description</th>
            <th className='border px-3 py-2 text-left'>Key Tag</th>
            <th className='border px-3 py-2 text-left'>Total # of key</th>
            <th className='border px-3 py-2 text-left'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredKeys.length === 0 ? (
            <tr>
              <td colSpan={9} className='text-center py-4'>No Item found</td>
            </tr>
          ) : (
            filteredKeys.map((key, idx) => (
              <tr key={key.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className='border px-3 py-2'>{key.id}</td>
                <td className='border px-3 py-2'>{key.type}</td>
                <td className='border px-3 py-2'>{key.zone}</td>
                <td className='border px-3 py-2'>{key.usage}</td>
                <td className='border px-3 py-2'>{key.keyname}</td>
                <td className='border px-3 py-2'>{key.keydescription}</td>
                <td className='border px-3 py-2'>{key.keytag}</td>
                <td className='border px-3 py-2'>{key.total_no_of_key}</td>
                <td className="border px-3 py-2">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(key)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(key.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>

              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  )
}
