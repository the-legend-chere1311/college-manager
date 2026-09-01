const axios = require('axios');

class SpotifyService {
    constructor() {
        // Spotify API endpoints
        this.authURL = 'https://accounts.spotify.com/authorize';
        this.tokenURL = 'https://accounts.spotify.com/api/token';
        this.apiURL = 'https://api.spotify.com/v1';
        
        // These will be set from environment variables
        this.clientId = process.env.SPOTIFY_CLIENT_ID;
        this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5001/spotify/callback';
        
        // Required scopes for playback control and user data
        this.scopes = [
            'user-read-private',
            'user-read-email',
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-currently-playing',
            'user-library-read',
            'user-top-read',
            'playlist-read-private',
            'playlist-read-collaborative'
        ].join(' ');
        
        // In-memory token storage (in production, use Redis or database)
        this.accessTokens = new Map();
    }

    /**
     * Generate Spotify authorization URL
     */
    getAuthURL(state = 'spotify-auth') {
        if (!this.clientId) {
            throw new Error('Spotify Client ID not configured');
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            scope: this.scopes,
            redirect_uri: this.redirectUri,
            state: state,
            show_dialog: 'true'
        });

        return `${this.authURL}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async getAccessToken(code) {
        if (!this.clientId || !this.clientSecret) {
            throw new Error('Spotify credentials not configured');
        }

        try {
            const response = await axios.post(this.tokenURL, new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri
            }), {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const tokenData = response.data;
            
            // Store token with expiration time
            const tokenInfo = {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_at: Date.now() + (tokenData.expires_in * 1000),
                token_type: tokenData.token_type
            };

            // In a real app, associate this with a user ID
            this.accessTokens.set('default_user', tokenInfo);
            
            return tokenInfo;
        } catch (error) {
            console.error('Error getting access token:', error.response?.data || error.message);
            throw new Error('Failed to get access token');
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(userId = 'default_user') {
        const tokenInfo = this.accessTokens.get(userId);
        
        if (!tokenInfo?.refresh_token) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await axios.post(this.tokenURL, new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: tokenInfo.refresh_token
            }), {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const newTokenData = response.data;
            
            // Update stored token
            tokenInfo.access_token = newTokenData.access_token;
            tokenInfo.expires_at = Date.now() + (newTokenData.expires_in * 1000);
            
            // Update refresh token if provided
            if (newTokenData.refresh_token) {
                tokenInfo.refresh_token = newTokenData.refresh_token;
            }

            this.accessTokens.set(userId, tokenInfo);
            
            return tokenInfo;
        } catch (error) {
            console.error('Error refreshing token:', error.response?.data || error.message);
            throw new Error('Failed to refresh access token');
        }
    }

    /**
     * Get valid access token (refresh if needed)
     */
    async getValidToken(userId = 'default_user') {
        let tokenInfo = this.accessTokens.get(userId);
        
        if (!tokenInfo) {
            throw new Error('User not authenticated with Spotify');
        }

        // Check if token is expired (with 5 minute buffer)
        if (Date.now() >= (tokenInfo.expires_at - 300000)) {
            tokenInfo = await this.refreshAccessToken(userId);
        }

        return tokenInfo.access_token;
    }

    /**
     * Make authenticated API request
     */
    async makeSpotifyRequest(endpoint, method = 'GET', data = null, userId = 'default_user') {
        try {
            const accessToken = await this.getValidToken(userId);
            
            const config = {
                method,
                url: `${this.apiURL}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                config.data = data;
            }

            const response = await axios(config);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                // Try to refresh token and retry once
                try {
                    await this.refreshAccessToken(userId);
                    const accessToken = await this.getValidToken(userId);
                    
                    const retryConfig = {
                        method,
                        url: `${this.apiURL}${endpoint}`,
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    };

                    if (data && (method === 'POST' || method === 'PUT')) {
                        retryConfig.data = data;
                    }

                    const retryResponse = await axios(retryConfig);
                    return retryResponse.data;
                } catch (retryError) {
                    throw new Error('Authentication failed');
                }
            }
            
            console.error('Spotify API error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error?.message || 'Spotify API request failed');
        }
    }

    /**
     * Get current user's profile
     */
    async getUserProfile(userId = 'default_user') {
        return await this.makeSpotifyRequest('/me', 'GET', null, userId);
    }

    /**
     * Get current playback state
     */
    async getCurrentPlayback(userId = 'default_user') {
        try {
            return await this.makeSpotifyRequest('/me/player', 'GET', null, userId);
        } catch (error) {
            // Return null if no active device
            if (error.message.includes('No active device')) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get currently playing track
     */
    async getCurrentlyPlaying(userId = 'default_user') {
        return await this.makeSpotifyRequest('/me/player/currently-playing', 'GET', null, userId);
    }

    /**
     * Play/resume playback
     */
    async play(userId = 'default_user', deviceId = null) {
        const endpoint = deviceId ? `/me/player/play?device_id=${deviceId}` : '/me/player/play';
        return await this.makeSpotifyRequest(endpoint, 'PUT', {}, userId);
    }

    /**
     * Pause playback
     */
    async pause(userId = 'default_user', deviceId = null) {
        const endpoint = deviceId ? `/me/player/pause?device_id=${deviceId}` : '/me/player/pause';
        return await this.makeSpotifyRequest(endpoint, 'PUT', {}, userId);
    }

    /**
     * Skip to next track
     */
    async next(userId = 'default_user', deviceId = null) {
        const endpoint = deviceId ? `/me/player/next?device_id=${deviceId}` : '/me/player/next';
        return await this.makeSpotifyRequest(endpoint, 'POST', {}, userId);
    }

    /**
     * Skip to previous track
     */
    async previous(userId = 'default_user', deviceId = null) {
        const endpoint = deviceId ? `/me/player/previous?device_id=${deviceId}` : '/me/player/previous';
        return await this.makeSpotifyRequest(endpoint, 'POST', {}, userId);
    }

    /**
     * Set volume
     */
    async setVolume(volumePercent, userId = 'default_user', deviceId = null) {
        const endpoint = `/me/player/volume?volume_percent=${volumePercent}${deviceId ? `&device_id=${deviceId}` : ''}`;
        return await this.makeSpotifyRequest(endpoint, 'PUT', {}, userId);
    }

    /**
     * Get user's top tracks
     */
    async getTopTracks(limit = 10, timeRange = 'medium_term', userId = 'default_user') {
        return await this.makeSpotifyRequest(`/me/top/tracks?limit=${limit}&time_range=${timeRange}`, 'GET', null, userId);
    }

    /**
     * Get user's playlists
     */
    async getUserPlaylists(limit = 20, userId = 'default_user') {
        return await this.makeSpotifyRequest(`/me/playlists?limit=${limit}`, 'GET', null, userId);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(userId = 'default_user') {
        return this.accessTokens.has(userId);
    }

    /**
     * Clear user authentication
     */
    clearAuth(userId = 'default_user') {
        this.accessTokens.delete(userId);
    }
}

module.exports = new SpotifyService();