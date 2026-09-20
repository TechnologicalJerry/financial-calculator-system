import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

export interface DocumentItem {
  id: string;
  userId: string;
  folderId?: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  metadataJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FolderItem {
  id: string;
  userId: string;
  folderName: string;
  parentFolderId?: string | null;
  createdAt: string;
}

export interface CreateFolderDto {
  folderName: string;
  parentFolderId?: string;
}

export const documentService = {
  async getDocuments(folderId?: string): Promise<ApiResponse<DocumentItem[]>> {
    const res = await apiClient.get<ApiResponse<DocumentItem[]>>('/api/v1/documents', {
      params: { folderId },
    });
    return res.data;
  },

  async getDocumentById(id: string): Promise<ApiResponse<DocumentItem>> {
    const res = await apiClient.get<ApiResponse<DocumentItem>>(`/api/v1/documents/${id}`);
    return res.data;
  },

  async uploadDocument(formData: FormData): Promise<ApiResponse<DocumentItem>> {
    const res = await apiClient.post<ApiResponse<DocumentItem>>('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async downloadDocument(id: string): Promise<Blob> {
    const res = await apiClient.get(`/api/v1/documents/${id}/download`, {
      responseType: 'blob',
    });
    return res.data as Blob;
  },

  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/api/v1/documents/${id}`);
    return res.data;
  },

  async getFolders(): Promise<ApiResponse<FolderItem[]>> {
    const res = await apiClient.get<ApiResponse<FolderItem[]>>('/api/v1/folders');
    return res.data;
  },

  async createFolder(data: CreateFolderDto): Promise<ApiResponse<FolderItem>> {
    const res = await apiClient.post<ApiResponse<FolderItem>>('/api/v1/folders', data);
    return res.data;
  },

  async deleteFolder(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/api/v1/folders/${id}`);
    return res.data;
  },
};
