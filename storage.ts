import { users, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updateUserOTP(phone: string, otp: string, expiryTime: Date): Promise<void>;
  verifyUserPhone(phone: string): Promise<void>;
  sessionStore: session.Store;
}

class InMemoryStorage implements IStorage {
  private users: User[] = [];
  private nextId = 1;
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    console.log('InMemoryStorage initialized');
    this.initializeTestUsers();
  }

  private async initializeTestUsers() {
    try {
      // Create guest user if it doesn't exist
      const guestUser = await this.getUserByUsername('guest');
      if (!guestUser) {
        const hashedGuestPassword = await hashPassword('welcome123');
        await this.createUser({
          username: 'guest',
          password: hashedGuestPassword,
          display_name: 'Guest User',
        });
        console.log('Guest user created successfully');
      }

      // Create test user if it doesn't exist
      const testUser = await this.getUserByUsername('test@example.com');
      if (!testUser) {
        const hashedTestPassword = await hashPassword('test123');
        await this.createUser({
          username: 'test@example.com',
          password: hashedTestPassword,
          display_name: 'Test User',
        });
        console.log('Test user created successfully');
      }
    } catch (error) {
      console.error('Error creating test users:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const user = this.users.find(u => u.id === id);
    console.log('Getting user by ID:', id, user ? 'found' : 'not found');
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = this.users.find(u => u.username === username);
    console.log('Getting user by username:', username, user ? 'found' : 'not found');
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const user = this.users.find(u => u.phone_number === phone);
    console.log('Getting user by phone:', phone, user ? 'found' : 'not found');
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const user = this.users.find(u => u.google_id === googleId);
    console.log('Getting user by Google ID:', googleId, user ? 'found' : 'not found');
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log('Creating new user:', { username: insertUser.username });

    if (!insertUser.password) {
      throw new Error('Password is required');
    }

    const user: User = {
      id: this.nextId++,
      username: insertUser.username,
      password: insertUser.password,
      phone_number: insertUser.phone_number || null,
      phone_verified: false,
      otp: null,
      otp_expires: null,
      preferences: insertUser.preferences || null,
      google_id: insertUser.google_id || null,
      display_name: insertUser.display_name || null,
      avatar_url: insertUser.avatar_url || null
    };

    this.users.push(user);
    console.log('User created:', { id: user.id, username: user.username });
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      // Ensure required fields aren't overwritten
      id: user.id,
      username: updates.username || user.username,
      password: updates.password || user.password,
    };

    const userIndex = this.users.findIndex(u => u.id === id);
    this.users[userIndex] = updatedUser;

    console.log('Updated user:', { id: updatedUser.id, username: updatedUser.username });
    return updatedUser;
  }

  async updateUserOTP(phone: string, otp: string, expiryTime: Date): Promise<void> {
    const user = await this.getUserByPhone(phone);

    if (!user) {
      console.log('Creating new user for OTP verification');
      const tempUser = await this.createUser({
        username: phone,
        password: `temp.${Date.now()}`, // Temporary password
        phone_number: phone
      });
      tempUser.otp = otp;
      tempUser.otp_expires = expiryTime;
    } else {
      user.otp = otp;
      user.otp_expires = expiryTime;
    }
    console.log('Updated OTP for user:', phone);
  }

  async verifyUserPhone(phone: string): Promise<void> {
    const user = await this.getUserByPhone(phone);
    if (user) {
      user.phone_verified = true;
      user.otp = null;
      user.otp_expires = null;
      console.log('Phone verified for user:', user.id);
    }
  }
}

export const storage = new InMemoryStorage();