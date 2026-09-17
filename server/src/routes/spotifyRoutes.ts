import { Router } from 'express';
import {
  getPlaybackStatus,
  controlPlayer,
  connectSpotifyToken,
  disconnectSpotify
} from '../controllers/spotifyController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/playback', getPlaybackStatus);
router.post('/control', controlPlayer);
router.post('/connect', connectSpotifyToken);
router.delete('/disconnect', disconnectSpotify);

export default router;
