import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Webhook endpoint for Make.com integrations
 *
 * This endpoint receives webhooks from Make.com scenarios and processes them.
 *
 * Supported webhook types:
 * - reservation.created: New reservation created
 * - reservation.updated: Reservation updated (status change, reschedule)
 * - reservation.cancelled: Reservation cancelled
 * - attendance.checked: Attendance checked (attended/absent/late)
 * - memo.created: Consultation memo created
 *
 * Security:
 * - Validates webhook signature using HMAC-SHA256
 * - Checks instructor's webhook_secret from database
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get instructor ID from query params
    const { instructorId } = req.query;
    if (!instructorId || typeof instructorId !== 'string') {
      return res.status(400).json({ error: 'Missing instructorId parameter' });
    }

    // Get signature from headers
    const signature = req.headers['x-webhook-signature'] as string;
    if (!signature) {
      return res.status(401).json({ error: 'Missing webhook signature' });
    }

    // Get instructor's webhook secret from database
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('webhook_secret, webhook_url')
      .eq('instructor_id', instructorId)
      .single();

    if (settingsError || !settings?.webhook_secret) {
      return res.status(401).json({ error: 'Webhook not configured for this instructor' });
    }

    // Verify webhook signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', settings.webhook_secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Process webhook based on event type
    const { event, data } = req.body;

    switch (event) {
      case 'reservation.created':
        await handleReservationCreated(data);
        break;

      case 'reservation.updated':
        await handleReservationUpdated(data);
        break;

      case 'reservation.cancelled':
        await handleReservationCancelled(data);
        break;

      case 'attendance.checked':
        await handleAttendanceChecked(data);
        break;

      case 'memo.created':
        await handleMemoCreated(data);
        break;

      default:
        return res.status(400).json({ error: `Unknown event type: ${event}` });
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: `Webhook processed: ${event}`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Handle reservation.created event
 */
async function handleReservationCreated(data: any) {
  const { reservation_id, instructor_id, student_name, date, time } = data;

  // Log the event
  await supabase.from('webhook_logs').insert({
    event_type: 'reservation.created',
    instructor_id,
    payload: data,
    processed_at: new Date().toISOString(),
  });

  // You can add custom logic here, e.g.:
  // - Send notification to instructor
  // - Update external calendar
  // - Trigger other automations
}

/**
 * Handle reservation.updated event
 */
async function handleReservationUpdated(data: any) {
  const { reservation_id, instructor_id, changes } = data;

  await supabase.from('webhook_logs').insert({
    event_type: 'reservation.updated',
    instructor_id,
    payload: data,
    processed_at: new Date().toISOString(),
  });
}

/**
 * Handle reservation.cancelled event
 */
async function handleReservationCancelled(data: any) {
  const { reservation_id, instructor_id, student_name, reason } = data;

  await supabase.from('webhook_logs').insert({
    event_type: 'reservation.cancelled',
    instructor_id,
    payload: data,
    processed_at: new Date().toISOString(),
  });

  // Custom logic: Send cancellation notification, update availability, etc.
}

/**
 * Handle attendance.checked event
 */
async function handleAttendanceChecked(data: any) {
  const { reservation_id, instructor_id, student_name, status, memo } = data;

  await supabase.from('webhook_logs').insert({
    event_type: 'attendance.checked',
    instructor_id,
    payload: data,
    processed_at: new Date().toISOString(),
  });

  // Custom logic: Update student records, send feedback, etc.
}

/**
 * Handle memo.created event
 */
async function handleMemoCreated(data: any) {
  const { memo_id, instructor_id, student_name, content, tags } = data;

  await supabase.from('webhook_logs').insert({
    event_type: 'memo.created',
    instructor_id,
    payload: data,
    processed_at: new Date().toISOString(),
  });

  // Custom logic: Sync to Notion, send summary email, etc.
}
