const express = require('express');
const router = express.Router();
const spotifyService = require('../services/spotifyService');

// Get Spotify authorization URL
router.get('/auth', (req, res) => {
    try {
        const authURL = spotifyService.getAuthURL();
        res.json({
            success: true,
            authURL: authURL
        });
    } catch (error) {
        console.error('Spotify auth URL error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Handle Spotify callback
router.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        return res.send(`
            <html>
                <body>
                    <h2>Authentication Failed</h2>
                    <p>Error: ${error}</p>
                    <p>This window will close automatically...</p>
                    <script>
                        setTimeout(() => {
                            window.close();
                        }, 3000);
                    </script>
                </body>
            </html>
        `);
    }

    if (!code) {
        return res.send(`
            <html>
                <body>
                    <h2>Authentication Failed</h2>
                    <p>No authorization code received</p>
                    <p>This window will close automatically...</p>
                    <script>
                        setTimeout(() => {
                            window.close();
                        }, 3000);
                    </script>
                </body>
            </html>
        `);
    }

    try {
        const tokenInfo = await spotifyService.getAccessToken(code);
        
        // Return success page that closes the window
        res.send(`
            <html>
                <body>
                    <h2>✅ Spotify Connected Successfully!</h2>
                    <p>You can now close this window and return to the main app.</p>
                    <p>This window will close automatically...</p>
                    <script>
                        setTimeout(() => {
                            window.close();
                        }, 2000);
                    </script>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Spotify callback error:', error);
        res.send(`
            <html>
                <body>
                    <h2>Authentication Failed</h2>
                    <p>Error: ${error.message}</p>
                    <p>This window will close automatically...</p>
                    <script>
                        setTimeout(() => {
                            window.close();
                        }, 3000);
                    </script>
                </body>
            </html>
        `);
    }
});

// Check authentication status
router.get('/status', (req, res) => {
    const isAuthenticated = spotifyService.isAuthenticated();
    res.json({
        success: true,
        authenticated: isAuthenticated
    });
});

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const profile = await spotifyService.getUserProfile();
        res.json({
            success: true,
            profile: profile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(401).json({
            success: false,
            error: error.message
        });
    }
});

// Get current playback state
router.get('/playback', async (req, res) => {
    try {
        const playback = await spotifyService.getCurrentPlayback();
        res.json({
            success: true,
            playback: playback
        });
    } catch (error) {
        console.error('Get playback error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get currently playing track
router.get('/now-playing', async (req, res) => {
    try {
        const nowPlaying = await spotifyService.getCurrentlyPlaying();
        res.json({
            success: true,
            nowPlaying: nowPlaying
        });
    } catch (error) {
        console.error('Get now playing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Play/resume
router.post('/play', async (req, res) => {
    try {
        await spotifyService.play();
        res.json({
            success: true,
            message: 'Playback started'
        });
    } catch (error) {
        console.error('Play error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Pause
router.post('/pause', async (req, res) => {
    try {
        await spotifyService.pause();
        res.json({
            success: true,
            message: 'Playback paused'
        });
    } catch (error) {
        console.error('Pause error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Next track
router.post('/next', async (req, res) => {
    try {
        await spotifyService.next();
        res.json({
            success: true,
            message: 'Skipped to next track'
        });
    } catch (error) {
        console.error('Next track error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Previous track
router.post('/previous', async (req, res) => {
    try {
        await spotifyService.previous();
        res.json({
            success: true,
            message: 'Skipped to previous track'
        });
    } catch (error) {
        console.error('Previous track error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Set volume
router.post('/volume', async (req, res) => {
    try {
        const { volume } = req.body;
        
        if (volume === undefined || volume < 0 || volume > 100) {
            return res.status(400).json({
                success: false,
                error: 'Volume must be between 0 and 100'
            });
        }

        await spotifyService.setVolume(volume);
        res.json({
            success: true,
            message: `Volume set to ${volume}%`
        });
    } catch (error) {
        console.error('Set volume error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get top tracks
router.get('/top-tracks', async (req, res) => {
    try {
        const { limit = 10, time_range = 'medium_term' } = req.query;
        const topTracks = await spotifyService.getTopTracks(limit, time_range);
        res.json({
            success: true,
            tracks: topTracks.items
        });
    } catch (error) {
        console.error('Get top tracks error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get playlists
router.get('/playlists', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const playlists = await spotifyService.getUserPlaylists(limit);
        res.json({
            success: true,
            playlists: playlists.items
        });
    } catch (error) {
        console.error('Get playlists error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Logout/clear authentication
router.post('/logout', (req, res) => {
    try {
        spotifyService.clearAuth();
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;