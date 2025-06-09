import { useState, useCallback } from 'react';
import { deleteData } from '@/app/utils/api/delete';

interface UseDeleteConfirmationOptions {
    onSuccess?: () => void;
    onError?: (error: any) => void;
    confirmMessage?: string;
}

export const useDeleteConfirmation = (options: UseDeleteConfirmationOptions = {}) => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pendingPath, setPendingPath] = useState<string | null>(null);

    const {
        onSuccess,
        onError,
        confirmMessage = "Are you sure to continue? This action cannot be undone."
    } = options;

    const requestDelete = useCallback((path: string) => {
        setPendingPath(path);
        setIsConfirmOpen(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!pendingPath) return;

        setIsDeleting(true);
        try {
            const result = await deleteData(pendingPath);

            if (result?.error) {
                onError?.(result);
            } else {
                onSuccess?.();
            }
        } catch (error) {
            onError?.(error);
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
            setPendingPath(null);
        }
    }, [pendingPath, onSuccess, onError]);

    const cancelDelete = useCallback(() => {
        setIsConfirmOpen(false);
        setPendingPath(null);
    }, []);

    return {
        isConfirmOpen,
        isDeleting,
        confirmMessage,
        requestDelete,
        confirmDelete,
        cancelDelete,
        pendingPath
    };
};