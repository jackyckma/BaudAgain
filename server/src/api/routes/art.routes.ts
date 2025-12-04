/**
 * Art Gallery API Routes
 * 
 * REST API endpoints for AI-generated ANSI art gallery.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ArtGalleryRepository } from '../../db/repositories/ArtGalleryRepository.js';
import type { ANSIArtGenerator, ArtStyle, ColorTheme } from '../../services/ANSIArtGenerator.js';
import type { JWTUtil } from '../../auth/jwt.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';
import { createUserAuthMiddleware } from '../middleware/auth.middleware.js';

interface ArtRouteDependencies {
  artGalleryRepository: ArtGalleryRepository;
  artGenerator?: ANSIArtGenerator;
  jwtUtil: JWTUtil;
}

interface GenerateArtBody {
  description: string;
  style?: ArtStyle;
  colorTheme?: ColorTheme;
  title?: string;
  width?: number;
  height?: number;
}

interface DeleteArtParams {
  id: string;
}

interface GetArtParams {
  id: string;
}

interface GetArtQuery {
  limit?: string;
  offset?: string;
}

export async function registerArtRoutes(
  server: FastifyInstance,
  deps: ArtRouteDependencies
): Promise<void> {
  const { artGalleryRepository, artGenerator, jwtUtil } = deps;
  const authenticateUser = createUserAuthMiddleware(jwtUtil);
  
  /**
   * POST /api/v1/art/generate
   * Generate new AI art and optionally save to gallery
   */
  server.post<{ Body: GenerateArtBody }>(
    '/api/v1/art/generate',
    {
      preHandler: authenticateUser,
    },
    async (request: FastifyRequest<{ Body: GenerateArtBody }>, reply: FastifyReply) => {
      try {
        if (!artGenerator) {
          ErrorHandler.sendServiceUnavailableError(reply, 'Art generation service is not available');
          return;
        }
        
        const { description, style, colorTheme, title, width, height } = request.body;
        
        // Validate description
        if (!description || description.trim().length < 3) {
          ErrorHandler.sendBadRequestError(reply, 'Description must be at least 3 characters');
          return;
        }
        
        if (description.length > 200) {
          ErrorHandler.sendBadRequestError(reply, 'Description must be less than 200 characters');
          return;
        }
        
        // Generate the art
        const art = await artGenerator.generateFramedArt(
          {
            description: description.trim(),
            style: style || 'retro',
            width: width || 60,
            height: height || 15,
            colorTheme: colorTheme || '16-color',
            applyColors: true,
          },
          {
            title: title || description.substring(0, 40),
            attribution: (request as any).user?.handle || 'Anonymous',
            frameWidth: 70,
            includeTimestamp: false,
          }
        );
        
        // If title provided, save to gallery
        let savedArt = null;
        if (title && (request as any).user?.id) {
          savedArt = artGalleryRepository.createArtPiece({
            userId: (request as any).user.id,
            title: title.trim(),
            description: description.trim(),
            artContent: art.framedContent || art.content,
            style: style || 'retro',
          });
        }
        
        return reply.status(200).send({
          success: true,
          art: {
            content: art.content,
            framedContent: art.framedContent || art.content,
            description: description.trim(),
            style: style || 'retro',
            colorTheme: colorTheme || '16-color',
          },
          saved: savedArt ? {
            id: savedArt.id,
            title: savedArt.title,
            createdAt: savedArt.createdAt,
          } : null,
        });
      } catch (error) {
        server.log.error({ error }, 'Error generating art');
        ErrorHandler.sendInternalError(reply, 'Failed to generate art');
        return;
      }
    }
  );
  
  /**
   * GET /api/v1/art
   * List all saved art pieces (paginated)
   */
  server.get<{ Querystring: GetArtQuery }>(
    '/api/v1/art',
    async (request: FastifyRequest<{ Querystring: GetArtQuery }>, reply: FastifyReply) => {
      try {
        const limit = parseInt(request.query.limit || '50');
        const offset = parseInt(request.query.offset || '0');
        
        // Validate pagination params
        if (limit < 1 || limit > 100) {
          ErrorHandler.sendBadRequestError(reply, 'Limit must be between 1 and 100');
          return;
        }
        
        if (offset < 0) {
          ErrorHandler.sendBadRequestError(reply, 'Offset must be non-negative');
          return;
        }
        
        const artPieces = artGalleryRepository.getAllArtPieces(limit, offset);
        const totalCount = artGalleryRepository.getArtPieceCount();
        
        return reply.status(200).send({
          success: true,
          art: artPieces.map(art => ({
            id: art.id,
            title: art.title,
            description: art.description,
            style: art.style,
            authorHandle: art.authorHandle,
            createdAt: art.createdAt,
          })),
          pagination: {
            limit,
            offset,
            total: totalCount,
            hasMore: offset + limit < totalCount,
          },
        });
      } catch (error) {
        server.log.error({ error }, 'Error listing art');
        ErrorHandler.sendInternalError(reply, 'Failed to list art');
        return;
      }
    }
  );
  
  /**
   * GET /api/v1/art/:id
   * Get a specific art piece with full content
   */
  server.get<{ Params: GetArtParams }>(
    '/api/v1/art/:id',
    async (request: FastifyRequest<{ Params: GetArtParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        const art = artGalleryRepository.getArtPiece(id);
        
        if (!art) {
          ErrorHandler.sendNotFoundError(reply, 'Art piece not found');
          return;
        }
        
        return reply.status(200).send({
          success: true,
          art: {
            id: art.id,
            title: art.title,
            description: art.description,
            artContent: art.artContent,
            style: art.style,
            authorHandle: art.authorHandle,
            createdAt: art.createdAt,
          },
        });
      } catch (error) {
        server.log.error({ error }, 'Error getting art');
        ErrorHandler.sendInternalError(reply, 'Failed to get art');
        return;
      }
    }
  );
  
  /**
   * DELETE /api/v1/art/:id
   * Delete an art piece (owner only)
   */
  server.delete<{ Params: DeleteArtParams }>(
    '/api/v1/art/:id',
    {
      preHandler: authenticateUser,
    },
    async (request: FastifyRequest<{ Params: DeleteArtParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        if (!(request as any).user?.id) {
          ErrorHandler.sendUnauthorizedError(reply, 'Authentication required');
          return;
        }
        
        // Check if art exists and belongs to user
        const art = artGalleryRepository.getArtPiece(id);
        
        if (!art) {
          ErrorHandler.sendNotFoundError(reply, 'Art piece not found');
          return;
        }
        
        if (art.userId !== (request as any).user.id) {
          ErrorHandler.sendForbiddenError(reply, 'You can only delete your own art');
          return;
        }
        
        // Delete the art
        const deleted = artGalleryRepository.deleteArtPiece(id, (request as any).user.id);
        
        if (!deleted) {
          ErrorHandler.sendInternalError(reply, 'Failed to delete art');
          return;
        }
        
        return reply.status(200).send({
          success: true,
          message: 'Art piece deleted successfully',
        });
      } catch (error) {
        server.log.error({ error }, 'Error deleting art');
        ErrorHandler.sendInternalError(reply, 'Failed to delete art');
        return;
      }
    }
  );
}
