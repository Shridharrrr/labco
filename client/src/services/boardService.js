import api from './api';

export const getBoards = () => api.get('/boards');
export const createBoard = (data) => api.post('/boards', data);
export const getBoard = (boardId) => api.get(`/boards/${boardId}`);
export const updateBoard = (boardId, data) => api.patch(`/boards/${boardId}`, data);
export const archiveBoard = (boardId) => api.delete(`/boards/${boardId}`);
export const inviteMember = (boardId, data) => api.post(`/boards/${boardId}/members`, data);
export const changeMemberRole = (boardId, userId, data) => api.patch(`/boards/${boardId}/members/${userId}`, data);
export const removeMember = (boardId, userId) => api.delete(`/boards/${boardId}/members/${userId}`);

export const createColumn = (boardId, data) => api.post(`/boards/${boardId}/columns`, data);
export const reorderColumns = (boardId, data) => api.patch(`/boards/${boardId}/columns/reorder`, data);
export const updateColumn = (columnId, data) => api.patch(`/columns/${columnId}`, data);
export const deleteColumn = (columnId) => api.delete(`/columns/${columnId}`);

export const getActivity = (boardId, params) => api.get(`/boards/${boardId}/activity`, { params });
export const toggleStar = (boardId) => api.post(`/boards/${boardId}/star`);
