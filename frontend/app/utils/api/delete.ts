/**
 * Function to perform a DELETE request
 * @param {string} path - The endpoint path (e.g. '/api/data/1')
 * @returns {Promise<any>} - A promise returning the server response or an error
 */
export const deleteData = async (path: string): Promise<any> => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL; // Get the base URL from the environment variable
    try {
        const response = await fetch(`${url}${path}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return { error: "Not found", status: 404 }; // Specific message for 404
            }
            else {
                throw new Error("Failed to delete data");
            }
        }

        return;
    } catch (error) {
        console.error("DELETE request failed:", error);
        throw error;
    }
};
