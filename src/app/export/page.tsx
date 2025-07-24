'use client'

import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button';

export default function ExportPage() {


  async function exportAllPagesExcel() {
    const token = localStorage.getItem('token');
    try {
      const keysRes = await fetch('/api/keys', { headers: { Authorization: `Bearer ${token}` } });
      const usersRes = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      const assignRes = await fetch('/api/assign', { headers: { Authorization: `Bearer ${token}` } });
      const overallRes = await fetch('/api/over_all', { headers: { Authorization: `Bearer ${token}` } });

      if (!keysRes.ok || !usersRes.ok || !assignRes.ok || !overallRes.ok) {
        alert('Failed to fetch some data for export.');
        return;
      }

      const [keysData, usersData, assignData, overallData] = await Promise.all([
        keysRes.json(),
        usersRes.json(),
        assignRes.json(),
        overallRes.json(),
      ]);

      console.log('overallData:', overallData);

      const wb = XLSX.utils.book_new();

      const wsKeys = XLSX.utils.json_to_sheet(keysData);
      XLSX.utils.book_append_sheet(wb, wsKeys, "Keys");

      const wsUsers = XLSX.utils.json_to_sheet(usersData);
      XLSX.utils.book_append_sheet(wb, wsUsers, "Users");

      const wsAssign = XLSX.utils.json_to_sheet(assignData);
      XLSX.utils.book_append_sheet(wb, wsAssign, "Assign Key");

      const wsOverall = XLSX.utils.json_to_sheet(overallData);
      XLSX.utils.book_append_sheet(wb, wsOverall, "Overall");

      XLSX.writeFile(wb, 'all_data_export.xlsx');

    } catch (error: unknown) {
      if (error instanceof Error) {
        alert('Export failed: ' + error.message);
      } else {
        alert('Export failed: Unknown error');
      }
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 mt-12 bg-white rounded-lg shadow-md text-center">
      <h1 className="text-3xl font-bold mb-4">Export All Data</h1>
      <p className="mb-6 text-gray-600">
        Click the button below to export all keys, users, assignments, and overall data into an Excel file.
      </p>
      <Button onClick={exportAllPagesExcel} size="lg">
        Export All Data as Excel
      </Button>
    </main>
  )
}
