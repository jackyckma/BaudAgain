/**
 * NotificationService
 * 
 * Manages WebSocket notification broadcasting and event subscriptions.
 * Provides mechanisms for clients to subscribe to specific event types
 * and broadcasts events to subscribed clients with optional filtering.
 * 
 * Requirements: 17.1, 17.2 - WebSocket Notification System
 */

import { FastifyBaseLogger } from 'fastify';
import { IConnection } from '../connection/IConnection.js';
import {
  NotificationEvent,
  NotificationEventType,
  EventSubscription,
  EventFilter,
  createNotificationEvent,
  NotificationErrorCode,
  ErrorPayload,
} from './types.js';
import {
  isBroadcastEvent,
  isFilterableEvent,
  getFilterFields,
  isValidEventType,
  MAX_SUBSCRIPTIONS_PER_CLIENT,
} from './constants.js';

/**
 * Represents a client subscription to events
 */
interface ClientSubscription {
  /** Connection ID of the subscribed client */
  connectionId: string;
  
  /** Event type subscribed to */
  eventType: NotificationEventType;
  
  /** Optional filter criteria */
  filter?: EventFilter;
}

/**
 * Tracks client connection metadata
 */
interface ClientMetadata {
  /** Connection instance */
  connection: IConnection;
  
  /** User ID if authenticated */
  userId?: string;
  
  /** List of active subscriptions */
  subscriptions: ClientSubscription[];
  
  /** Whether the client is authenticated */
  authenticated: boolean;
}

/**
 * NotificationService manages event broadcasting and subscriptions
 */
export class NotificationService {
  /** Map of connection ID to client metadata */
  private clients: Map<string, ClientMetadata> = new Map();
  
  /** Map of event type to list of subscriptions */
  private subscriptionsByEvent: Map<NotificationEventType, ClientSubscription[]> = new Map();

  constructor(private logger: FastifyBaseLogger) {
    this.logger.info('NotificationService initialized');
  }

  // ============================================================================
  // Client Management
  // ============================================================================

  /**
   * Register a new client connection
   */
  registerClient(connection: IConnection, userId?: string): void {
    const metadata: ClientMetadata = {
      connection,
      userId,
      subscriptions: [],
      authenticated: !!userId,
    };

    this.clients.set(connection.id, metadata);
    
    this.logger.info(
      { connectionId: connection.id, userId, authenticated: metadata.authenticated },
      'Client registered'
    );

    // Set up cleanup on connection close
    connection.onClose(() => {
      this.unregisterClient(connection.id);
    });
  }

  /**
   * Unregister a client connection and clean up subscriptions
   */
  unregisterClient(connectionId: string): void {
    const client = this.clients.get(connectionId);
    if (!client) {
      return;
    }

    // Remove all subscriptions for this client
    for (const subscription of client.subscriptions) {
      this.removeSubscriptionFromIndex(subscription);
    }

    this.clients.delete(connectionId);
    
    this.logger.info(
      { connectionId, subscriptionCount: client.subscriptions.length },
      'Client unregistered'
    );
  }

  /**
   * Update client authentication status
   */
  authenticateClient(connectionId: string, userId: string): void {
    const client = this.clients.get(connectionId);
    if (!client) {
      this.logger.warn({ connectionId }, 'Attempted to authenticate non-existent client');
      return;
    }

    client.userId = userId;
    client.authenticated = true;

    this.logger.info({ connectionId, userId }, 'Client authenticated');
  }

  /**
   * Check if a client is registered
   */
  isClientRegistered(connectionId: string): boolean {
    return this.clients.has(connectionId);
  }

  /**
   * Get client metadata
   */
  getClient(connectionId: string): ClientMetadata | undefined {
    return this.clients.get(connectionId);
  }

