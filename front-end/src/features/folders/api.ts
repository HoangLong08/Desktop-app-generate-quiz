import { APP_CONFIG } from "@/config/app";
import type { Folder } from "./types";

const API_URL = APP_CONFIG.API_URL;

export async function getFoldersApi(): Promise<Folder[]> {
  const response = await fetch(`${API_URL}/api/folders/`);
  if (!response.ok) {
    throw new Error("Failed to fetch folders");
  }
  return response.json();
}

export async function createFolderApi(
  name: string,
  description?: string,
  color?: string,
): Promise<Folder> {
  const response = await fetch(`${API_URL}/api/folders/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description, color }),
  });
  if (!response.ok) {
    throw new Error("Failed to create folder");
  }
  return response.json();
}

export async function updateFolderApi(
  id: string,
  data: Partial<Folder>,
): Promise<Folder> {
  const response = await fetch(`${API_URL}/api/folders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update folder");
  }
  return response.json();
}

export async function deleteFolderApi(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/folders/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete folder");
  }
}

export async function toggleFavoriteApi(id: string): Promise<Folder> {
  const response = await fetch(`${API_URL}/api/folders/${id}/favorite`, {
    method: "PATCH",
  });
  if (!response.ok) {
    throw new Error("Failed to toggle favorite");
  }
  return response.json();
}

export async function recordAccessApi(id: string): Promise<Folder> {
  const response = await fetch(`${API_URL}/api/folders/${id}/access`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to record access");
  }
  return response.json();
}
