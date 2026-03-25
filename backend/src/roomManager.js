/**
 * Room Manager
 * Handles group-based notifications and room management
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> room object
  }
  
  createRoom(name, creatorId) {
    const roomId = uuidv4().substr(0, 8);
    const room = {
      id: roomId,
      name,
      creator: creatorId,
      createdAt: new Date(),
      members: new Map(), // socketId -> { userId, joinedAt }
      isActive: true
    };
    
    this.rooms.set(roomId, room);
    logger.info(`Room created: ${name} (${roomId}) by ${creatorId}`);
    return roomId;
  }
  
  addToRoom(roomId, socketId, userId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }
    
    if (!room.members.has(socketId)) {
      room.members.set(socketId, {
        userId,
        joinedAt: new Date()
      });
      logger.info(`User ${userId} joined room ${room.name} (${roomId})`);
    }
    
    return { 
      success: true, 
      memberCount: room.members.size,
      room: { id: room.id, name: room.name }
    };
  }
  
  removeFromRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    
    if (room && room.members.has(socketId)) {
      const member = room.members.get(socketId);
      room.members.delete(socketId);
      logger.info(`User ${member.userId} left room ${room.name} (${roomId})`);
      
      // Delete room if empty
      if (room.members.size === 0) {
        this.rooms.delete(roomId);
        logger.info(`Room ${room.name} (${roomId}) deleted (empty)`);
      }
      
      return { success: true, remainingMembers: room.members.size };
    }
    
    return { success: false };
  }
  
  removeClientFromAllRooms(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.members.has(socketId)) {
        room.members.delete(socketId);
        logger.debug(`Removed client ${socketId} from room ${room.name}`);
        
        // Delete empty rooms
        if (room.members.size === 0) {
          this.rooms.delete(roomId);
          logger.info(`Room ${room.name} (${roomId}) deleted (empty after client removal)`);
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
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      creator: room.creator,
      memberCount: room.members.size,
      createdAt: room.createdAt,
      members: Array.from(room.members.values()).map(m => m.userId)
    }));
  }
  
  getRoom(roomId) {
    return this.rooms.get(roomId);
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
}

module.exports = new RoomManager();