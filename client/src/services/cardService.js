import api from './api';

export const createCard = (columnId, data) => api.post(`/columns/${columnId}/cards`, data);
export const getCard = (cardId) => api.get(`/cards/${cardId}`);
export const updateCard = (cardId, data) => api.patch(`/cards/${cardId}`, data);
export const archiveCard = (cardId) => api.delete(`/cards/${cardId}`);
export const moveCard = (cardId, data) => api.patch(`/cards/${cardId}/move`, data);
export const addAttachment = (cardId, formData) =>
  api.post(`/cards/${cardId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const removeAttachment = (cardId, attachmentId) =>
  api.delete(`/cards/${cardId}/attachments/${attachmentId}`);
