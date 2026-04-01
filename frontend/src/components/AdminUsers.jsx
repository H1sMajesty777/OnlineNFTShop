import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const { apiClient, user: currentUser } = useAuth();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const res = await apiClient.get('/users');
        setUsers(res.data);
    };

    const updateUser = async (id, updates) => {
        await apiClient.put(`/users/${id}`, updates);
        loadUsers();
    };

    const blockUser = async (id) => {
        await apiClient.delete(`/users/${id}`);
        loadUsers();
    };

    if (currentUser?.role !== 'admin') {
        return <div>Access denied</div>;
    }

    return (
        <div className="admin-users">
            <h2>Управление пользователями</h2>
            <table>
                <thead>
                    <tr><th>Email</th><th>Имя</th><th>Фамилия</th><th>Роль</th><th>Статус</th><th>Действия</th></tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.email}</td>
                            <td>{u.first_name}</td>
                            <td>{u.last_name}</td>
                            <td>
                                <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })}>
                                    <option value="user">User</option>
                                    <option value="seller">Seller</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </td>
                            <td>{u.isBlocked ? 'Заблокирован' : 'Активен'}</td>
                            <td>
                                {!u.isBlocked && <button onClick={() => blockUser(u.id)}>Заблокировать</button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}