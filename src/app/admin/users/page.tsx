'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'admin',
    department: 'Safety',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    role: 'manager',
    department: 'Chemistry Lab',
    status: 'active',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob.wilson@company.com',
    role: 'user',
    department: 'Biology Lab',
    status: 'active',
    createdAt: '2024-03-10',
  },
];

export default function UsersPage() {
  const [search, setSearch] = useState('');

  const columns: DataTableColumn<User>[] = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {row.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: (row) => (
        <Badge variant={row.role === 'admin' ? 'default' : row.role === 'manager' ? 'secondary' : 'outline'}>
          {row.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Department',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'} className={row.status === 'active' ? 'bg-green-500' : ''}>
          {row.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
    },
    {
      header: 'Actions',
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredUsers}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>
    </div>
  );
}