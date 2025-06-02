'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase'; // Import functions
import { httpsCallable } from 'firebase/functions'; // Import httpsCallable
import { User as BaseUser } from '@/lib/types';

// Extend User type locally to include id and status
interface User extends BaseUser {
  id?: string;
  status?: string;
}
const DataTable = React.lazy(() => import('@/components/ui/data-table').then(mod => ({ default: mod.DataTable })));
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Loader2, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          status: 'active', // Default or derive as needed
          ...doc.data()
        })) as User[];
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'displayName',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    // Add more columns as needed (e.g., actions for edit/delete)
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="flex items-center space-x-2">
            <button
              className="text-blue-600 hover:text-blue-900"
              onClick={() => handleEditUser(user)}
              title="Edit User"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              className="text-red-600 hover:text-red-900"
              onClick={() => handleDeleteUser(user)}
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  // Placeholder functions for now
  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setEditFormData({ displayName: user.displayName, email: user.email, role: user.role, status: user.status });
    setIsEditing(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setEditFormData(prev => ({ ...prev, role: value as BaseUser['role'] }));
  };

  const handleStatusChange = (value: string) => {
    setEditFormData(prev => ({ ...prev, status: value }));
  };

  const handleSaveEdit = async () => {
    if (!userToEdit || !editFormData || !userToEdit.id) return;

    setIsEditing(true); // Keep modal open and show loading
    try {
      const userDocRef = doc(db, 'users', userToEdit.id);
      await updateDoc(userDocRef, editFormData);

      // Update local state
      setUsers(users.map(user => user.id === userToEdit.id ? { ...user, ...editFormData } as User : user));

      toast.success(`User ${editFormData.displayName || editFormData.email} updated successfully.`);
      setIsEditing(false);
      setUserToEdit(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user. Please try again.');
      setIsEditing(false); // Allow closing modal on error
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const deleteUserFn = httpsCallable(functions, 'deleteUserAccount');
      await deleteUserFn({ userIdToDelete: userToDelete.id });

      // Update local state to reflect deletion
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      toast.success(`User ${userToDelete.displayName || userToDelete.email} successfully deleted.`);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Please check logs for details.');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchUsers = async () => { // Define fetchUsers to refresh list if needed later
    setLoading(true);
    try {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const usersList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        status: 'active', // Default or derive as needed
        ...doc.data()
      })) as User[];
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        Loading users...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Users</h1>
      <Suspense fallback={<div>Loading users table...</div>}>
        <DataTable columns={columns as any} data={users} searchColumn="displayName" searchPlaceholder="Search users by name..." />
      </Suspense>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              {userToDelete && ` for ${userToDelete.displayName || userToDelete.email}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!userToEdit} onOpenChange={(open) => !open && setUserToEdit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">
                Name
              </Label>
              <Input
                id="displayName"
                name="displayName"
                value={editFormData.displayName || ''}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                value={editFormData.email || ''}
                onChange={handleEditFormChange}
                className="col-span-3"
                disabled // Email usually cannot be changed directly
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={editFormData.role || ''} onValueChange={handleRoleChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="donor">Donor</SelectItem>
                  <SelectItem value="recipient">Recipient</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
               <Select value={editFormData.status || ''} onValueChange={handleStatusChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Add other fields like phoneNumber, organizationName, etc. as needed */}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={isEditing}>
              {isEditing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Edit className="mr-2 h-4 w-4" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}