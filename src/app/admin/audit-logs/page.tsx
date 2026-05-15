'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { Search, Download, Filter, Calendar, User, FileText, Edit, Trash2, LogIn, LogOut } from 'lucide-react';

interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout';
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}

const mockLogs: AuditLog[] = [
  {
    id: '1',
    action: 'create',
    entity: 'SDS',
    entityId: 'sds-001',
    userId: 'u1',
    userName: 'John Doe',
    timestamp: '2024-03-15 14:30:22',
    details: 'Created new SDS record for Acetone',
    ipAddress: '192.168.1.100',
  },
  {
    id: '2',
    action: 'update',
    entity: 'SDS',
    entityId: 'sds-002',
    userId: 'u2',
    userName: 'Jane Smith',
    timestamp: '2024-03-15 13:15:45',
    details: 'Updated quantity from 500mL to 750mL',
    ipAddress: '192.168.1.101',
  },
  {
    id: '3',
    action: 'login',
    entity: 'User',
    entityId: 'u1',
    userId: 'u1',
    userName: 'John Doe',
    timestamp: '2024-03-15 09:00:00',
    details: 'User logged in successfully',
    ipAddress: '192.168.1.100',
  },
  {
    id: '4',
    action: 'delete',
    entity: 'SDS',
    entityId: 'sds-003',
    userId: 'u3',
    userName: 'Bob Wilson',
    timestamp: '2024-03-14 16:45:30',
    details: 'Deleted expired SDS record',
    ipAddress: '192.168.1.102',
  },
];

const getActionColor = (action: AuditLog['action']) => {
  switch (action) {
    case 'create':
      return 'bg-green-500';
    case 'update':
      return 'bg-blue-500';
    case 'delete':
      return 'bg-red-500';
    case 'view':
      return 'bg-gray-500';
    case 'login':
      return 'bg-purple-500';
    case 'logout':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const getActionIcon = (action: AuditLog['action']) => {
  switch (action) {
    case 'create':
      return <FileText className="h-3 w-3" />;
    case 'update':
      return <Edit className="h-3 w-3" />;
    case 'delete':
      return <Trash2 className="h-3 w-3" />;
    case 'view':
      return <FileText className="h-3 w-3" />;
    case 'login':
      return <LogIn className="h-3 w-3" />;
    case 'logout':
      return <LogOut className="h-3 w-3" />;
    default:
      return <FileText className="h-3 w-3" />;
  }
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const columns: DataTableColumn<AuditLog>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      className: 'w-40',
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: (row) => (
        <Badge className={`${getActionColor(row.action)} text-white`}>
          <span className="flex items-center gap-1">
            {getActionIcon(row.action)}
            {row.action}
          </span>
        </Badge>
      ),
    },
    {
      accessorKey: 'entity',
      header: 'Entity',
      cell: (row) => (
        <div>
          <span className="font-medium">{row.entity}</span>
          <span className="text-muted-foreground text-xs ml-1">#{row.entityId}</span>
        </div>
      ),
    },
    {
      accessorKey: 'userName',
      header: 'User',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span>{row.userName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      className: 'max-w-md',
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      className: 'w-32',
    },
  ];

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase());

    const logDate = new Date(log.timestamp);
    const matchesDateFrom = !dateFrom || logDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || logDate <= new Date(dateTo + 'T23:59:59');

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const handleExport = () => {
    console.log('Exporting audit logs...');
    // TODO: Implement CSV export
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and changes
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {filteredLogs.length} event{filteredLogs.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
                placeholder="From"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
                placeholder="To"
              />
            </div>

            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={filteredLogs}
            emptyMessage="No audit logs found"
          />
        </CardContent>
      </Card>
    </div>
  );
}