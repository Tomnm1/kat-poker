/**
 * Function to perform a PUT request (update data)
 * @param {string} path - The endpoint path (e.g. '/api/data')
 * @param {object} body - The data to send in the request body (e.g. { id: 1, name: 'Jane' })
 * @returns {Promise<any>} - A promise returning the server response or an error
 */
export const updateData = async (path: string, body: object): Promise<any> => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL; // Get the base URL from the environment variable
    try {
        const response = await fetch(`${url}${path}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error("Failed to update data");
        }

        return await response.json();
    } catch (error) {
        console.error("PUT request failed:", error);
        throw error;
    }
};
