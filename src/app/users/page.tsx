'use client'

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../hooks/useAuthGuard';
import * as Dialog from '@radix-ui/react-dialog';

type UserItem = {
    id: number,
    name: string,
    division: string,
    ministry: string,
}

const emptyUser: Omit<UserItem, 'id'> = {
    name: '',
    division: '',
    ministry: '',
}

export default function Users() {
    const authChecked = useAuthGuard();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [filterUser, setFilterUser] = useState<UserItem[]>([]);
    const [filters, setFilters] = useState({
        name: '',
        division: '',
        ministry: '',
    });

    const [showFilters, setShowFilters] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Omit<UserItem, 'id'>>(emptyUser);
    const [editingId, setEditingId] = useState<number | null>(null);

    async function fetchUser() {
        const token = localStorage.getItem('token');
        const resUser = await fetch("/api/users", {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const userData = await resUser.json();
        setUsers(userData);
        setFilterUser(userData);
        setLoading(false);
    }

    useEffect(() => {
        if (authChecked) {
            fetchUser();
        }
    }, [authChecked]);

    function handleUpdate(id: number, updatedData: Partial<UserItem>) {
        const token = localStorage.getItem('token');
        fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData),
        }).then(res => {
            if (res.ok) {
                fetchUser();
                setShowForm(false);
                setEditingId(null);
                setFormData(emptyUser);
            } else {
                alert('Update failed');
            }
        });
    }

    async function handleCreate(newUserData: Omit<UserItem, 'id'>) {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUserData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert('Create failed: ' + (errorData.error || 'Unknown error'));
                return;
            }

            const createdUser = await res.json();
            alert('Created new user with ID: ' + createdUser.id);

            fetchUser();
            setShowForm(false);
            setFormData(emptyUser);
        } catch (err) {
            alert('Create error: ' + err);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.ok) {
            fetchUser();
        } else {
            alert("Delete Failed");
        }
    }

    function onFilterChange(e: ChangeEvent<HTMLInputElement>, field: keyof typeof filters) {
        const val = e.target.value.toLowerCase();

        setFilters(prevFilters => {
            const newFilters = { ...prevFilters, [field]: val };
            const filtered = users.filter(user =>
                user.name.toLowerCase().includes(newFilters.name) &&
                user.division.toLowerCase().includes(newFilters.division) &&
                user.ministry.toLowerCase().includes(newFilters.ministry)
            );

            setFilterUser(filtered);

            return newFilters;
        });
    }

    function onFormChange(e: ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function openEditForm(user: UserItem) {
        setFormData({
            name: user.name,
            division: user.division,
            ministry: user.ministry,
        });
        setEditingId(user.id);
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

    if (!authChecked) return <div className='p-4 text-center'>Checking authentication...</div>;
    if (loading) return <div>Loading...</div>;

    return (
        <main className='p-4'>
            <div className="flex items-center mb-4">
                <h1 className='text-2xl font-semibold'>Users List</h1>
                <div className="ml-auto flex gap-2">
                    <Button onClick={() => setShowFilters(v => !v)}>
                        {showFilters ? 'Close Filter' : 'Show Filter'}
                    </Button>
                    <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyUser); }}>
                        Add New User
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
                        <Dialog.Title className="text-xl font-semibold mb-4">{editingId ? 'Edit User' : 'Add New User'}</Dialog.Title>
                        <form onSubmit={onFormSubmit}>
                            {(['name', 'division', 'ministry'] as (keyof typeof filters)[]).map(field => (
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
                        <th className='border px-3 py-2 text-left'>User ID</th>
                        <th className='border px-3 py-2 text-left'>Name</th>
                        <th className='border px-3 py-2 text-left'>Division</th>
                        <th className='border px-3 py-2 text-left'>Ministry</th>
                        <th className='border px-3 py-2 text-left'>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filterUser.length === 0 ? (
                        <tr>
                            <td colSpan={5} className='text-center py-4'>No Item found</td>
                        </tr>
                    ) : (
                        filterUser.map((user, index) => (
                            <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className='border px-3 py-2'>{user.id}</td>
                                <td className='border px-3 py-2'>{user.name}</td>
                                <td className='border px-3 py-2'>{user.division}</td>
                                <td className='border px-3 py-2'>{user.ministry}</td>
                                <td className='border px-3 py-2'>
                                    <div className='flex space-x-2'>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() => openEditForm(user)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant='destructive'
                                            size='sm'
                                            onClick={() => handleDelete(user.id)}
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
