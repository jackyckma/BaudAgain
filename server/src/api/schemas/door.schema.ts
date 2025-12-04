/**
 * JSON Schema definitions for door game endpoints
 */

export const listDoorsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        doors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              minAccessLevel: { type: 'number' }
            }
          }
        }
      }
    }
  }
};

export const enterDoorSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Door game ID'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        output: { type: 'string' },
        doorId: { type: 'string' },
        doorName: { type: 'string' },
        resumed: { type: 'boolean' }
      }
    }
  }
};

export const sendDoorInputSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Door game ID'
      }
    },
    additionalProperties: false
  },
  body: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'User input to send to door game'
      },
      sessionId: {
        type: 'string',
        description: 'Optional session ID for multi-session support'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        output: { type: 'string' },
        exited: { type: 'boolean' },
        sessionId: { type: 'string' }
      }
    }
  }
};

export const exitDoorSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Door game ID'
      }
    },
    additionalProperties: false
  },
  body: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'Optional session ID for multi-session support'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        output: { type: 'string' },
        exited: { type: 'boolean' }
      }
    }
  }
};

export const getDoorSessionSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Door game ID'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        inDoor: { type: 'boolean' },
        sessionId: { type: ['string', 'null'] },
        doorId: { type: 'string' },
        doorName: { type: 'string' },
        lastActivity: { type: 'string' },
        gameState: { type: 'object' },
        history: { type: 'array' },
        hasSavedSession: { type: 'boolean' },
        savedState: { type: 'object' },
        savedHistory: { type: 'array' }
      }
    }
  }
};

export const resumeDoorSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Door game ID'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        output: { type: 'string' },
        doorId: { type: 'string' },
        doorName: { type: 'string' },
        resumed: { type: 'boolean' }
      }
    }
  }
};

export const getMySavedSessionsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        sessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              doorId: { type: 'string' },
              doorName: { type: 'string' },
              lastActivity: { type: 'string' },
              state: { type: 'object' }
            }
          }
        },
        totalCount: { type: 'number' }
      }
    }
  }
};

export const getAllDoorSessionsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        sessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              userId: { type: 'string' },
              handle: { type: 'string' },
              doorId: { type: 'string' },
              doorName: { type: 'string' },
              lastActivity: { type: 'string' },
              inactiveTime: { type: 'number' }
            }
          }
        },
        totalCount: { type: 'number' }
      }
    }
  }
};

export const getDoorStatsSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Door game ID'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        doorId: { type: 'string' },
        doorName: { type: 'string' },
        activeSessions: { type: 'number' },
        timeout: { type: 'number' }
      }
    }
  }
};