  /**
   * Get all registered clients
   */
  getAllClients(): ClientMetadata[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get count of registered clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Subscribe a client to one or more event types
   */
  subscribe(
    connectionId: string,
    subscriptions: (string | EventSubscription)[]
  ): { success: string[]; failed: string[] } {
    const client = this.clients.get(connectionId);
    if (!client) {
      this.logger.warn({ connectionId }, 'Attempted to subscribe non-existent client');
      return { success: [], failed: subscriptions.map(s => typeof s === 'string' ? s : s.type) };
    }

    // Check subscription limit
    const currentCount = client.subscriptions.length;
    const newCount = subscriptions.length;
    if (currentCount + newCount > MAX_SUBSCRIPTIONS_PER_CLIENT) {
      this.logger.warn(
        { connectionId, currentCount, newCount, limit: MAX_SUBSCRIPTIONS_PER_CLIENT },
        'Subscription limit exceeded'
      );
      return {
        success: [],
        failed: subscriptions.map(s => typeof s === 'string' ? s : s.type),
      };
    }

    const success: string[] = [];
    const failed: string[] = [];

    for (const sub of subscriptions) {
      const eventType = typeof sub === 'string' ? sub : sub.type;
      const filter = typeof sub === 'string' ? undefined : sub.filter;

      // Validate event type
      if (!isValidEventType(eventType)) {
        this.logger.warn({ connectionId, eventType }, 'Invalid event type');
        failed.push(eventType);
        continue;
      }

      // Validate filter if provided
      if (filter && !this.isValidFilter(eventType as NotificationEventType, filter)) {
        this.logger.warn({ connectionId, eventType, filter }, 'Invalid filter for event type');
        failed.push(eventType);
        continue;
      }

      // Create subscription
      const subscription: ClientSubscription = {
        connectionId,
        eventType: eventType as NotificationEventType,
        filter,
      };

      // Add to client subscriptions
      client.subscriptions.push(subscription);

      // Add to event index
      this.addSubscriptionToIndex(subscription);

      success.push(eventType);
      
      this.logger.debug(
        { connectionId, eventType, filter },
        'Client subscribed to event'
      );
    }

    this.logger.info(
      { connectionId, successCount: success.length, failedCount: failed.length },
      'Subscription request processed'
    );

    return { success, failed };
  }

  /**
   * Unsubscribe a client from one or more event types
   */
  unsubscribe(connectionId: string, eventTypes: string[]): void {
    const client = this.clients.get(connectionId);
    if (!client) {
      this.logger.warn({ connectionId }, 'Attempted to unsubscribe non-existent client');
      return;
    }

    for (const eventType of eventTypes) {
      // Find and remove matching subscriptions
      const matchingSubscriptions = client.subscriptions.filter(
        sub => sub.eventType === eventType
      );

      for (const subscription of matchingSubscriptions) {
        // Remove from client subscriptions
        const index = client.subscriptions.indexOf(subscription);
        if (index > -1) {
          client.subscriptions.splice(index, 1);
        }

        // Remove from event index
        this.removeSubscriptionFromIndex(subscription);
      }

      this.logger.debug({ connectionId, eventType }, 'Client unsubscribed from event');
    }

    this.logger.info(
      { connectionId, eventTypes, remainingCount: client.subscriptions.length },
      'Unsubscribe request processed'
    );
  }

  /**
   * Get all subscriptions for a client
   */
  getClientSubscriptions(connectionId: string): ClientSubscription[] {
    const client = this.clients.get(connectionId);
    return client ? [...client.subscriptions] : [];
  }

  /**
   * Add subscription to event index for efficient lookup
   */
  private addSubscriptionToIndex(subscription: ClientSubscription): void {
    const eventType = subscription.eventType;
    
    if (!this.subscriptionsByEvent.has(eventType)) {
      this.subscriptionsByEvent.set(eventType, []);
    }

    this.subscriptionsByEvent.get(eventType)!.push(subscription);
  }

  /**
   * Remove subscription from event index
   */
  private removeSubscriptionFromIndex(subscription: ClientSubscription): void {
    const eventType = subscription.eventType;
    const subscriptions = this.subscriptionsByEvent.get(eventType);
    
    if (subscriptions) {
      const index = subscriptions.indexOf(subscription);
      if (index > -1) {
        subscriptions.splice(index, 1);
      }

      // Clean up empty arrays
      if (subscriptions.length === 0) {
        this.subscriptionsByEvent.delete(eventType);
      }
    }
  }

  /**
   * Validate filter criteria for an event type
   */
  private isValidFilter(eventType: NotificationEventType, filter: EventFilter): boolean {
    if (!isFilterableEvent(eventType)) {
      // Event doesn't support filtering
      return Object.keys(filter).length === 0;
    }

    const supportedFields = getFilterFields(eventType);
    const providedFields = Object.keys(filter);

    // Check if all provided fields are supported
    return providedFields.every(field => supportedFields.includes(field));
  }

  // ============================================================================
  // Event Broadcasting
  // ============================================================================

  /**
   * Broadcast an event to all subscribed clients
   */
  async broadcast<T>(event: NotificationEvent<T>): Promise<void> {
    const eventType = event.type;
    
    this.logger.debug({ eventType, timestamp: event.timestamp }, 'Broadcasting event');

    // Get subscriptions for this event type
    const subscriptions = this.subscriptionsByEvent.get(eventType) || [];

    if (subscriptions.length === 0) {
      this.logger.debug({ eventType }, 'No subscribers for event');
      return;
    }

    // Determine which clients should receive this event
    const targetClients = this.getTargetClients(event, subscriptions);

    // Send event to each target client
    const sendPromises = targetClients.map(async (client) => {
      try {
        await this.sendEventToClient(client.connection, event);
      } catch (error) {
        this.logger.error(
          { connectionId: client.connection.id, eventType, error },
          'Failed to send event to client'
        );
      }
    });

    await Promise.allSettled(sendPromises);

    this.logger.info(
      { eventType, subscriberCount: subscriptions.length, sentCount: targetClients.length },
      'Event broadcast complete'
    );
  }

  /**
   * Broadcast an event to a specific client
   */
  async broadcastToClient<T>(connectionId: string, event: NotificationEvent<T>): Promise<void> {
    const client = this.clients.get(connectionId);
    if (!client) {
      this.logger.warn({ connectionId }, 'Attempted to broadcast to non-existent client');
      return;
    }

    try {
      await this.sendEventToClient(client.connection, event);
      this.logger.debug({ connectionId, eventType: event.type }, 'Event sent to specific client');
    } catch (error) {
      this.logger.error(
        { connectionId, eventType: event.type, error },
        'Failed to send event to specific client'
      );
    }
  }

  /**
   * Broadcast an event to multiple specific clients
   */
  async broadcastToClients<T>(connectionIds: string[], event: NotificationEvent<T>): Promise<void> {
    const sendPromises = connectionIds.map(async (connectionId) => {
      await this.broadcastToClient(connectionId, event);
    });

    await Promise.allSettled(sendPromises);
  }

  /**
   * Broadcast an event to all authenticated clients
   */
  async broadcastToAuthenticated<T>(event: NotificationEvent<T>): Promise<void> {
    const authenticatedClients = Array.from(this.clients.values()).filter(
      client => client.authenticated
    );

    const sendPromises = authenticatedClients.map(async (client) => {
      try {
        await this.sendEventToClient(client.connection, event);
      } catch (error) {
        this.logger.error(
          { connectionId: client.connection.id, eventType: event.type, error },
          'Failed to send event to authenticated client'
        );
      }
    });

    await Promise.allSettled(sendPromises);

    this.logger.info(
      { eventType: event.type, clientCount: authenticatedClients.length },
      'Event broadcast to authenticated clients complete'
    );
  }

  /**
   * Determine which clients should receive an event based on subscriptions and filters
   */
  private getTargetClients<T>(
    event: NotificationEvent<T>,
    subscriptions: ClientSubscription[]
  ): ClientMetadata[] {
    const targetClients = new Set<ClientMetadata>();

    for (const subscription of subscriptions) {
      // Check if event matches subscription filter
      if (this.matchesFilter(event, subscription.filter)) {
        const client = this.clients.get(subscription.connectionId);
        if (client && client.connection.isOpen) {
          targetClients.add(client);
        }
      }
    }

    return Array.from(targetClients);
  }

  /**
   * Check if an event matches a subscription filter
   */
  private matchesFilter<T>(event: NotificationEvent<T>, filter?: EventFilter): boolean {
    // No filter means match all
    if (!filter) {
      return true;
    }

    const data = event.data as any;

    // Check each filter field
    for (const [field, value] of Object.entries(filter)) {
      if (value !== undefined && data[field] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Send an event to a specific client connection
   */
  private async sendEventToClient<T>(
    connection: IConnection,
    event: NotificationEvent<T>
  ): Promise<void> {
    if (!connection.isOpen) {
      throw new Error('Connection is not open');
    }

    const message = JSON.stringify(event);
    await connection.send(message);
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Send an error event to a specific client
   */
  async sendError(
    connectionId: string,
    code: NotificationErrorCode,
    message: string,
    details?: any
  ): Promise<void> {
    const errorPayload: ErrorPayload = {
      code,
      message,
      details,
    };

    const errorEvent = createNotificationEvent(NotificationEventType.ERROR, errorPayload);
    await this.broadcastToClient(connectionId, errorEvent);
  }

  // ============================================================================
  // Statistics and Monitoring
  // ============================================================================

  /**
   * Get statistics about the notification service
   */
  getStats(): {
    clientCount: number;
    authenticatedCount: number;
    totalSubscriptions: number;
    eventTypeCount: number;
  } {
    const authenticatedCount = Array.from(this.clients.values()).filter(
      client => client.authenticated
    ).length;

    const totalSubscriptions = Array.from(this.clients.values()).reduce(
      (sum, client) => sum + client.subscriptions.length,
      0
    );

    return {
      clientCount: this.clients.size,
      authenticatedCount,
      totalSubscriptions,
      eventTypeCount: this.subscriptionsByEvent.size,
    };
  }

  /**
   * Get subscription count for a specific event type
   */
  getSubscriptionCount(eventType: NotificationEventType): number {
    const subscriptions = this.subscriptionsByEvent.get(eventType);
    return subscriptions ? subscriptions.length : 0;
  }

  /**
   * Get all event types with active subscriptions
   */
  getActiveEventTypes(): NotificationEventType[] {
    return Array.from(this.subscriptionsByEvent.keys());
  }
}
