import { useState, useCallback, useEffect } from "react";
import type { Folder } from "./types";
import {
  getFoldersApi,
  createFolderApi,
  deleteFolderApi,
  updateFolderApi,
  toggleFavoriteApi,
  recordAccessApi,
} from "./api";

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch folders on mount
  useEffect(() => {
    async function loadFolders() {
      try {
        setLoading(true);
        const data = await getFoldersApi();
        setFolders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load folders");
      } finally {
        setLoading(false);
      }
    }
    loadFolders();
  }, []);

  const createFolder = useCallback(
    async (name: string, description?: string, color?: string) => {
      try {
        const newFolder = await createFolderApi(name, description, color);
        setFolders((prev) => [...prev, newFolder]);
        return newFolder;
      } catch (err) {
        console.error("Failed to create folder", err);
        throw err;
      }
    },
    [],
  );

  const deleteFolder = useCallback(async (id: string) => {
    try {
      await deleteFolderApi(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Failed to delete folder", err);
      throw err;
    }
  }, []);

  const updateFolder = useCallback(
    async (
      id: string,
      data: Partial<Pick<Folder, "name" | "description" | "color">>,
    ) => {
      try {
        const updatedFolder = await updateFolderApi(id, data);
        setFolders((prev) =>
          prev.map((f) => (f.id === id ? updatedFolder : f)),
        );
        return updatedFolder;
      } catch (err) {
        console.error("Failed to update folder", err);
        throw err;
      }
    },
    [],
  );

  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const updatedFolder = await toggleFavoriteApi(id);
      setFolders((prev) => prev.map((f) => (f.id === id ? updatedFolder : f)));
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      throw err;
    }
  }, []);

  const recordAccess = useCallback(async (id: string) => {
    try {
      const updatedFolder = await recordAccessApi(id);
      setFolders((prev) => prev.map((f) => (f.id === id ? updatedFolder : f)));
    } catch (err) {
      console.error("Failed to record access", err);
    }
  }, []);

  return {
    folders,
    loading,
    error,
    createFolder,
    deleteFolder,
    updateFolder,
    toggleFavorite,
    recordAccess,
  };
}
