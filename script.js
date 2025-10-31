/**
 * AI News Aggregator
 *
 * This script is wrapped in an IIFE (Immediately Invoked Function Expression)
 * to prevent polluting the global namespace. This is a best practice for
 * writing reusable and conflict-free JavaScript components.
 */
(function () {
    // --- DOM Element Selection ---
    // We query the DOM once at the beginning for efficiency.
    const newsContainer = document.getElementById('news-container');
    const loader = document.getElementById('loader');
    const errorMessageContainer = document.getElementById('error-message');

    /**
     * --- MOCK APIs ---
     * In a real-world application, these functions would use the `fetch()` API
     * to call real news endpoints. For this prototype, we simulate them to
     * ensure the app is fully functional without external dependencies or API keys.
     * Each function returns a Promise, just like a real `fetch()` call.
     */

    // Simulates fetching top headlines from a major AI news source.
    function mockFetchAIHeadlines() {
        console.log("Fetching from AI News Central...");
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        title: "New Breakthrough in Large Language Models Allows for Real-Time Reasoning",
                        url: "#",
                        description: "Researchers have developed a novel architecture that significantly reduces the computational overhead of LLMs, paving the way for on-device AI.",
                        source: "AI News Central",
                        publishedAt: "2024-10-26T18:00:00Z"
                    },
                    {
                        title: "Generative AI Creates Award-Winning Short Film",
                        url: "#",
                        description: "An AI model named 'Cinemind' has written, directed, and edited a short film that has won accolades at an independent film festival.",
                        source: "AI News Central",
                        publishedAt: "2024-10-26T14:30:00Z"
                    }
                ]);
            }, 800); // Simulate 0.8s network delay
        });
    }

    // Simulates fetching posts from a popular tech blog or social feed.
    function mockFetchTechBlogs() {
        console.log("Fetching from The Tech Frontier Blog...");
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        title: "Is AGI Closer Than We Think? A Deep Dive",
                        url: "#",
                        description: "A comprehensive analysis of the current state of Artificial General Intelligence research and the remaining hurdles.",
                        source: "Tech Frontier",
                        publishedAt: "2024-10-27T09:00:00Z"
                    },
                    {
                        title: "How to Fine-Tune Your Own AI Model with Public Datasets",
                        url: "#",
                        description: "A step-by-step guide for developers looking to specialize open-source models for their own unique applications.",
                        source: "Tech Frontier",
                        publishedAt: "2024-10-25T11:00:00Z"
                    }
                ]);
            }, 1200); // Simulate 1.2s network delay
        });
    }

    /**
     * Fetches news from all configured sources concurrently.
     * Using Promise.all is highly efficient as it doesn't wait for one
     * request to finish before starting the next.
     * @returns {Promise<Array>} A promise that resolves to a sorted array of articles.
     */
    async function fetchAllNews() {
        // This array is easily extendable with more sources in the future.
        const sources = [
            mockFetchAIHeadlines(),
            mockFetchTechBlogs()
            // e.g., await fetchFromTwitter(), await fetchFromReddit()
        ];

        // Promise.all waits for all promises to resolve. If any fails, it rejects.
        const results = await Promise.all(sources);

        // The result is an array of arrays, so we flatten it into a single list.
        const allArticles = results.flat();

        // Sort articles by publication date, newest first. This is crucial for a news feed.
        allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        return allArticles;
    }

    /**
     * Renders an array of article objects into the DOM.
     * @param {Array} articles - The array of articles to display.
     */
    function renderArticles(articles) {
        if (!articles || articles.length === 0) {
            newsContainer.innerHTML = '<p>No news articles found at this time.</p>';
            return;
        }

        // For efficiency, we build the entire HTML string in memory and then
        // update the DOM once. This is much faster than appending elements one by one in a loop.
        const articlesHtml = articles.map(article => {
            // Sanitize by treating all API data as text content.
            // Using template literals for clean and readable HTML structure.
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
     * @param {string} message - The error message to show the user.
     */
    function displayError(message) {
        loader.style.display = 'none';
        errorMessageContainer.style.display = 'block';
        errorMessageContainer.textContent = `Failed to load news: ${message}. Please try again later.`;
    }

    /**
     * The main initialization function for the application.
     * It orchestrates the fetching, rendering, and error handling.
     */
    async function init() {
        // The try...catch block is essential for robustness. It gracefully
        // handles any errors during the asynchronous fetching process.
        try {
            // 1. Initial State: Show loader, hide content and errors.
            loader.style.display = 'block';
            errorMessageContainer.style.display = 'none';
            newsContainer.innerHTML = '';

            // 2. Fetch data
            const articles = await fetchAllNews();

            // 3. Render data
            renderArticles(articles);

            // 4. Final State: Hide loader, show content.
            loader.style.display = 'none';

        } catch (error) {
            console.error("Initialization failed:", error);
            displayError(error.message || 'An unknown error occurred');
        }
    }

    // --- Application Entry Point ---
    // We wait for the DOM to be fully loaded before running our script.
    // The `defer` attribute on the <script> tag also helps achieve this.
    document.addEventListener('DOMContentLoaded', init);

})();
