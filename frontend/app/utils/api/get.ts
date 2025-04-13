/**
 * Function to perform a GET request
 * @param {string} path - The endpoint path (e.g. '/api/data')
 * @returns {Promise<any>} - A promise returning data or an error
 */
export const getData = async (path: string): Promise<any> => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL; // Get the base URL from the environment variable
    try {
        const response = await fetch(`${url}${path}`);
        if (!response.ok) {
            const errorData = await response.text(); // Get the error message from the response
            if (response.status === 404) {
                return { error: "Not found", status: 404 }; // Specific message for 404
            } else {
                return { error: errorData || "Failed to fetch data", status: response.status }; // General error message for other statuses
            }
        }
        return await response.json();
    } catch (error) {
        console.error("GET request failed:", error);
        throw error;
    }
};
