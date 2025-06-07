/**
 * Function to perform a POST request
 * @param {string} path - The endpoint path (e.g. '/api/data')
 * @param {object} body - The data to send in the request body (e.g. { name: 'John', age: 30 })
 * @returns {Promise<any>} - A promise returning the server response or an error
 */
export const postData = async (path: string, body: object,token?: string): Promise<any> => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL; // Get the base URL from the environment variable
    console.log(`POST request to: ${url}${path}`); // Log the URL for debugging
    try {
          const headers: { [key: string]: string } = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${url}${path}`, {
            method: "POST",
           headers: headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const responseText = await response.text(); 
            console.error("Error response text:", responseText);
            throw new Error(` ${responseText}`);
        }
        if (response.status === 204) {
            return null; // Return null for 204 No Content responses
        }
        if(response.body === null) {
            return null; // Handle cases where the response body is null
        }
      if (response.status === 200) {
            const responseText = await response.text(); // Read the response as text first

            // If the body is empty or null, return null
            if (!responseText.trim()) {
                return null; // Return null if the response body is empty
            }

            // Otherwise, attempt to parse the response as JSON
            const responseData = JSON.parse(responseText);
            return responseData;
        }
        return null
    } catch (error) {
        console.error("POST request failed:", error);
        throw error;
    }
};
