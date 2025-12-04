/**
 * Notification Handler for Terminal Client
 * 
 * Handles WebSocket notifications from the server
 */

import type { Terminal } from '@xterm/xterm';

export enum NotificationEventType {
  MESSAGE_NEW = 'MESSAGE_NEW',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  DOOR_ENTERED = 'DOOR_ENTERED',
  DOOR_EXITED = 'DOOR_EXITED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export interface NotificationEvent {
  type: NotificationEventType;
  timestamp: string;
  data: any;
}

export class NotificationHandler {
  private terminal: Terminal;
  private enabled: boolean = true;

  constructor(terminal: Terminal) {
    this.terminal = terminal;
  }

  handleNotification(event: NotificationEvent) {
    if (!this.enabled) {
      return;
    }

    switch (event.type) {
      case NotificationEventType.MESSAGE_NEW:
        this.handleNewMessage(event.data);
        break;
      case NotificationEventType.USER_JOINED:
        this.handleUserJoined(event.data);
        break;
      case NotificationEventType.USER_LEFT:
        this.handleUserLeft(event.data);
        break;
      case NotificationEventType.DOOR_ENTERED:
        this.handleDoorEntered(event.data);
        break;
      case NotificationEventType.DOOR_EXITED:
        this.handleDoorExited(event.data);
        break;
      case NotificationEventType.SYSTEM_ANNOUNCEMENT:
        this.handleSystemAnnouncement(event.data);
        break;
    }
  }

  private handleNewMessage(data: any) {
    const { messageBase, message } = data;
    this.terminal.write(
      `\r\n\x1b[96m[New Message in ${messageBase.name}]\x1b[0m ${message.subject} by ${message.author}\r\n`
    );
  }

  private handleUserJoined(data: any) {
    const { handle } = data;
    this.terminal.write(
      `\r\n\x1b[92m[User Joined]\x1b[0m ${handle} has connected to the BBS\r\n`
    );
  }

  private handleUserLeft(data: any) {
    const { handle } = data;
    this.terminal.write(
      `\r\n\x1b[93m[User Left]\x1b[0m ${handle} has disconnected\r\n`
    );
  }

  private handleDoorEntered(data: any) {
    const { handle, doorName } = data;
    this.terminal.write(
      `\r\n\x1b[95m[Door Activity]\x1b[0m ${handle} entered ${doorName}\r\n`
    );
  }

  private handleDoorExited(data: any) {
    const { handle, doorName } = data;
    this.terminal.write(
      `\r\n\x1b[95m[Door Activity]\x1b[0m ${handle} exited ${doorName}\r\n`
    );
  }

  private handleSystemAnnouncement(data: any) {
    const { message } = data;
    this.terminal.write(
      `\r\n\x1b[1;33m[System Announcement]\x1b[0m ${message}\r\n`
    );
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}
