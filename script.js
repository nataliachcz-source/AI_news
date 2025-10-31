/**
 * AI News Aggregator
 *
 * This script is wrapped in an IIFE (Immediately Invoked Function Expression)
 * to prevent polluting the global namespace. This is a best practice for
 * writing reusable and conflict-free JavaScript components.
 */
(function () {
    // --- Configuration ---
    // IMPORTANT: Replace 'YOUR_GNEWS_API_KEY' with the key you received from gnews.io
    const API_KEY = 'YOUR_GNEWS_API_KEY';
    const GNEWS_API_URL = `https://gnews.io/api/v4/search?q="artificial intelligence" OR "machine learning"&lang=en&max=10&token=${API_KEY}`;

    // --- Caching Strategy ---
    // To stay within the 100 requests/day limit, we cache results in the browser's localStorage.
    // 8 hours * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second = 28,800,000 ms
    // This means we will fetch new data a maximum of 3 times per day per user.
    const CACHE_DURATION_MS = 8 * 60 * 60 * 1000;
    const CACHE_KEY = 'aiNewsCache';
    const CACHE_TIMESTAMP_KEY = 'aiNewsCacheTimestamp';

    // --- DOM Element Selection ---
    const newsContainer = document.getElementById('news-container');
    const loader = document.getElementById('loader');
    const errorMessageContainer = document.getElementById('error-message');

    /**
     * Fetches news from the GNews API.
     * This function now handles a real network request.
     * @returns {Promise<Array>} A promise that resolves to an array of articles.
     */
    async function fetchFromGNews() {
        console.log("Fetching fresh news from GNews API...");
        const response = await fetch(GNEWS_API_URL);

        // Robustness: Check if the network request was successful.
        if (!response.ok) {
            // GNews provides error messages in its JSON response, so we try to parse them.
            const errorData = await response.json();
            throw new Error(errorData.errors[0] || `API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Data Transformation: We map the API's data structure to our application's
        // internal structure. This decouples our app from the specific API format,
        // making it easy to switch or add sources later.
        return data.articles.map(article => ({
            title: article.title,
            url: article.url,
            description: article.description,
            source: article.source.name, // GNews nests the source name
            publishedAt: article.publishedAt
        }));
    }

    /**
     * Fetches news from all sources, using a cache to avoid excessive API calls.
     * @returns {Promise<Array>} A promise that resolves to a sorted array of articles.
     */
    async function fetchAllNews() {
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        const cachedNews = localStorage.getItem(CACHE_KEY);

        // Check if a valid, non-stale cache exists.
        if (cachedTimestamp && cachedNews && (Date.now() - cachedTimestamp < CACHE_DURATION_MS)) {
            console.log("Loading news from cache. It's fresh enough!");
            // If the cache is valid, parse it and return the data immediately.
            // This completely avoids an API call.
            return JSON.parse(cachedNews);
        }

        // If cache is stale or doesn't exist, fetch new data.
        console.log("Cache is stale or empty. Fetching new data from API.");
        const articles = await fetchFromGNews(); // The only source for now

        // Sort articles by publication date, newest first.
        articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        // Save the newly fetched data and the current timestamp to the cache.
        // We use try-catch in case localStorage is full or disabled (e.g., in private browsing).
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now());
            console.log("New data saved to cache.");
        } catch (e) {
            console.error("Failed to save to localStorage:", e);
        }

        return articles;
    }

    /**
     * Renders an array of article objects into the DOM.
     * (This function remains unchanged as its logic is sound).
     * @param {Array} articles - The array of articles to display.
     */
    function renderArticles(articles) {
        if (!articles || articles.length === 0) {
            newsContainer.innerHTML = '<p>No news articles found at this time.</p>';
            return;
        }
        const articlesHtml = articles.map(article => {
            const title = article.title || 'Untitled Article';
            const url = article.url || '#';
            const description = article.description || 'No description available.';
            const source = article.source || 'Unknown Source';
            const date = new Date(article.publishedAt).toLocaleDateString();

            return `
                <article class="news-article">
                    <h2><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></h2>
                    <p>${description}</p>
                    <div class="article-meta">
                        <span class="source">${source}</span>
                        <time datetime="${article.publishedAt}">${date}</time>
                    </div>
                </article>
            `;
        }).join('');
        newsContainer.innerHTML = articlesHtml;
    }

    /**
     * Displays an error message in the UI.
     * (This function remains unchanged).
     * @param {string} message - The error message to show the user.
     */
    function displayError(message) {
        loader.style.display = 'none';
        errorMessageContainer.style.display = 'block';
        // A special check for the most common API key error.
        if (message.includes("token")) {
             errorMessageContainer.textContent = `API Key Error: Please check that you have correctly placed your GNews API key in the script.js file.`;
        } else {
             errorMessageContainer.textContent = `Failed to load news: ${message}. Please try again later.`;
        }
    }

    /**
     * The main initialization function for the application.
     * (This function remains unchanged).
     */
    async function init() {
        try {
            loader.style.display = 'block';
            errorMessageContainer.style.display = 'none';
            newsContainer.innerHTML = '';
            
            const articles = await fetchAllNews();
            renderArticles(articles);
            
            loader.style.display = 'none';
        } catch (error) {
            console.error("Initialization failed:", error);
            displayError(error.message || 'An unknown error occurred');
        }
    }

    // --- Application Entry Point ---
    document.addEventListener('DOMContentLoaded', init);

})();
