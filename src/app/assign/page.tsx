'use client'

import { useState, useEffect, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Select from 'react-select'
import { useAuthGuard } from "../hooks/useAuthGuard"
import * as Dialog from '@radix-ui/react-dialog'

type AssignItem = {
    id: number,
    user_id: number,
    key_id: number,
    quantity: number,
    keyholder: string,
    keyname: string
}

type Option = { value: number; label: string }

function mergeSpareInventory(assigns: AssignItem[]) {
    const spareUserId = 87;
    const merged: { [key: number]: AssignItem } = {};
    const result: AssignItem[] = [];

    assigns.forEach(item => {
        if (item.user_id === spareUserId) {
            if (!merged[item.key_id]) {
                merged[item.key_id] = { ...item };
            } else {
                merged[item.key_id].quantity += item.quantity;
            }
        } else {
            result.push(item);
        }
    });

    result.push(...Object.values(merged));
    return result;
}

export default function Assign() {
    const authChecked = useAuthGuard();
    const [assigns, setAssigns] = useState<AssignItem[]>([])
    const [users, setUsers] = useState<Option[]>([])
    const [keys, setKeys] = useState<Option[]>([])
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState<{
        user_id: number | null,
        key_id: number | null,
        quantity: number,
    }>({
        user_id: null,
        key_id: null,
        quantity: 1,
    })
    const [editingId, setEditingId] = useState<number | null>(null)
    const [filterAssign, setFilterAssign] = useState<AssignItem[]>([])

    const [filters, setFilters] = useState({
        userID: '',
        keyID: '',
        keyholder: '',
        keyname: '',
    })

    const [showFilters, setShowFilters] = useState(false)

    async function fecthData() {
        try {
            const token = localStorage.getItem('token');
            const [assignRes, userRes, keyRes] = await Promise.all([
                fetch('/api/assign', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/keys', { headers: { 'Authorization': `Bearer ${token}` } })
            ])
            const [assignData, userData, keyData] = await Promise.all([
                assignRes.json(),
                userRes.json(),
                keyRes.json(),
            ])

            const mergedAssigns = mergeSpareInventory(assignData);

            setAssigns(mergedAssigns);
            setFilterAssign(mergedAssigns);
            setUsers(userData.map((u: any) => ({ value: u.id, label: u.name })))
            setKeys(keyData.map((k: any) => ({ value: k.id, label: k.keyname })))
            setLoading(false)
        } catch (error) {
            alert('Failed to fetch data, please login again')
            router.push('/login')
        }
    }

    useEffect(() => {
        if (!authChecked) return;
        fecthData();
    }, [authChecked])

    function onFormChange(field: keyof typeof formData, value: any) {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    async function handleCreate(newAssignData: Omit<AssignItem, 'id'>) {
        try {
            const res = await fetch('/api/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAssignData),
            });

            if (!res.ok) {
                const errData = await res.json();
                alert('Create Failed: ' + (errData.error || 'Unknown Error'))
                return;
            }

            const createAssign = await res.json();
            alert('Created new key with ID: ' + createAssign.id);

            fecthData();
            setShowForm(false);
            setFormData({ user_id: 0, key_id: 0, quantity: 1 })
        } catch (err) {
            alert('Create error: ' + err)
        }
    }

    async function handleUpdate(id: number, updatedData: Partial<AssignItem>) {
        try {
            const res = await fetch(`/api/assign/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            })
            if (res.ok) {
                fecthData();
                setShowForm(false);
                setEditingId(null);
                setFormData({ user_id: 0, key_id: 0, quantity: 1 })
            } else {
                alert('Update Failed')
            }
        } catch (err) {
            alert('Update error:' + err)
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this ?')) return;
        const res = await fetch(`/api/assign/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fecthData();
        } else {
            alert("Delete Failed")
        }
    }

    function openEditForm(assign: AssignItem) {
        setFormData({
            user_id: assign.user_id,
            key_id: assign.key_id,
            quantity: assign.quantity,
        })
        setEditingId(assign.id)
        setShowForm(true)
    }

    function onFilterChange(e: ChangeEvent<HTMLInputElement>, field: keyof typeof filters) {
        const val = e.target.value.toLowerCase();

        setFilters(prevAssignFilters => {
            const newFilters = { ...prevAssignFilters, [field]: val };
            const filtered = assigns.filter(assign =>
                assign.user_id.toString().includes(newFilters.userID) &&
                assign.key_id.toString().includes(newFilters.keyID) &&
                (assign.keyholder ?? '').toLowerCase().includes(newFilters.keyholder) &&
                (assign.keyname ?? '').toLowerCase().includes(newFilters.keyname)
            );

            setFilterAssign(filtered)
            return newFilters;
        })
    }

    function onFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (formData.user_id === null || formData.key_id === null) {
            alert('Please select both User and Key.')
            return
        }
        if (editingId !== null) {
            handleUpdate(editingId, formData as Omit<AssignItem, 'id'>)
        } else {
            handleCreate(formData as Omit<AssignItem, 'id'>)
        }
    }

    if (loading) return <div>Loading...</div>

return (
  <main className='p-4'>
    <div className="flex items-center mb-4">
      <h1 className="text-2xl font-semibold">Assign Key</h1>
      <div className="ml-auto flex gap-2">
        <Button onClick={() => setShowFilters(v => !v)}>
          {showFilters ? 'Close Filter' : 'Show Filter'}
        </Button>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ user_id: 0, key_id: 0, quantity: 1 }); }}>
          Assign New Key
        </Button>
      </div>
    </div>

    {showFilters && (
      <div className="flex flex-wrap gap-4 max-w-full mb-4">
        {Object.entries(filters).map(([field, value]) => (
          <input
            key={field}
            type="text"
            placeholder={field}
            value={value}
            onChange={e => onFilterChange(e, field as keyof typeof filters)}
            className="p-2 border border-gray-300 rounded w-40 flex-shrink-0"
          />
        ))}
      </div>
    )}

    <Dialog.Root open={showForm} onOpenChange={setShowForm}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 w-[400px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-6 shadow-lg">
          <Dialog.Title className="text-xl font-semibold mb-4">{editingId ? "Edit Assign" : "New Assign"}</Dialog.Title>
          <form onSubmit={onFormSubmit}>
            <label>User: </label>
            <Select
              options={users}
              value={users.find(u => u.value === formData.user_id) || null}
              onChange={option => onFormChange("user_id", option?.value ?? 0)}
            />

            <label>Key: </label>
            <Select
              options={keys}
              value={keys.find(k => k.value === formData.key_id) || null}
              onChange={option => onFormChange('key_id', option ? option.value : null)}
              isClearable
            />

            <label>Quantity: </label>
            <input
              type="number"
              min={1}
              value={formData.quantity}
              onChange={e => onFormChange('quantity', Number(e.target.value))}
              className="border p-2 rounded w-full mb-4"
            />

            <div className="flex justify-end gap-2">
              <Button type="submit" className="mr-2">{editingId ? "Update" : "Create"}</Button>
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <table className="min-w-full borader border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-3 py-2 text-left">ID</th>
          <th className="border px-3 py-2 text-left">User ID</th>
          <th className="border px-3 py-2 text-left">Key ID</th>
          <th className="border px-3 py-2 text-left">Quantity</th>
          <th className="border px-3 py-2 text-left">Key Holder</th>
          <th className="border px-3 py-2 text-left">Key Name</th>
          <th className="border px-3 py-2 text-left">Action</th>
        </tr>
      </thead>
      <tbody>
        {filterAssign.length === 0 ? (
          <tr>
            <td colSpan={7} className="text-center py-4">No Item found</td>
          </tr>
        ) : (
          filterAssign.map((assign, index) => (
            <tr key={assign.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="border px-3 py-2">{assign.id}</td>
              <td className="border px-3 py-2">{assign.user_id}</td>
              <td className="border px-3 py-2">{assign.key_id}</td>
              <td className="border px-3 py-2">{assign.quantity}</td>
              <td className="border px-3 py-2">{assign.keyholder}</td>
              <td className="border px-3 py-2">{assign.keyname}</td>
              <td className="border px-3 py-2">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditForm(assign)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(assign.id)}>Delete</Button>
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
