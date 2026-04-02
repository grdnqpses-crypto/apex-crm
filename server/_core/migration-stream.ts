/**
 * Migration Stream Endpoint
 * Server-Sent Events for real-time migration progress
 */

import { Express } from 'express';
import { migrationEventEmitter } from '../migration-events';

export function setupMigrationStream(app: Express) {
  /**
   * GET /api/migration/stream
   * Server-Sent Events endpoint for real-time migration progress
   *
   * Query params:
   *   - migrationId: string (required) - ID of the migration to stream
   *   - token: string (required) - JWT token for authentication
   */
  app.get('/api/migration/stream', (req, res) => {
    const migrationId = req.query.migrationId as string;
    const token = req.query.token as string;

    if (!migrationId) {
      res.status(400).json({ error: 'migrationId is required' });
      return;
    }

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // TODO: Validate JWT token
    // For now, we'll trust that the token is valid (it's passed from authenticated client)

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', migrationId })}\n\n`);

    // Send current event stream
    const currentStream = migrationEventEmitter.getStream(migrationId);
    res.write(`data: ${JSON.stringify({ type: 'stream', ...currentStream })}\n\n`);

    // Subscribe to new events
    const unsubscribe = migrationEventEmitter.subscribe(migrationId, (event) => {
      res.write(`data: ${JSON.stringify({ type: 'event', event })}\n\n`);

      // Also send updated stream
      const updatedStream = migrationEventEmitter.getStream(migrationId);
      res.write(`data: ${JSON.stringify({ type: 'stream', ...updatedStream })}\n\n`);
    });

    // Handle client disconnect
    req.on('close', () => {
      unsubscribe();
      res.end();
    });

    // Handle errors
    req.on('error', () => {
      unsubscribe();
      res.end();
    });
  });

  /**
   * GET /api/migration/stream/history
   * Get complete event history for a migration
   */
  app.get('/api/migration/stream/history', (req, res) => {
    const migrationId = req.query.migrationId as string;
    const token = req.query.token as string;

    if (!migrationId || !token) {
      res.status(400).json({ error: 'migrationId and token are required' });
      return;
    }

    // TODO: Validate JWT token

    const stream = migrationEventEmitter.getStream(migrationId);
    res.json(stream);
  });
}
