'use client'

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

type Over_all_Item = {
  id: number;
  type: string;
  zone: string;
  usage: string;
  keyname: string;
  keydescription: string;
  keytag: string;
  total_no_of_key: number;
  quantity: number;
  keyholder: string;
  division: string;
  ministry: string;
}

export default function Home() {
  const [overall, setOverall] = useState<Over_all_Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter();
  const [filterAll, setFilterALL] = useState<Over_all_Item[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    keyname: '',
    keyholder: '',
  });

  useEffect(() => {
    async function checkAuth(){
      const token = localStorage.getItem('token');
      if(!token){
        router.push('/login');
        return;
      }
      const res = await fetch('/api/check-auth', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if(!res.ok){
        router.push('/login')
      }else{
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if(!authChecked) return;

    fetch("/api/over_all")
      .then(res => res.json())
      .then((data) => {
        setOverall(data);
        setFilterALL(data);
        setLoading(false);
      });
  }, [authChecked]);

  function onFilterChange(e: ChangeEvent<HTMLInputElement>, field: keyof typeof filters) {
    const val = e.target.value.toLowerCase();

    setFilters(prevOverallFilters => {
      const newFilters = { ...prevOverallFilters, [field]: val };
      const filtered = overall.filter(item =>
        (item.keyname?.toLowerCase().includes(newFilters.keyname) ?? false) &&
        (item.keyholder?.toLowerCase().includes(newFilters.keyholder) ?? false)
      );
      setFilterALL(filtered);
      return newFilters;
    });
  }

  if (!authChecked) return <div className='p-4 text-center'>Checking authentication...</div>
  if (loading) return <div className="p-4 text-center">Loading overall data...</div>;

  return (
    <main className='p-4'>
      <div className="flex items-center mb-4">
        <h1 className='text-2xl font-semibold'>Overall Detail</h1>
        <div className="ml-auto">
          <Button onClick={() => setShowFilters(v => !v)}>
            {showFilters ? 'Close Filter' : 'Show Filter'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className='flex flex-wrap gap-4 mb-4 max-w-full'>
          {Object.entries(filters).map(([field, value]) => (
            <input
              key={field}
              type="text"
              placeholder={`Filter ${field}`}
              value={value}
              onChange={e => onFilterChange(e, field as keyof typeof filters)}
              className='p-2 border border-gray-300 rounded w-40 flex-shrink-0'
            />
          ))}
        </div>
      )}

      <table className='min-w-full border border-gray-300'>
        <thead>
          <tr className='bg-gray-100'>
            {[
              "ID",
              "Type",
              "Zone",
              "Usage",
              "Key Name",
              "Key Description",
              "Key Tag",
              "Total No. of Keys",
              "Quantity",
              "Key Holder",
              "Division",
              "Ministry",
            ].map((header) => (
              <th
                key={header}
                className='border px-2 py-1 text-left text-sm font-semibold'
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filterAll.length === 0 ? (
            <tr>
              <td colSpan={12} className='text-center py-4'>No Item found</td>
            </tr>
          ) : (
            filterAll.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className='border px-2 py-1'>{item.id}</td>
                <td className='border px-2 py-1'>{item.type}</td>
                <td className='border px-2 py-1'>{item.zone}</td>
                <td className='border px-2 py-1'>{item.usage}</td>
                <td className='border px-2 py-1'>{item.keyname}</td>
                <td className='border px-2 py-1'>{item.keydescription}</td>
                <td className='border px-2 py-1'>{item.keytag}</td>
                <td className='border px-2 py-1'>{item.total_no_of_key}</td>
                <td className='border px-2 py-1'>{item.quantity}</td>
                <td className='border px-2 py-1'>{item.keyholder}</td>
                <td className='border px-2 py-1'>{item.division}</td>
                <td className='border px-2 py-1'>{item.ministry}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  )
}
