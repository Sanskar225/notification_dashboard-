/**
 * Room Manager
 * Enhanced with default room and room user count broadcasts
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const { sanitizeMessage } = require('./utils');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.initializeDefaultRoom();
  }
  
  // ✅ Initialize default "general" room
  initializeDefaultRoom() {
    const generalRoom = {
      id: 'general',
      name: 'General',
      creator: 'system',
      createdAt: new Date(),
      members: new Map(),
      isActive: true,
      isDefault: true
    };
    
    this.rooms.set('general', generalRoom);
    logger.info('🏠 Default room "general" created');
  }
  
  createRoom(name, creatorId) {
    const sanitizedName = sanitizeMessage(name).substring(0, 50);
    
    if (!sanitizedName) {
      throw new Error('Room name is required');
    }
    
    const roomId = uuidv4().substr(0, 8);
    const room = {
      id: roomId,
      name: sanitizedName,
      creator: creatorId,
      createdAt: new Date(),
      members: new Map(),
      isActive: true,
      isDefault: false
    };
    
    this.rooms.set(roomId, room);
    logger.info(`🏠 Room created: ${sanitizedName} (${roomId}) by ${creatorId}`);
    return roomId;
  }
  
  addToRoom(roomId, socketId, userId, io = null) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      logger.warn(`⚠️ Attempted to join non-existent room: ${roomId} by user ${userId}`);
      return { success: false, error: 'Room not found' };
    }
    
    if (!room.members.has(socketId)) {
      room.members.set(socketId, {
        userId,
        joinedAt: new Date()
      });
      
      // ✅ Enhanced logging
      logger.info(`👥 User joined room: ${userId} -> ${room.name} (${roomId})`, {
        userId,
        roomId,
        roomName: room.name,
        memberCount: room.members.size,
        timestamp: new Date().toISOString()
      });
      
      // ✅ Broadcast room user count update
      if (io) {
        io.to(roomId).emit('room-users-update', {
          roomId,
          roomName: room.name,
          count: room.members.size,
          users: Array.from(room.members.values()).map(m => m.userId),
          action: 'join',
          user: userId,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return { 
      success: true, 
      memberCount: room.members.size,
      room: { id: room.id, name: room.name }
    };
  }
  
  removeFromRoom(roomId, socketId, io = null) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }
    
    if (room.members.has(socketId)) {
      const member = room.members.get(socketId);
      room.members.delete(socketId);
      
      // ✅ Enhanced logging
      logger.info(`👥 User left room: ${member.userId} -> ${room.name} (${roomId})`, {
        userId: member.userId,
        roomId,
        roomName: room.name,
        remainingMembers: room.members.size,
        timestamp: new Date().toISOString()
      });
      
      // ✅ Broadcast room user count update
      if (io) {
        io.to(roomId).emit('room-users-update', {
          roomId,
          roomName: room.name,
          count: room.members.size,
          users: Array.from(room.members.values()).map(m => m.userId),
          action: 'leave',
          user: member.userId,
          timestamp: new Date().toISOString()
        });
      }
      
      // Delete room if empty and not default
      if (room.members.size === 0 && !room.isDefault) {
        this.rooms.delete(roomId);
        logger.info(`🏠 Room deleted: ${room.name} (${roomId}) - empty`);
      }
      
      return { success: true, remainingMembers: room.members.size };
    }
    
    return { success: false, error: 'User not in room' };
  }
  
  removeClientFromAllRooms(socketId, io = null) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.members.has(socketId)) {
        const member = room.members.get(socketId);
        room.members.delete(socketId);
        
        // ✅ Broadcast room user count update on disconnect
        if (io && !room.isDefault) {
          io.to(roomId).emit('room-users-update', {
            roomId,
            roomName: room.name,
            count: room.members.size,
            users: Array.from(room.members.values()).map(m => m.userId),
            action: 'disconnect',
            user: member.userId,
            timestamp: new Date().toISOString()
          });
        }
        
        // Delete non-default empty rooms
        if (room.members.size === 0 && !room.isDefault) {
          this.rooms.delete(roomId);
          logger.info(`🏠 Room deleted: ${room.name} (${roomId}) - empty after client removal`);
        }
      }
    }
  }
  
  getRoomMembers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    
    return Array.from(room.members.entries()).map(([socketId, member]) => ({
      socketId,
      userId: member.userId,
      joinedAt: member.joinedAt
    }));
  }
  
  getAllRooms() {
    // ✅ Enhanced room list with member counts
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      creator: room.creator,
      memberCount: room.members.size,
      createdAt: room.createdAt,
      isDefault: room.isDefault || false,
      members: Array.from(room.members.values()).map(m => m.userId)
    }));
  }
  
  getRoom(roomId) {
    if (!roomId || typeof roomId !== 'string') {
      return null;
    }
    return this.rooms.get(roomId) || null;
  }
  
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }
  
  getActiveRoomCount() {
    return this.rooms.size;
  }
  
  userInRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    for (const member of room.members.values()) {
      if (member.userId === userId) return true;
    }
    return false;
  }
  
  getRoomUserCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.members.size : 0;
  }
}

module.exports = new RoomManager();