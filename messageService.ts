import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import { User } from '@shared/schema';
import { parse as parseCookie } from 'cookie';
import type { IncomingMessage } from 'http';
import { storage } from '../storage';

interface ConnectedUser {
  user: User;
  socket: WebSocket;
}

export class MessageService {
  private wss: WebSocketServer;
  private connectedUsers: Map<number, ConnectedUser> = new Map();

  constructor(server: Server) {
    console.log('Initializing WebSocket server...');

    this.wss = new WebSocketServer({ 
      server,
      path: '/websocket',
      verifyClient: async ({ req }, done) => {
        try {
          console.log('WebSocket connection attempt');

          const sessionId = this.getSessionIdFromCookie(req);
          if (!sessionId) {
            console.log('WebSocket connection rejected: No session ID found');
            done(false, 401, 'Unauthorized - No session ID');
            return;
          }

          const user = await this.getUserFromSession(sessionId);
          if (!user) {
            console.log('WebSocket connection rejected: Invalid session');
            done(false, 401, 'Unauthorized - Invalid session');
            return;
          }

          (req as any).user = user;
          console.log('WebSocket client authenticated:', user.id);
          done(true);
        } catch (error) {
          console.error('WebSocket authentication error:', error);
          done(false, 500, 'Internal Server Error');
        }
      }
    });

    this.setupWebSocket();
    console.log('WebSocket server initialized successfully');
  }

  private getSessionIdFromCookie(req: IncomingMessage): string | null {
    try {
      const cookies = parseCookie(req.headers.cookie || '');
      const sessionId = cookies['travel.sid'] || null;
      console.log('Session ID from cookie:', sessionId ? 'Found' : 'Not found');
      return sessionId;
    } catch (error) {
      console.error('Error parsing cookies:', error);
      return null;
    }
  }

  private async getUserFromSession(sessionId: string): Promise<User | null> {
    try {
      console.log('Getting user from session:', sessionId);

      if (!storage.sessionStore) {
        console.error('Session store not initialized');
        return null;
      }

      const session = await new Promise((resolve) => {
        storage.sessionStore.get(sessionId, (err, session) => {
          if (err) {
            console.error('Session store error:', err);
            resolve(null);
            return;
          }
          resolve(session);
        });
      });

      if (!session) {
        console.log('No session found');
        return null;
      }

      // @ts-ignore - session type is not properly defined
      if (!session.passport?.user) {
        console.log('No passport user in session');
        return null;
      }

      // @ts-ignore - session type is not properly defined
      const user = await storage.getUser(session.passport.user);
      console.log('User from storage:', user ? 'Found' : 'Not found');
      return user;
    } catch (error) {
      console.error('Error getting user from session:', error);
      return null;
    }
  }

  private setupWebSocket() {
    this.wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
      const user = (request as any).user;
      if (!user) {
        console.error('WebSocket connection without user data');
        socket.close();
        return;
      }

      console.log(`WebSocket connected for user: ${user.id}`);
      this.handleConnection(socket, user);

      socket.on('message', (data: string) => {
        try {
          this.handleMessage(user.id, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          socket.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
        }
      });

      socket.on('close', () => {
        console.log(`WebSocket disconnected for user: ${user.id}`);
        this.handleDisconnection(user.id);
      });

      socket.on('error', (error) => {
        console.error(`WebSocket error for user ${user.id}:`, error);
      });

      // Send initial connection success message
      socket.send(JSON.stringify({ 
        type: 'connection_status', 
        status: 'connected',
        userId: user.id 
      }));
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  private handleConnection(socket: WebSocket, user: User) {
    if (this.connectedUsers.has(user.id)) {
      const existingConnection = this.connectedUsers.get(user.id);
      if (existingConnection?.socket.readyState === WebSocket.OPEN) {
        console.log(`Closing existing connection for user: ${user.id}`);
        existingConnection.socket.close();
      }
    }

    this.connectedUsers.set(user.id, { user, socket });
    this.broadcastUserList();
    console.log(`User ${user.id} connected, total users: ${this.connectedUsers.size}`);
  }

  private handleDisconnection(userId: number) {
    this.connectedUsers.delete(userId);
    this.broadcastUserList();
    console.log(`User ${userId} disconnected, remaining users: ${this.connectedUsers.size}`);
  }

  private handleMessage(fromUserId: number, data: string) {
    try {
      const message = JSON.parse(data);
      console.log(`Received message from user ${fromUserId}:`, message.type);

      if (message.type === 'direct_message' && message.toUserId) {
        this.sendDirectMessage(fromUserId, message.toUserId, message.content);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private sendDirectMessage(fromUserId: number, toUserId: number, content: string) {
    const toUser = this.connectedUsers.get(toUserId);
    const fromUser = this.connectedUsers.get(fromUserId);

    if (!toUser || !fromUser) {
      console.log(`Cannot send message: user not found (from: ${fromUserId}, to: ${toUserId})`);
      return;
    }

    const messageData = JSON.stringify({
      type: 'direct_message',
      fromUser: fromUser.user,
      content,
      timestamp: new Date().toISOString()
    });

    if (toUser.socket.readyState === WebSocket.OPEN) {
      toUser.socket.send(messageData);
      console.log(`Message sent to user ${toUserId}`);
    }

    if (fromUser.socket.readyState === WebSocket.OPEN) {
      fromUser.socket.send(messageData);
      console.log(`Message copy sent to sender ${fromUserId}`);
    }
  }

  private broadcastUserList() {
    const onlineUsers = Array.from(this.connectedUsers.values()).map(({ user }) => ({
      id: user.id,
      username: user.username
    }));

    const message = JSON.stringify({
      type: 'user_list',
      users: onlineUsers
    });

    console.log(`Broadcasting user list: ${onlineUsers.length} users online`);
    this.connectedUsers.forEach(({ socket }) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });
  }
}

export const messageService = (server: Server) => new MessageService(server);