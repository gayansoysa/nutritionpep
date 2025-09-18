"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  PersonIcon,
  LockClosedIcon,
  GearIcon
} from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "@/lib/utils/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  last_sign_in_at: string | null;
  created_at: string;
};

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  const pageSize = 20;
  
  useEffect(() => {
    fetchUsers();
  }, [currentPage]);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    
    try {
      console.log(`Fetching users: page=${currentPage}, pageSize=${pageSize}`);
      
      const response = await fetch(`/api/admin/users?page=${currentPage}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("API success response:", data);
      
      setUsers(data.users);
      setTotalUsers(data.totalUsers);
      setHasNextPage(data.hasNextPage);
    } catch (error: any) {
      console.error("Error fetching users:", {
        message: error?.message || "Unknown error",
        error: error
      });
      toast.error(`Failed to load users: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      console.error("Error updating user role:", {
        message: error?.message || "Unknown error",
        userId,
        newRole,
        error: error
      });
      toast.error("Failed to update user role");
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="space-y-4">
      {isLoading ? (
        <TableSkeleton 
          columns={["User", "Email", "Role", "Last Sign In", "Created", "Actions"]}
          rows={6}
        />
      ) : users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <PersonIcon className="mr-2 h-4 w-4" />
                      {user.full_name || "Anonymous"}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge className="bg-red-600">Admin</Badge>
                    ) : user.role === "moderator" ? (
                      <Badge className="bg-amber-600">Moderator</Badge>
                    ) : (
                      <Badge variant="outline">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Select
                      defaultValue={user.role}
                      onValueChange={(value) => updateUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Pagination Controls */}
      {!isLoading && users.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalUsers)} of {totalUsers} users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-sm">Page {currentPage + 1}</span>
              {totalUsers > 0 && (
                <span className="text-sm text-muted-foreground">
                  of {Math.ceil(totalUsers / pageSize)}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}