/**
 * Function to perform a POST request
 * @param {string} path - The endpoint path (e.g. '/api/data')
 * @param {object} body - The data to send in the request body (e.g. { name: 'John', age: 30 })
 * @returns {Promise<any>} - A promise returning the server response or an error
 */
export const postData = async (path: string, body: object): Promise<any> => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL; // Get the base URL from the environment variable
    console.log(`POST request to: ${url}${path}`); // Log the URL for debugging
    try {
        const response = await fetch(`${url}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error("Failed to post data");
        }

        return await response.json();
    } catch (error) {
        console.error("POST request failed:", error);
        throw error;
    }
};
